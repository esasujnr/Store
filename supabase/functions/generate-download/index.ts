import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate the user's JWT
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { order_item_id } = await req.json();
    if (!order_item_id) {
      return new Response(JSON.stringify({ error: "order_item_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role for storage operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify user owns this order item via the order
    const { data: item, error: itemError } = await supabaseAdmin
      .from("order_items")
      .select("*, order:orders(user_id, status), product:products(stl_file_path)")
      .eq("id", order_item_id)
      .maybeSingle();

    if (itemError || !item) {
      return new Response(JSON.stringify({ error: "Order item not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Security checks
    if (item.order?.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (item.order?.status !== "paid" && item.order?.status !== "delivered") {
      return new Response(JSON.stringify({ error: "Order not paid" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (item.fulfillment_type !== "fdm") {
      return new Response(JSON.stringify({ error: "Not a digital item" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stlPath = item.product?.stl_file_path;
    if (!stlPath) {
      return new Response(JSON.stringify({ error: "STL file not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate 15-minute signed URL
    const expiresIn = 15 * 60;
    const { data: signedData, error: signError } = await supabaseAdmin.storage
      .from("stl-files")
      .createSignedUrl(stlPath, expiresIn);

    if (signError || !signedData) {
      throw signError || new Error("Failed to create signed URL");
    }

    // Persist URL and expiry on the order item
    await supabaseAdmin
      .from("order_items")
      .update({
        download_url: signedData.signedUrl,
        download_expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
        download_count: item.download_count + 1,
      })
      .eq("id", order_item_id);

    return new Response(
      JSON.stringify({ url: signedData.signedUrl, expires_in: expiresIn }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Generate download error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
