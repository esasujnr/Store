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

function escapeXml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function getXmlValue(xml: string, tag: string) {
  return new DOMParser().parseFromString(xml, "text/xml").querySelector(tag)?.textContent || "";
}

async function validateDiscount(admin: ReturnType<typeof createClient>, code?: string | null) {
  if (!code) return null;

  const { data: discount, error } = await admin
    .from("discounts")
    .select("code, is_active, starts_at, ends_at, usage_limit, used_count")
    .eq("code", code)
    .maybeSingle();

  const now = Date.now();
  const isExpired = discount?.ends_at && new Date(discount.ends_at).getTime() < now;
  const isScheduled = discount?.starts_at && new Date(discount.starts_at).getTime() > now;
  const usageLimitReached = discount?.usage_limit !== null
    && discount?.usage_limit !== undefined
    && Number(discount.used_count || 0) >= Number(discount.usage_limit);

  if (error || !discount || !discount.is_active || isExpired || isScheduled || usageLimitReached) {
    return "Discount code is no longer available";
  }

  return null;
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

    const { order_id, callback_url, cancel_url } = await req.json();
    if (!order_id || !callback_url) return json({ error: "order_id and callback_url are required" }, 400);

    const companyToken = Deno.env.get("DPO_COMPANY_TOKEN");
    const serviceType = Deno.env.get("DPO_SERVICE_TYPE");
    if (!companyToken || !serviceType) return json({ error: "DPO Pay is not configured yet" }, 500);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: order, error: orderError } = await admin
      .from("orders")
      .select("id, user_id, total_amount, currency, status, discount_code, has_physical")
      .eq("id", order_id)
      .single();

    if (orderError || !order) return json({ error: "Order not found" }, 404);
    if (order.user_id !== user.id) return json({ error: "Forbidden" }, 403);
    if (order.status !== "pending") return json({ error: "Order is not payable" }, 400);
    if (String(order.currency).toUpperCase() !== "USD") return json({ error: "DPO checkout must be initialized in USD" }, 400);
    if (!order.has_physical) return json({ error: "DPO Pay is reserved for international physical product orders" }, 400);

    const discountError = await validateDiscount(admin, order.discount_code);
    if (discountError) return json({ error: discountError }, 400);

    const apiUrl = Deno.env.get("DPO_API_URL") || "https://secure.3gdirectpay.com/API/v6/";
    const paymentUrlBase = Deno.env.get("DPO_PAYMENT_URL") || "https://secure.3gdirectpay.com/payv2.php?ID=";
    const serviceDate = new Date().toISOString().slice(0, 10).replace(/-/g, "/");
    const amount = Number(order.total_amount).toFixed(2);

    const payload = `<?xml version="1.0" encoding="utf-8"?>
<API3G>
  <CompanyToken>${escapeXml(companyToken)}</CompanyToken>
  <Request>createToken</Request>
  <Transaction>
    <PaymentAmount>${escapeXml(amount)}</PaymentAmount>
    <PaymentCurrency>USD</PaymentCurrency>
    <CompanyRef>${escapeXml(order.id)}</CompanyRef>
    <RedirectURL>${escapeXml(callback_url)}</RedirectURL>
    <BackURL>${escapeXml(cancel_url || callback_url)}</BackURL>
    <CompanyRefUnique>0</CompanyRefUnique>
    <PTL>5</PTL>
  </Transaction>
  <Services>
    <Service>
      <ServiceType>${escapeXml(serviceType)}</ServiceType>
      <ServiceDescription>Wingxtra physical product order ${escapeXml(order.id)}</ServiceDescription>
      <ServiceDate>${escapeXml(serviceDate)}</ServiceDate>
    </Service>
  </Services>
</API3G>`;

    const initializeRes = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/xml" },
      body: payload,
    });

    const responseText = await initializeRes.text();
    const result = getXmlValue(responseText, "Result");
    const resultExplanation = getXmlValue(responseText, "ResultExplanation");
    const transactionToken = getXmlValue(responseText, "TransToken");

    if (!initializeRes.ok || result !== "000" || !transactionToken) {
      return json({ error: resultExplanation || "DPO checkout initialization failed" }, 400);
    }

    await admin
      .from("orders")
      .update({ payment_reference: transactionToken, payment_provider: "dpo" })
      .eq("id", order.id);

    return json({
      success: true,
      authorization_url: `${paymentUrlBase}${encodeURIComponent(transactionToken)}`,
      reference: transactionToken,
    });
  } catch (error) {
    console.error("initialize-dpo-checkout error", error);
    return json({ error: "Internal server error" }, 500);
  }
});
