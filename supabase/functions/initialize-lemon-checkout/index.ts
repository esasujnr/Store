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

    const apiKey = Deno.env.get("LEMON_SQUEEZY_API_KEY");
    const storeId = Deno.env.get("LEMON_SQUEEZY_STORE_ID");
    const variantId = Deno.env.get("LEMON_SQUEEZY_VARIANT_ID");
    if (!apiKey || !storeId || !variantId) {
      return json({ error: "Lemon Squeezy is not configured yet" }, 500);
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: order, error: orderError } = await admin
      .from("orders")
      .select("id, user_id, total_amount, currency, status, discount_code, has_digital, has_physical, order_items(quantity, product:products(name))")
      .eq("id", order_id)
      .single();

    if (orderError || !order) return json({ error: "Order not found" }, 404);
    if (order.user_id !== user.id) return json({ error: "Forbidden" }, 403);
    if (order.status !== "pending") return json({ error: "Order is not payable" }, 400);
    if (String(order.currency).toUpperCase() !== "USD") return json({ error: "Lemon Squeezy checkout must be initialized in USD" }, 400);
    if (!order.has_digital || order.has_physical) {
      return json({ error: "Lemon Squeezy is only available for international digital-only orders" }, 400);
    }

    const discountError = await validateDiscount(admin, order.discount_code);
    if (discountError) return json({ error: discountError }, 400);

    const itemCount = (order.order_items || []).reduce((sum: number, item: { quantity?: number }) => sum + Number(item.quantity || 0), 0);
    const testMode = String(Deno.env.get("LEMON_SQUEEZY_TEST_MODE") || "").toLowerCase() === "true";

    const checkoutRes = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
      },
      body: JSON.stringify({
        data: {
          type: "checkouts",
          attributes: {
            custom_price: Math.round(Number(order.total_amount) * 100),
            product_options: {
              name: `Wingxtra digital file order #${String(order.id).slice(0, 8).toUpperCase()}`,
              description: `${itemCount} secure digital download item${itemCount === 1 ? "" : "s"} from Wingxtra.`,
              redirect_url: callback_url,
              receipt_button_text: "View Wingxtra order",
              receipt_link_url: callback_url,
              receipt_thank_you_note: "Your Wingxtra download links are released after payment confirmation.",
            },
            checkout_options: {
              embed: false,
              media: false,
              logo: true,
              desc: true,
              discount: false,
              dark: false,
              button_color: "#19b85a",
            },
            checkout_data: {
              email: user.email,
              custom: {
                order_id: order.id,
                user_id: user.id,
                cancel_url: cancel_url || "",
              },
            },
            test_mode: testMode,
          },
          relationships: {
            store: { data: { type: "stores", id: String(storeId) } },
            variant: { data: { type: "variants", id: String(variantId) } },
          },
        },
      }),
    });

    const checkoutData = await checkoutRes.json();
    const checkoutUrl = checkoutData?.data?.attributes?.url;

    if (!checkoutRes.ok || !checkoutUrl) {
      return json({ error: checkoutData?.errors?.[0]?.detail || "Lemon Squeezy checkout initialization failed" }, 400);
    }

    await admin
      .from("orders")
      .update({ payment_reference: checkoutData.data.id, payment_provider: "lemon_squeezy" })
      .eq("id", order.id);

    return json({
      success: true,
      authorization_url: checkoutUrl,
      reference: checkoutData.data.id,
    });
  } catch (error) {
    console.error("initialize-lemon-checkout error", error);
    return json({ error: "Internal server error" }, 500);
  }
});
