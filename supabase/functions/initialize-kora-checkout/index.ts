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

    const koraSecret = Deno.env.get("KORA_SECRET_KEY");
    if (!koraSecret) return json({ error: "Kora Pay is not configured yet" }, 500);

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
    if (String(order.currency).toUpperCase() !== "NGN") return json({ error: "Kora checkout must be initialized in NGN" }, 400);

    const discountError = await validateDiscount(admin, order.discount_code);
    if (discountError) return json({ error: discountError }, 400);

    const initializeRes = await fetch("https://api.korapay.com/merchant/api/v1/charges/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${koraSecret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reference: order.id,
        amount: Math.round(Number(order.total_amount)),
        currency: "NGN",
        redirect_url: callback_url,
        notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/kora-webhook`,
        customer: {
          name: user.user_metadata?.full_name || user.email || "Wingxtra customer",
          email: user.email,
        },
        metadata: {
          order_id: order.id,
          user_id: user.id,
          cancel_url: cancel_url || "",
        },
      }),
    });

    const initializeData = await initializeRes.json();
    const checkoutUrl = initializeData?.data?.checkout_url || initializeData?.data?.url || initializeData?.checkout_url;

    if (!initializeRes.ok || !checkoutUrl) {
      return json({ error: initializeData?.message || "Kora checkout initialization failed" }, 400);
    }

    await admin
      .from("orders")
      .update({ payment_reference: order.id, payment_provider: "kora" })
      .eq("id", order.id);

    return json({
      success: true,
      authorization_url: checkoutUrl,
      reference: order.id,
    });
  } catch (error) {
    console.error("initialize-kora-checkout error", error);
    return json({ error: "Internal server error" }, 500);
  }
});
