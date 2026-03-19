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
