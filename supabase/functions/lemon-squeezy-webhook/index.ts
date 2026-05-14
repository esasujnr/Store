import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-Signature",
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

async function verifySignature(rawBody: string, signature: string | null, secret: string) {
  if (!signature) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signed = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
  return constantTimeEqual(toHex(signed), signature);
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

  if (order.discount_code) {
    await admin.rpc("increment_discount_usage", { code_input: order.discount_code }).catch(() => null);
  }

  await sendOrderNotification(orderId, "order_confirmed");
  await sendOrderNotification(orderId, "download_ready");

  return order;
}

function findOrderId(payload: Record<string, unknown>) {
  const meta = payload.meta as Record<string, unknown> | undefined;
  const data = payload.data as Record<string, unknown> | undefined;
  const attributes = data?.attributes as Record<string, unknown> | undefined;
  const customFromMeta = meta?.custom_data as Record<string, unknown> | undefined;
  const customFromAttributes = attributes?.custom_data as Record<string, unknown> | undefined;
  const customFromCheckout = (attributes?.checkout_data as Record<string, unknown> | undefined)?.custom as Record<string, unknown> | undefined;

  return String(
    customFromMeta?.order_id
      || customFromAttributes?.order_id
      || customFromCheckout?.order_id
      || "",
  );
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const secret = Deno.env.get("LEMON_SQUEEZY_WEBHOOK_SECRET");
    if (!secret) return json({ error: "Missing LEMON_SQUEEZY_WEBHOOK_SECRET" }, 500);

    const rawBody = await req.text();
    const signature = req.headers.get("X-Signature") || req.headers.get("x-signature");
    const signatureOk = await verifySignature(rawBody, signature, secret);
    if (!signatureOk) return json({ error: "Invalid signature" }, 401);

    const payload = JSON.parse(rawBody);
    const eventName = String(payload?.meta?.event_name || "");
    const orderId = findOrderId(payload);
    const lemonOrderId = String(payload?.data?.id || "");

    if (!orderId) return json({ received: true, ignored: "Missing order_id custom data" });

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    if (eventName === "order_refunded") {
      await admin
        .from("orders")
        .update({ status: "refunded", payment_reference: lemonOrderId || null, payment_provider: "lemon_squeezy" })
        .eq("id", orderId);

      await sendOrderNotification(orderId, "refund_recorded");
      return json({ received: true, status: "refunded" });
    }

    if (eventName === "order_created") {
      await finalizeOrder(admin, orderId, lemonOrderId || orderId, "lemon_squeezy");
      return json({ received: true, status: "paid" });
    }

    return json({ received: true, ignored: eventName || "unknown_event" });
  } catch (error) {
    console.error("lemon-squeezy-webhook error", error);
    return json({ error: "Internal server error" }, 500);
  }
});
