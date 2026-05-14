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

    const { order_id, redirect_url, store_region, customer } = await req.json();
    if (!order_id || !redirect_url) return json({ error: "order_id and redirect_url are required" }, 400);

    const flutterwaveSecret = Deno.env.get("FLUTTERWAVE_SECRET_KEY");
    if (!flutterwaveSecret) return json({ error: "Missing FLUTTERWAVE_SECRET_KEY" }, 500);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: order, error: orderError } = await admin
      .from("orders")
      .select("id, user_id, total_amount, currency, status, discount_code")
      .eq("id", order_id)
      .single();

    if (orderError || !order) return json({ error: "Order not found" }, 404);
    if (order.user_id !== user.id) return json({ error: "Forbidden" }, 403);
    if (order.status !== "pending") return json({ error: "Order is not payable" }, 400);

    if (order.discount_code) {
      const { data: discount, error: discountError } = await admin
        .from("discounts")
        .select("code, is_active, starts_at, ends_at, usage_limit, used_count")
        .eq("code", order.discount_code)
        .maybeSingle();

      const now = Date.now();
      const isExpired = discount?.ends_at && new Date(discount.ends_at).getTime() < now;
      const isScheduled = discount?.starts_at && new Date(discount.starts_at).getTime() > now;
      const usageLimitReached = discount?.usage_limit !== null
        && discount?.usage_limit !== undefined
        && Number(discount.used_count || 0) >= Number(discount.usage_limit);

      if (discountError || !discount || !discount.is_active || isExpired || isScheduled || usageLimitReached) {
        return json({ error: "Discount code is no longer available" }, 400);
      }
    }

    const paymentOptions = String(order.currency).toUpperCase() === "NGN"
      ? "card,ussd,banktransfer"
      : String(order.currency).toUpperCase() === "GHS"
        ? "card,mobilemoneyghana"
        : "card";

    const response = await fetch("https://api.flutterwave.com/v3/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${flutterwaveSecret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tx_ref: order.id,
        amount: Number(order.total_amount).toFixed(2),
        currency: String(order.currency).toUpperCase(),
        redirect_url: redirect_url,
        payment_options: paymentOptions,
        customer: {
          email: user.email,
          name: customer?.full_name || user.email || "Wingxtra Customer",
          phonenumber: customer?.phone || undefined,
        },
        customizations: {
          title: "Wingxtra Store",
          description: `${store_region || "International"} checkout for order #${order.id.slice(0, 8).toUpperCase()}`,
          logo: "https://shop.wingxtra.com/brand/wingxtra-favicon-192.png",
        },
        meta: {
          order_id: order.id,
          store_region: store_region || "international",
          customer_country: customer?.country || "",
        },
      }),
    });

    const data = await response.json();
    if (!response.ok || data?.status !== "success" || !data?.data?.link) {
      return json({ error: data?.message || "Flutterwave checkout initialization failed" }, 400);
    }

    return json({
      success: true,
      url: data.data.link,
      reference: order.id,
    });
  } catch (error) {
    console.error("initialize-flutterwave-checkout error", error);
    return json({ error: "Internal server error" }, 500);
  }
});
