import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

type EventType =
  | "order_confirmed"
  | "download_ready"
  | "shipment_processing"
  | "shipment_shipped"
  | "order_delivered"
  | "order_cancelled"
  | "order_refunded";

const eventCopy: Record<EventType, { subject: string; heading: string; intro: string }> = {
  order_confirmed: {
    subject: "Order confirmed",
    heading: "Payment confirmed",
    intro: "Your Wingxtra order has been confirmed and is now moving into fulfillment.",
  },
  download_ready: {
    subject: "Downloads ready",
    heading: "Your digital files are ready",
    intro: "Your secure download links are available on your order page. Links are time-limited for security.",
  },
  shipment_processing: {
    subject: "Order is being prepared",
    heading: "Your order is being prepared",
    intro: "Your physical items are in the fulfillment queue. We will send tracking once the shipment leaves.",
  },
  shipment_shipped: {
    subject: "Order shipped",
    heading: "Your order has shipped",
    intro: "Your Wingxtra shipment is on the way. Tracking details are included below when available.",
  },
  order_delivered: {
    subject: "Order delivered",
    heading: "Your order has been delivered",
    intro: "The shipment is marked delivered. Thank you for building with Wingxtra.",
  },
  order_cancelled: {
    subject: "Order cancelled",
    heading: "Your order was cancelled",
    intro: "This order has been cancelled. If this was unexpected, please contact Wingxtra support.",
  },
  order_refunded: {
    subject: "Order refunded",
    heading: "Your order was refunded",
    intro: "A refund has been recorded for this order. Processing time depends on the payment provider.",
  },
};

function money(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: currency || "USD" }).format(Number(amount || 0));
}

function buildHtml(order: any, eventType: EventType, recipientName: string, siteUrl: string) {
  const copy = eventCopy[eventType];
  const orderCode = String(order.id).slice(0, 8).toUpperCase();
  const items = (order.order_items || [])
    .map((item: any) => `<tr><td style="padding:12px 0;border-bottom:1px solid #243226;color:#f6fff8;">${item.product?.name || "Product"}<br><span style="color:#98a79d;font-size:13px;">${item.fulfillment_type} x ${item.quantity}</span></td><td style="padding:12px 0;border-bottom:1px solid #243226;text-align:right;color:#f6fff8;">${money(Number(item.unit_price) * Number(item.quantity), order.currency)}</td></tr>`)
    .join("");

  const trackingBlock = eventType === "shipment_shipped"
    ? `<div style="background:#101912;border:1px solid #25382a;border-radius:14px;padding:18px;margin:20px 0;color:#d7eadc;"><strong style="color:#25d66f;">Tracking</strong><p style="margin:8px 0 0;">Courier: ${order.shipping_courier || "Not specified"}<br>Tracking number: ${order.tracking_number || "Not specified"}</p>${order.tracking_url ? `<a href="${order.tracking_url}" style="color:#25d66f;font-weight:700;">Track shipment</a>` : ""}</div>`
    : "";

  const downloadBlock = order.has_digital
    ? `<div style="background:#101912;border:1px solid #25382a;border-radius:14px;padding:18px;margin:20px 0;color:#d7eadc;"><strong style="color:#25d66f;">Digital products</strong><p style="margin:8px 0 0;">Sign in and open your order page to access secure file links.</p></div>`
    : "";

  return `
  <div style="margin:0;padding:0;background:#050805;font-family:Arial,sans-serif;color:#f6fff8;">
    <div style="max-width:680px;margin:0 auto;padding:34px 20px;">
      <div style="border:1px solid #1f2d22;background:#08100a;border-radius:22px;overflow:hidden;">
        <div style="padding:28px 30px;border-bottom:1px solid #1f2d22;">
          <div style="font-size:22px;font-weight:800;letter-spacing:-.03em;">Wingxtra Store</div>
          <div style="margin-top:8px;color:#25d66f;font-size:12px;text-transform:uppercase;letter-spacing:.16em;font-weight:800;">${copy.subject}</div>
        </div>
        <div style="padding:30px;">
          <h1 style="margin:0 0 14px;font-size:28px;line-height:1.15;">${copy.heading}</h1>
          <p style="margin:0 0 18px;color:#c6d5cb;line-height:1.7;">Hi ${recipientName || "there"}, ${copy.intro}</p>
          <div style="background:#0c1510;border:1px solid #25382a;border-radius:16px;padding:18px;margin:20px 0;">
            <div style="color:#98a79d;font-size:12px;text-transform:uppercase;letter-spacing:.14em;font-weight:800;">Order #${orderCode}</div>
            <div style="font-size:26px;font-weight:900;margin-top:8px;">${money(order.total_amount, order.currency)}</div>
            <div style="color:#98a79d;margin-top:6px;">Status: ${order.status} | Shipping: ${order.shipping_status}</div>
          </div>
          ${trackingBlock}
          ${downloadBlock}
          <table style="width:100%;border-collapse:collapse;margin:18px 0;">${items}</table>
          <a href="${siteUrl}/orders/${order.id}" style="display:inline-block;background:#25d66f;color:#031106;text-decoration:none;font-weight:900;border-radius:999px;padding:14px 22px;margin-top:18px;">Open order</a>
          <p style="color:#6f8176;font-size:12px;margin-top:28px;line-height:1.6;">Wingxtra Store sends transactional messages for order progress, downloads, and shipping updates.</p>
        </div>
      </div>
    </div>
  </div>`;
}

function getJwtPayload(token: string) {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(normalized));
  } catch {
    return null;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const siteUrl = (Deno.env.get("SITE_URL") || Deno.env.get("VITE_SITE_URL") || "https://shop.wingxtra.com").replace(/\/$/, "");

    const { order_id, event_type } = await req.json() as { order_id?: string; event_type?: EventType };
    if (!order_id || !event_type || !eventCopy[event_type]) return json({ error: "order_id and valid event_type are required" }, 400);

    const admin = createClient(supabaseUrl, serviceKey);
    const bearer = authHeader.replace(/^Bearer\s+/i, "");
    const tokenPayload = getJwtPayload(bearer);
    const isServiceCall = bearer === serviceKey || tokenPayload?.role === "service_role";

    let callerUserId = "";
    let callerIsAdmin = false;
    if (!isServiceCall) {
      const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
      const { data: { user }, error: userError } = await userClient.auth.getUser();
      if (userError || !user) return json({ error: "Unauthorized" }, 401);
      callerUserId = user.id;
      const { data: profile } = await admin.from("profiles").select("role").eq("id", user.id).maybeSingle();
      callerIsAdmin = profile?.role === "admin";
    }

    const { data: order, error: orderError } = await admin
      .from("orders")
      .select("*, order_items(*, product:products(name, slug, image_url, fulfillment_type))")
      .eq("id", order_id)
      .single();
    if (orderError || !order) return json({ error: "Order not found" }, 404);
    if (!isServiceCall && !callerIsAdmin && order.user_id !== callerUserId) return json({ error: "Forbidden" }, 403);

    const { data: userData } = await admin.auth.admin.getUserById(order.user_id);
    const recipientEmail = userData?.user?.email;
    if (!recipientEmail) return json({ error: "Order user email not found" }, 400);
    const recipientName = String(userData.user.user_metadata?.full_name || recipientEmail.split("@")[0] || "");

    const copy = eventCopy[event_type];
    const subject = `${copy.subject} - #${String(order.id).slice(0, 8).toUpperCase()}`;
    const htmlContent = buildHtml(order, event_type, recipientName, siteUrl);
    const brevoKey = Deno.env.get("BREVO_API_KEY");

    let status = "sent";
    let providerResponse: Record<string, unknown> = {};
    let errorMessage = "";

    if (!brevoKey) {
      status = "failed";
      errorMessage = "Missing BREVO_API_KEY";
    } else {
      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: { "Content-Type": "application/json", "api-key": brevoKey },
        body: JSON.stringify({
          sender: { name: "Wingxtra Store", email: "noreply@wingxtra.com" },
          to: [{ email: recipientEmail, name: recipientName }],
          subject,
          htmlContent,
        }),
      });
      providerResponse = await res.json().catch(() => ({}));
      if (!res.ok) {
        status = "failed";
        errorMessage = JSON.stringify(providerResponse);
      }
    }

    await admin.from("order_notifications").insert({
      order_id,
      event_type,
      recipient_email: recipientEmail,
      subject,
      status,
      provider_response: providerResponse,
      error_message: errorMessage,
    });

    if (status === "failed") return json({ success: false, error: errorMessage || "Email failed" }, 500);
    return json({ success: true });
  } catch (error) {
    console.error("send-order-notification error", error);
    return json({ error: "Internal server error" }, 500);
  }
});
