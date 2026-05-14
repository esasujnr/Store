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
async function sendOrderNotification(orderId: string, eventType: string) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) return;

  await fetch(`${supabaseUrl}/functions/v1/send-order-notification`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({ order_id: orderId, event_type: eventType }),
  }).catch((error) => console.error("send-order-notification invoke failed", error));
}


async function finalizeOrder(admin: ReturnType<typeof createClient>, orderId: string, reference: string, provider: string, userEmail?: string) {
  const { data: order, error: orderError } = await admin
    .from("orders")
    .update({ status: "paid", payment_reference: reference, payment_provider: provider })
    .eq("id", orderId)
    .select("*, order_items(*, product:products(*))")
    .single();

  if (orderError) throw orderError;

  const downloadPromises = [];
  for (const item of order.order_items || []) {
    if (item.fulfillment_type === "fdm" && item.product?.stl_file_path) {
      const expiresIn = 15 * 60;
      const { data: signedData, error: signError } = await admin.storage
        .from("stl-files")
        .createSignedUrl(item.product.stl_file_path, expiresIn);

      if (!signError && signedData) {
        downloadPromises.push(
          admin
            .from("order_items")
            .update({
              download_url: signedData.signedUrl,
              download_expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
            })
            .eq("id", item.id),
        );
      }
    }
  }

  await Promise.all(downloadPromises);

  for (const item of order.order_items || []) {
    if (item.fulfillment_type !== "fdm") {
      await admin.rpc("decrement_product_stock", {
        product_id_input: item.product_id,
        quantity_input: item.quantity,
      }).catch((error) => console.error("stock decrement failed", error));
    }
  }

  if (order.discount_code) {
    await admin.rpc("increment_discount_usage", { code_input: order.discount_code }).catch(() => null);
  }

  await sendOrderNotification(orderId, "order_confirmed");
  if ((order.order_items || []).some((i: { fulfillment_type: string }) => i.fulfillment_type === "fdm")) {
    await sendOrderNotification(orderId, "download_ready");
  }

  return order;
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

    const { provider, order_id, reference, session_id } = await req.json();
    if (!provider || !order_id) return json({ error: "provider and order_id are required" }, 400);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: order, error: orderError } = await admin
      .from("orders")
      .select("id, user_id, status, currency")
      .eq("id", order_id)
      .single();

    if (orderError || !order) return json({ error: "Order not found" }, 404);
    if (order.user_id !== user.id) return json({ error: "Forbidden" }, 403);

    if (order.status === "paid") {
      return json({ success: true, status: "paid" });
    }

    if (provider === "paystack") {
      const paystackSecret = Deno.env.get("PAYSTACK_SECRET_KEY");
      if (!paystackSecret) return json({ error: "Missing PAYSTACK_SECRET_KEY" }, 500);
      if (!reference) return json({ error: "reference is required for Paystack verification" }, 400);

      const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
        headers: { Authorization: `Bearer ${paystackSecret}` },
      });
      const verifyData = await verifyRes.json();

      if (!verifyRes.ok || !verifyData?.status || verifyData?.data?.status !== "success") {
        return json({ error: verifyData?.message || "Paystack verification failed" }, 400);
      }

      await finalizeOrder(admin, order_id, verifyData.data.reference, "paystack", user.email || undefined);
      return json({ success: true, status: "paid", provider: "paystack" });
    }

    if (provider === "stripe") {
      const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");
      if (!stripeSecret) return json({ error: "Missing STRIPE_SECRET_KEY" }, 500);
      if (!session_id) return json({ error: "session_id is required for Stripe verification" }, 400);

      const stripeRes = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(session_id)}`, {
        headers: { Authorization: `Bearer ${stripeSecret}` },
      });
      const stripeData = await stripeRes.json();

      if (!stripeRes.ok || stripeData?.payment_status !== "paid") {
        return json({ error: stripeData?.error?.message || "Stripe payment is not complete yet" }, 400);
      }

      await admin
        .from("orders")
        .update({ currency: String(stripeData.currency || order.currency).toUpperCase() })
        .eq("id", order_id);

      await finalizeOrder(admin, order_id, stripeData.payment_intent || stripeData.id, "stripe", user.email || undefined);
      return json({ success: true, status: "paid", provider: "stripe" });
    }

    return json({ error: "Unsupported provider" }, 400);
  } catch (error) {
    console.error("verify-payment error", error);
    return json({ error: "Internal server error" }, 500);
  }
});
