import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-korapay-signature",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function toHex(buffer: ArrayBuffer) {
  return [...new Uint8Array(buffer)].map(byte => byte.toString(16).padStart(2, "0")).join("");
}

function constantTimeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i += 1) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

async function signData(data: unknown, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signed = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(JSON.stringify(data)));
  return toHex(signed);
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

async function finalizeOrder(admin: ReturnType<typeof createClient>, orderId: string, reference: string, provider: string) {
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
  if ((order.order_items || []).some((item: { fulfillment_type: string }) => item.fulfillment_type === "fdm")) {
    await sendOrderNotification(orderId, "download_ready");
  }

  return order;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const koraSecret = Deno.env.get("KORA_SECRET_KEY");
    if (!koraSecret) return json({ received: true, ignored: "Missing KORA_SECRET_KEY" });

    const payload = await req.json();
    const signature = req.headers.get("x-korapay-signature");
    const expectedSignature = await signData(payload?.data || {}, koraSecret);
    if (!signature || !constantTimeEqual(expectedSignature, signature)) {
      return json({ received: true, ignored: "Invalid signature" });
    }

    const event = String(payload?.event || "");
    const data = payload?.data || {};
    const reference = String(data.reference || "");
    const paymentReference = String(data.payment_reference || reference);
    if (!reference) return json({ received: true, ignored: "Missing reference" });

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    if (event === "charge.success" && String(data.status || "").toLowerCase() === "success") {
      await finalizeOrder(admin, reference, paymentReference, "kora");
      return json({ received: true, status: "paid" });
    }

    if (event === "charge.failed") {
      await admin
        .from("orders")
        .update({ status: "cancelled", payment_reference: paymentReference || reference, payment_provider: "kora" })
        .eq("id", reference)
        .eq("status", "pending");
      return json({ received: true, status: "cancelled" });
    }

    return json({ received: true, ignored: event || "unknown_event" });
  } catch (error) {
    console.error("kora-webhook error", error);
    return json({ received: true, error: "Internal server error" });
  }
});
