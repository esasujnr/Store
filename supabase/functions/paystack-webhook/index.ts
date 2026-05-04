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
    const paystackSecret = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!paystackSecret) {
      return new Response(JSON.stringify({ error: "Missing PAYSTACK_SECRET_KEY" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify Paystack signature
    const body = await req.text();
    const signature = req.headers.get("x-paystack-signature");

    const encoder = new TextEncoder();
    const keyData = encoder.encode(paystackSecret);
    const messageData = encoder.encode(body);

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-512" },
      false,
      ["sign"]
    );

    const sigBuffer = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
    const computedSig = Array.from(new Uint8Array(sigBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (computedSig !== signature) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const event = JSON.parse(body);

    if (event.event !== "charge.success") {
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { reference, metadata } = event.data;
    const orderId = metadata?.order_id || reference;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Update order to paid
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .update({ status: "paid", payment_reference: reference })
      .eq("id", orderId)
      .select("*, order_items(*, product:products(*))")
      .single();

    if (orderError) throw orderError;

    // Generate signed URLs for digital (FDM) items
    const downloadPromises = [];
    for (const item of order.order_items || []) {
      if (item.fulfillment_type === "fdm" && item.product?.stl_file_path) {
        const expiresIn = 15 * 60; // 15 minutes

        const { data: signedData, error: signError } = await supabase.storage
          .from("stl-files")
          .createSignedUrl(item.product.stl_file_path, expiresIn);

        if (!signError && signedData) {
          downloadPromises.push(
            supabase
              .from("order_items")
              .update({
                download_url: signedData.signedUrl,
                download_expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
              })
              .eq("id", item.id)
          );
        }
      }
    }

    await Promise.all(downloadPromises);

    // Send order confirmation email via Brevo
    const brevoKey = Deno.env.get("BREVO_API_KEY");
    const userEmail = event.data.customer?.email;
    if (brevoKey && userEmail) {
      const hasDigital = order.order_items?.some((i: { fulfillment_type: string }) => i.fulfillment_type === "fdm");
      const hasPhysical = order.order_items?.some((i: { fulfillment_type: string }) => i.fulfillment_type !== "fdm");

      const emailBody = {
        sender: { name: "VOLANT Store", email: "noreply@volant.store" },
        to: [{ email: userEmail }],
        subject: `Order Confirmed — #${orderId.slice(0, 8).toUpperCase()}`,
        htmlContent: `
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;color:#f5f5f5;padding:32px;border-radius:12px;">
            <h1 style="color:#60a5fa;font-size:24px;margin-bottom:8px;">▲ VOLANT</h1>
            <h2 style="font-size:20px;color:#f5f5f5;">Order Confirmed!</h2>
            <p style="color:#a3a3a3;">Your order <strong style="color:#f5f5f5;">#${orderId.slice(0, 8).toUpperCase()}</strong> has been paid successfully.</p>
            ${hasDigital ? `<div style="background:#1e293b;border-radius:8px;padding:16px;margin:16px 0;">
              <p style="margin:0;color:#4ade80;font-weight:bold;">📁 Digital Downloads</p>
              <p style="margin:8px 0 0;color:#a3a3a3;font-size:14px;">Sign in to your account and visit your order page to download your STL files. Links expire in 15 minutes after generation.</p>
            </div>` : ""}
            ${hasPhysical ? `<div style="background:#1e293b;border-radius:8px;padding:16px;margin:16px 0;">
              <p style="margin:0;color:#60a5fa;font-weight:bold;">📦 Physical Parts</p>
              <p style="margin:8px 0 0;color:#a3a3a3;font-size:14px;">We'll begin processing your physical parts shortly. You'll receive a shipping notification with tracking details.</p>
            </div>` : ""}
            <p style="color:#737373;font-size:12px;margin-top:32px;">VOLANT Store — Drone & 3D Printing Components</p>
          </div>
        `,
      };

      await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": brevoKey,
        },
        body: JSON.stringify(emailBody),
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
