-- Merchandise Store System Migration

-- 1. Merchandise Categories
CREATE TABLE IF NOT EXISTS merchandise_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  slug TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, slug)
);

-- 2. Merchandise Products
CREATE TABLE IF NOT EXISTS merchandise (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  category_id UUID REFERENCES merchandise_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  stock_quantity INT NOT NULL DEFAULT 0,
  images TEXT[] DEFAULT '{}',
  slug TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, slug)
);

-- 3. Merchandise Orders
CREATE TABLE IF NOT EXISTS merchandise_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending',
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  payment_intent_id TEXT,
  payment_status TEXT DEFAULT 'unpaid',
  shipping_address JSONB DEFAULT '{}',
  contact_email TEXT,
  contact_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Merchandise Order Items
CREATE TABLE IF NOT EXISTS merchandise_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES merchandise_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES merchandise(id) ON DELETE SET NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Inventory Logs
CREATE TABLE IF NOT EXISTS merchandise_inventory_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES merchandise(id) ON DELETE CASCADE,
  change_amount INT NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Enable RLS
ALTER TABLE merchandise_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchandise ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchandise_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchandise_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchandise_inventory_logs ENABLE ROW LEVEL SECURITY;

-- 7. RLS Helper Function
CREATE OR REPLACE FUNCTION is_org_admin(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM org_members
    WHERE org_members.org_id = $1
      AND org_members.user_id = auth.uid()
      AND org_members.role IN ('owner', 'admin', 'pastor')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Policy: Products
CREATE POLICY "Public can view products" ON merchandise
  FOR SELECT USING (status = 'published');

CREATE POLICY "Admin can manage products" ON merchandise
  FOR ALL USING (is_org_admin(org_id));

-- 9. Policy: Categories
CREATE POLICY "Public can view categories" ON merchandise_categories
  FOR SELECT USING (true);

CREATE POLICY "Admin can manage categories" ON merchandise_categories
  FOR ALL USING (is_org_admin(org_id));

-- 10. Policy: Orders
CREATE POLICY "Users can view own orders" ON merchandise_orders
  FOR SELECT USING (auth.uid() = user_id OR is_org_admin(org_id));

CREATE POLICY "Users can create own orders" ON merchandise_orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can update orders" ON merchandise_orders
  FOR UPDATE USING (is_org_admin(org_id));

-- 11. Policy: Order Items
CREATE POLICY "Users can view own order items" ON merchandise_order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM merchandise_orders
      WHERE merchandise_orders.id = order_id
        AND (merchandise_orders.user_id = auth.uid() OR is_org_admin(merchandise_orders.org_id))
    )
  );

CREATE POLICY "Users can insert own order items" ON merchandise_order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM merchandise_orders
      WHERE merchandise_orders.id = order_id
        AND merchandise_orders.user_id = auth.uid()
    )
  );

-- 12. Policy: Inventory Logs
CREATE POLICY "Admin can view inventory logs" ON merchandise_inventory_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM merchandise
      WHERE merchandise.id = product_id
        AND is_org_admin(merchandise.org_id)
    )
  );

CREATE POLICY "Admin can manage inventory logs" ON merchandise_inventory_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM merchandise
      WHERE merchandise.id = product_id
        AND is_org_admin(merchandise.org_id)
    )
  );
-- Product Schema Extension for Merchandise
ALTER TABLE merchandise ADD COLUMN IF NOT EXISTS subtitle TEXT;
ALTER TABLE merchandise ADD COLUMN IF NOT EXISTS long_description TEXT;
ALTER TABLE merchandise ADD COLUMN IF NOT EXISTS discount_price DECIMAL(12,2);
ALTER TABLE merchandise ADD COLUMN IF NOT EXISTS specifications JSONB DEFAULT '{}';
ALTER TABLE merchandise ADD COLUMN IF NOT EXISTS variants JSONB DEFAULT '[]';
ALTER TABLE merchandise ADD COLUMN IF NOT EXISTS features TEXT[] DEFAULT '{}';
ALTER TABLE merchandise ADD COLUMN IF NOT EXISTS delivery_options JSONB DEFAULT '[]';
ALTER TABLE merchandise ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0.00;
ALTER TABLE merchandise ADD COLUMN IF NOT EXISTS review_count INT DEFAULT 0;
ALTER TABLE merchandise ADD COLUMN IF NOT EXISTS reviews JSONB DEFAULT '[]';
ALTER TABLE merchandise ADD COLUMN IF NOT EXISTS faqs JSONB DEFAULT '[]';
ALTER TABLE merchandise ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'JPY';

-- Update search path
COMMENT ON TABLE merchandise IS 'Extended merchandise table for premium shop features';
