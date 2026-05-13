import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function toMinorUnits(amount: number) {
  return Math.round((Number(amount) + Number.EPSILON) * 100);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) return json({ error: "Unauthorized" }, 401);

    const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecret) return json({ error: "Missing STRIPE_SECRET_KEY" }, 500);

    const { order_id, success_url, cancel_url } = await req.json();
    if (!order_id || !success_url || !cancel_url) {
      return json({ error: "order_id, success_url, and cancel_url are required" }, 400);
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: order, error: orderError } = await admin
      .from("orders")
      .select("id, user_id, currency, total_amount, order_items(*, product:products(name, description, image_url))")
      .eq("id", order_id)
      .single();

    if (orderError || !order) return json({ error: "Order not found" }, 404);
    if (order.user_id !== user.id) return json({ error: "Forbidden" }, 403);

    const params = new URLSearchParams();
    params.set("mode", "payment");
    params.set("success_url", success_url);
    params.set("cancel_url", cancel_url);
    params.set("customer_email", user.email || "");
    params.set("client_reference_id", order_id);
    params.set("metadata[order_id]", order_id);
    params.set("payment_method_types[0]", "card");
    params.set("billing_address_collection", "auto");

    order.order_items?.forEach((item: { quantity: number; unit_price: number; product?: { name?: string; description?: string; image_url?: string } }, index: number) => {
      params.set(`line_items[${index}][quantity]`, String(item.quantity));
      params.set(`line_items[${index}][price_data][currency]`, String(order.currency || "usd").toLowerCase());
      params.set(`line_items[${index}][price_data][unit_amount]`, String(toMinorUnits(item.unit_price)));
      params.set(`line_items[${index}][price_data][product_data][name]`, item.product?.name || `Wingxtra item ${index + 1}`);
      if (item.product?.description) {
        params.set(`line_items[${index}][price_data][product_data][description]`, item.product.description.slice(0, 300));
      }
      if (item.product?.image_url) {
        params.set(`line_items[${index}][price_data][product_data][images][0]`, item.product.image_url);
      }
    });

    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecret}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const stripeData = await stripeRes.json();
    if (!stripeRes.ok || !stripeData?.url) {
      return json({ error: stripeData?.error?.message || "Stripe session could not be created" }, 400);
    }

    return json({ success: true, url: stripeData.url, session_id: stripeData.id });
  } catch (error) {
    console.error("create-stripe-checkout-session error", error);
    return json({ error: "Internal server error" }, 500);
  }
});
