import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
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
    const { action, org_id, user_id } = body;

    // ── CREATE SUBSCRIPTION ───────────────────────────
    if (action === "create") {
      const {
        amount, currency, fund_designation, interval,
        given_by_name, given_by_email, payment_method_id
      } = body;

      // Get or create Stripe customer
      let customerId: string;
      const { data: existingPledge } = await supabaseAdmin
        .from("recurring_pledges")
        .select("stripe_customer_id")
        .eq("user_id", user_id)
        .eq("org_id", org_id)
        .not("stripe_customer_id", "is", null)
        .limit(1)
        .maybeSingle();

      if (existingPledge?.stripe_customer_id) {
        customerId = existingPledge.stripe_customer_id;
      } else {
        const customer = await stripe.customers.create({
          email: given_by_email,
          name: given_by_name,
          metadata: { org_id, user_id: user_id ?? "" },
        });
        customerId = customer.id;
      }

      // Attach payment method to customer
      await stripe.paymentMethods.attach(payment_method_id, {
        customer: customerId,
      });
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: payment_method_id
        },
      });

      // Create price for this specific amount
      const price = await stripe.prices.create({
        currency: (currency ?? "jpy").toLowerCase(),
        unit_amount: Math.round(amount * 100),
        recurring: { interval: interval ?? "month" },
        product_data: {
          name: `${fund_designation ?? "Tithe"} — Recurring Giving`,
        },
      });

      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: price.id }],
        metadata: {
          org_id,
          user_id: user_id ?? "",
          fund_designation: fund_designation ?? "tithe",
          given_by_name: given_by_name ?? "",
          given_by_email: given_by_email ?? "",
          type: "recurring_giving",
        },
        payment_behavior: "default_incomplete",
        expand: ["latest_invoice.payment_intent"],
      });

      // Save pledge to database
      await supabaseAdmin.from("recurring_pledges").insert({
        org_id,
        user_id: user_id || null,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: customerId,
        stripe_price_id: price.id,
        amount,
        currency: (currency ?? "JPY").toUpperCase(),
        fund_designation: fund_designation ?? "tithe",
        interval: interval ?? "month",
        interval_count: 1,
        status: "active",
        given_by_name: given_by_name ?? null,
        given_by_email: given_by_email ?? null,
        next_billing_date: new Date(
          subscription.current_period_end * 1000
        ).toISOString().split("T")[0],
      });

      const invoice = subscription.latest_invoice as any;
      return new Response(
        JSON.stringify({
          subscription_id: subscription.id,
          status: subscription.status,
          client_secret: invoice?.payment_intent?.client_secret,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── CANCEL SUBSCRIPTION ───────────────────────────
    if (action === "cancel") {
      const { subscription_id } = body;

      await stripe.subscriptions.cancel(subscription_id);

      await supabaseAdmin
        .from("recurring_pledges")
        .update({
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
        })
        .eq("stripe_subscription_id", subscription_id);

      return new Response(
        JSON.stringify({ success: true, status: "cancelled" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── LIST PLEDGES ──────────────────────────────────
    if (action === "list") {
      const { data: pledges } = await supabaseAdmin
        .from("recurring_pledges")
        .select("*")
        .eq("user_id", user_id)
        .eq("org_id", org_id)
        .order("created_at", { ascending: false });

      return new Response(
        JSON.stringify({ pledges: pledges ?? [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: corsHeaders }
    );

  } catch (err) {
    console.error("Recurring giving error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500,
        headers: { "Content-Type": "application/json" } }
    );
  }
});
