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

    const { order_id, callback_url, cancel_url } = await req.json();
    if (!order_id || !callback_url) return json({ error: "order_id and callback_url are required" }, 400);

    const paystackSecret = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!paystackSecret) return json({ error: "Missing PAYSTACK_SECRET_KEY" }, 500);

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
    if (String(order.currency).toUpperCase() !== "GHS") {
      return json({ error: "Paystack checkout must be initialized in GHS for this store setup" }, 400);
    }

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

    const initializeRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${paystackSecret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: user.email,
        amount: Math.round(Number(order.total_amount) * 100),
        currency: "GHS",
        reference: order.id,
        callback_url,
        metadata: {
          order_id: order.id,
          cancel_action: cancel_url || undefined,
        },
      }),
    });

    const initializeData = await initializeRes.json();

    if (!initializeRes.ok || !initializeData?.status || !initializeData?.data?.authorization_url) {
      return json({ error: initializeData?.message || "Paystack checkout initialization failed" }, 400);
    }

    return json({
      success: true,
      authorization_url: initializeData.data.authorization_url,
      access_code: initializeData.data.access_code,
      reference: initializeData.data.reference,
    });
  } catch (error) {
    console.error("initialize-paystack-checkout error", error);
    return json({ error: "Internal server error" }, 500);
  }
});
