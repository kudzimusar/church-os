-- Wire live Stripe product and price IDs into company_plans
-- Products created 2026-04-27 on Stripe account acct_1MUuwxAqp8pYwqz4 (Tengasell, LIVE mode)

ALTER TABLE public.company_plans
  ADD COLUMN IF NOT EXISTS stripe_product_id       text,
  ADD COLUMN IF NOT EXISTS stripe_price_id_monthly text,
  ADD COLUMN IF NOT EXISTS stripe_price_id_yearly  text,
  ADD COLUMN IF NOT EXISTS stripe_payment_link     text;

-- Lite — $29/mo | $290/yr | prod_UPuUBhYy8xGEDr
UPDATE public.company_plans SET
  stripe_product_id       = 'prod_UPuUBhYy8xGEDr',
  stripe_price_id_monthly = 'price_1TR4iBAqp8pYwqz4xOj7p3n1',
  stripe_price_id_yearly  = 'price_1TR4iIAqp8pYwqz4CE8JE7zG',
  stripe_payment_link     = 'https://buy.stripe.com/4gM5kC0wqbTr3d5btc0oM00'
WHERE LOWER(name) = 'lite';

-- Pro — $79/mo | $790/yr | prod_UPuUghfOIy7ATU
UPDATE public.company_plans SET
  stripe_product_id       = 'prod_UPuUghfOIy7ATU',
  stripe_price_id_monthly = 'price_1TR4ikAqp8pYwqz4Q5yqUDma',
  stripe_price_id_yearly  = 'price_1TR4itAqp8pYwqz4CHY77VpT',
  stripe_payment_link     = 'https://buy.stripe.com/cNi4gy92Wg9H14X0Oy0oM01'
WHERE LOWER(name) = 'pro';

-- Enterprise — $499/mo placeholder | prod_UPuU3mMPHh8NrK
UPDATE public.company_plans SET
  stripe_product_id       = 'prod_UPuU3mMPHh8NrK',
  stripe_price_id_monthly = 'price_1TR4izAqp8pYwqz4hUDa3jOL'
WHERE LOWER(name) = 'enterprise';
