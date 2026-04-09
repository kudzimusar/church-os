import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14?target=deno";

const stripe = new Stripe(
  Deno.env.get("STRIPE_SECRET_KEY_PLATFORM") ?? "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, org_id } = body;

    // ── CREATE CHECKOUT ───────────────────────────────
    if (action === "create_checkout") {
      const { plan_name, billing_interval,
              admin_email, org_name, success_url, cancel_url }
        = body;

      // Get or create Stripe customer for this org
      const { data: existingSub } = await supabaseAdmin
        .from("organization_subscriptions")
        .select("stripe_customer_id")
        .eq("org_id", org_id)
        .maybeSingle();

      let customerId = existingSub?.stripe_customer_id;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: admin_email,
          name: org_name,
          metadata: { org_id, platform: "church_os" },
        });
        customerId = customer.id;
      }

      // Get plan details
      const { data: plan } = await supabaseAdmin
        .from("company_plans")
        .select("*")
        .eq("name", plan_name)
        .single();

      const amount = billing_interval === "year"
        ? plan.price_yearly : plan.price_monthly;
      const priceId = billing_interval === "year"
        ? plan.stripe_price_id_yearly
        : plan.stripe_price_id_monthly;

      let sessionParams: any;

      if (priceId) {
        // Use existing Stripe price
        sessionParams = {
          customer: customerId,
          mode: "subscription",
          line_items: [{ price: priceId, quantity: 1 }],
          metadata: {
            org_id, plan_name, billing_interval,
            platform: "church_os"
          },
          success_url,
          cancel_url,
          trial_period_days: plan.trial_days ?? 14,
        };
      } else {
        // Create price on the fly
        sessionParams = {
          customer: customerId,
          mode: "subscription",
          line_items: [{
            price_data: {
              currency: "usd",
              unit_amount: Math.round(amount * 100),
              recurring: { interval: billing_interval ?? "month" },
              product_data: {
                name: `Church OS ${plan_name} Plan`,
                description: `Church management platform — ${plan_name} tier`,
              },
            },
            quantity: 1,
          }],
          metadata: {
            org_id, plan_name, billing_interval,
            platform: "church_os"
          },
          success_url,
          cancel_url,
          trial_period_days: plan.trial_days ?? 14,
        };
      }

      const session = await stripe.checkout.sessions.create(sessionParams);

      return new Response(
        JSON.stringify({ url: session.url }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── CUSTOMER PORTAL ───────────────────────────────
    if (action === "portal") {
      const { return_url } = body;

      const { data: sub } = await supabaseAdmin
        .from("organization_subscriptions")
        .select("stripe_customer_id")
        .eq("org_id", org_id)
        .maybeSingle();

      if (!sub?.stripe_customer_id) {
        return new Response(
          JSON.stringify({ error: "No subscription found" }),
          { status: 404, headers: corsHeaders }
        );
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: sub.stripe_customer_id,
        return_url,
      });

      return new Response(
        JSON.stringify({ url: session.url }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── CANCEL ────────────────────────────────────────
    if (action === "cancel") {
      const { data: sub } = await supabaseAdmin
        .from("organization_subscriptions")
        .select("stripe_subscription_id")
        .eq("org_id", org_id)
        .single();

      if (sub?.stripe_subscription_id) {
        await stripe.subscriptions.update(sub.stripe_subscription_id, {
          cancel_at_period_end: true,
        });
      }

      await supabaseAdmin
        .from("organization_subscriptions")
        .update({ cancel_at_period_end: true })
        .eq("org_id", org_id);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: corsHeaders }
    );

  } catch (err) {
    console.error("SaaS billing error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500,
        headers: { "Content-Type": "application/json" } }
    );
  }
});
