import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey, x-paystack-signature",
};

function response(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function verifySignature(body: string, signature: string | null, secret: string) {
  if (!signature) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"],
  );
  const sigBuffer = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  const computed = Array.from(new Uint8Array(sigBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return computed === signature;
}

async function sendOrderNotification(orderId: string, eventType: string) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) return;
  await fetch(`${supabaseUrl}/functions/v1/send-order-notification`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${serviceKey}` },
    body: JSON.stringify({ order_id: orderId, event_type: eventType }),
  }).catch((error) => console.error("send-order-notification invoke failed", error));
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const paystackSecret = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!paystackSecret) return response({ error: "Missing PAYSTACK_SECRET_KEY" }, 500);

    const body = await req.text();
    if (!(await verifySignature(body, req.headers.get("x-paystack-signature"), paystackSecret))) {
      return response({ error: "Invalid signature" }, 401);
    }

    const event = JSON.parse(body);
    if (event.event !== "charge.success") return response({ received: true });

    const reference = event.data?.reference;
    const orderId = event.data?.metadata?.order_id || reference;
    if (!orderId) return response({ error: "Missing order reference" }, 400);

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: existing, error: existingError } = await supabase
      .from("orders")
      .select("id, status")
      .eq("id", orderId)
      .single();
    if (existingError || !existing) return response({ error: "Order not found" }, 404);
    if (existing.status === "paid") return response({ success: true, status: "already_paid" });

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .update({ status: "paid", payment_reference: reference, payment_provider: "paystack" })
      .eq("id", orderId)
      .select("*, order_items(*, product:products(*))")
      .single();
    if (orderError) throw orderError;

    const downloads = [];
    for (const item of order.order_items || []) {
      if (item.fulfillment_type === "fdm" && item.product?.stl_file_path) {
        const expiresIn = 15 * 60;
        const { data: signedData, error: signError } = await supabase.storage.from("stl-files").createSignedUrl(item.product.stl_file_path, expiresIn);
        if (!signError && signedData) {
          downloads.push(supabase.from("order_items").update({ download_url: signedData.signedUrl, download_expires_at: new Date(Date.now() + expiresIn * 1000).toISOString() }).eq("id", item.id));
        }
      } else if (item.fulfillment_type !== "fdm") {
        await supabase.rpc("decrement_product_stock", { product_id_input: item.product_id, quantity_input: item.quantity }).catch((error) => console.error("stock decrement failed", error));
      }
    }
    await Promise.all(downloads);

    if (order.discount_code) await supabase.rpc("increment_discount_usage", { code_input: order.discount_code }).catch(() => null);

    await sendOrderNotification(orderId, "order_confirmed");
    if ((order.order_items || []).some((item: { fulfillment_type: string }) => item.fulfillment_type === "fdm")) {
      await sendOrderNotification(orderId, "download_ready");
    }

    return response({ success: true });
  } catch (err) {
    console.error("paystack-webhook error", err);
    return response({ error: "Internal server error" }, 500);
  }
});
