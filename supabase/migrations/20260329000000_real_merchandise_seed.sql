-- Seed Real Merchandise Data
-- 1. Clear existing products to avoid duplicates
DELETE FROM merchandise;
DELETE FROM merchandise_categories;

-- 2. Insert Categories
INSERT INTO merchandise_categories (org_id, name, slug)
VALUES 
('fa547adf-f820-412f-9458-d6bade11517d', 'Publications', 'publications'),
('fa547adf-f820-412f-9458-d6bade11517d', 'Gear & Apparel', 'gear-apparel'),
('fa547adf-f820-412f-9458-d6bade11517d', 'Live Events', 'events'),
('fa547adf-f820-412f-9458-d6bade11517d', 'Sanctuary Essentials', 'essentials');

-- 3. Insert Products
-- Pastor Marcel's Main Book
INSERT INTO merchandise (
  org_id, 
  category_id, 
  name, 
  subtitle,
  description, 
  long_description,
  price, 
  stock_quantity, 
  images, 
  slug, 
  status,
  features,
  specifications,
  faqs,
  created_at
) VALUES (
  'fa547adf-f820-412f-9458-d6bade11517d',
  (SELECT id FROM merchandise_categories WHERE slug = 'publications'),
  'THE KINGDOM AWAKENING',
  'By Pastor Marcel - Founding Pastor of JKC',
  'The definitive guide to supernatural protocols and purpose-driven living in the modern world.',
  'In "The Kingdom Awakening", Pastor Marcel unveils the hidden protocols of the supernatural realm that allow every believer to live a life of victory, purpose, and divine alignment. This isn''t just a book; it''s a manual for spiritual transformation, meticulously crafted over years of ministry in the heart of Tokyo. You will learn how to navigate spiritual seasons, activate your divine mandate, and walk in the fullness of the Kingdom of God.',
  2200.00,
  500,
  ARRAY['https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800'],
  'the-kingdom-awakening',
  'published',
  ARRAY[
    'Foundational protocols for supernatural living', 
    'Step-by-step activation guides for spiritual gifts', 
    'Exclusive insights into the Japan Kingdom mission', 
    'Luxury hardback with gold foil accents'
  ],
  '{
    "Format": "Hardcover",
    "Author": "Pastor Marcel",
    "Language": "English / Japanese (Parallel Text)",
    "Pages": "320 Pages",
    "Publisher": "JKC Press International",
    "Edition": "2026 First Edition"
  }',
  '[
    {"question": "Is this book available in Japanese?", "answer": "Yes, this edition features parallel English and Japanese text, making it ideal for the local Japanese community and international believers alike."},
    {"question": "Can I get a signed copy?", "answer": "Limited signed copies are available during special ministry events. Keep an eye on the Announcements page!"}
  ]',
  NOW() + INTERVAL '1 second' -- Ensure it's at the top
);

-- Pastor Marcel's 90-Day Journal
INSERT INTO merchandise (
  org_id, 
  category_id, 
  name, 
  subtitle,
  description, 
  long_description,
  price, 
  stock_quantity, 
  images, 
  slug, 
  status,
  features,
  specifications,
  faqs
) VALUES (
  'fa547adf-f820-412f-9458-d6bade11517d',
  (SELECT id FROM merchandise_categories WHERE slug = 'publications'),
  '90 DAYS OF TRANSFORMATION JOURNAL',
  'Companion Guide to the March 2026 Devotional',
  'Meticulously designed journal to track your prophetic milestones and daily revelations.',
  'Transformation is a process that requires intentionality. This 90-day journal is structured to follow Pastor Marcel''s prophetic teaching cycles. Each page provides guided prompts for morning prayer, daily declarations, and evening reflection, ensuring that every seed of the Word is nurtured into a harvest of transformation.',
  1800.00,
  300,
  ARRAY['https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&q=80&w=800'],
  '90-days-transformation-journal',
  'published',
  ARRAY[
    'Daily prophetic prompts', 
    'Quarterly milestone review sections', 
    'Weekly faith-building exercises', 
    'Premium cream-toned acid-free paper'
  ],
  '{
    "Binding": "Linen-wrapped Hardcover",
    "Size": "A5 (148 x 210 mm)",
    "Paper": "120gsm Premium Uncoated",
    "Features": "Silk Ribbon Marker, Elastic Closure"
  }',
  '[
    {"question": "Does it start on specific dates?", "answer": "The journal is undated, allowing you to start your 90-day journey whenever the Spirit leads."},
    {"question": "Is there a digital version?", "answer": "This physical journal is designed for tactile reflection, but digital templates are available via the Devotion App."}
  ]'
);

-- Realistic Wristbands
INSERT INTO merchandise (
  org_id, 
  category_id, 
  name, 
  subtitle,
  description, 
  long_description,
  price, 
  stock_quantity, 
  images, 
  slug, 
  status,
  features,
  specifications,
  faqs
) VALUES (
  'fa547adf-f820-412f-9458-d6bade11517d',
  (SELECT id FROM merchandise_categories WHERE slug = 'gear-apparel'),
  'KINGDOM WRIST BANDS',
  'Wear Your Identity - Silicone Unity Band',
  'Durable, high-quality silicone bands to remind you of your Kingdom identity.',
  'These aren''t just wristbands; they are symbols of unity and identity within the Japan Kingdom Church community. Designed to withstand daily wear, each band is debossed with the "JKC" logo and the "Equip the Vision" mandate. Perfect for outreaches, youth groups, and daily wear.',
  500.00,
  1000,
  ARRAY['https://images.unsplash.com/photo-1549439602-43ebca2327af?auto=format&fit=crop&q=80&w=800'],
  'kingdom-wrist-bands',
  'published',
  ARRAY[
    'High-grade medical silicone', 
    'Debossed "Equip the Vision" text', 
    'Water-resistant and stretch-proof', 
    'Available in Midnight Navy and Kingdom Gold'
  ],
  '{
    "Material": "100% Medical Grade Silicone",
    "Size": "Adult (202mm circumference)",
    "Width": "12mm",
    "Finish": "Matte Silk-touch"
  }',
  '[
    {"question": "Is it one size fits all?", "answer": "The standard adult size fits most wrists comfortably due to the stretchable nature of the silicone."},
    {"question": "Can I buy them in bulk for an outreach?", "answer": "Yes! Bulk discounts are available for quantities over 50. Please contact the ministry admin."}
  ]'
);

-- Realistic Water
INSERT INTO merchandise (
  org_id, 
  category_id, 
  name, 
  subtitle,
  description, 
  long_description,
  price, 
  stock_quantity, 
  images, 
  slug, 
  status,
  features,
  specifications,
  faqs
) VALUES (
  'fa547adf-f820-412f-9458-d6bade11517d',
  (SELECT id FROM merchandise_categories WHERE slug = 'essentials'),
  'KINGDOM SANCTUARY WATER',
  'Pure Mineral Water from Mount Fuji',
  'Refreshing 500ml bottled mineral water, sourced directly from the heart of Japan.',
  'Stay hydrated during service and throughout your day with Kingdom Sanctuary Water. Sourced from the pristine aquifers of the Fuji region, this water is naturally filtered through volcanic rock, providing a crisp, clean taste and essential minerals. Every bottle supports our local sanctuary operations.',
  100.00,
  500,
  ARRAY['https://images.unsplash.com/photo-1560344005-4720e1dcb33d?auto=format&fit=crop&q=80&w=800'],
  'kingdom-sanctuary-water',
  'published',
  ARRAY[
    'Sourced from Fuji mineral springs', 
    'Naturally alkaline (pH 7.8)', 
    'BPA-free recyclable bottle', 
    'Available at the Sanctuary Lobby'
  ],
  '{
    "Volume": "500ml",
    "Source": "Fuji Highland Springs",
    "pH Level": "7.8 (Naturally Alkaline)",
    "Packaging": "100% Recyclable PET"
  }',
  '[
    {"question": "Is this available for shipping?", "answer": "Due to weight, water is primarily available for Sanctuary pickup. Bulk shipping can be arranged for regional events."},
    {"question": "Is the bottle BPA free?", "answer": "Absolutely. We prioritize health and environmental stewardship."}
  ]'
);

-- Outreach Ticket
INSERT INTO merchandise (
  org_id, 
  category_id, 
  name, 
  subtitle,
  description, 
  long_description,
  price, 
  stock_quantity, 
  images, 
  slug, 
  status,
  features,
  specifications,
  faqs
) VALUES (
  'fa547adf-f820-412f-9458-d6bade11517d',
  (SELECT id FROM merchandise_categories WHERE slug = 'events'),
  'MISSION JAPAN 2026 TICKET',
  'Global Conference Entry Pass',
  'Your access pass to the most significant spiritual gathering of 2026.',
  'Mission Japan 2026 is a global conference dedicated to the spiritual awakening of the Japanese archipelago. This ticket provides full access to all three days of the conference, including main sessions, specialized workshops, and networking events for global kingdom leaders.',
  15000.00,
  1000,
  ARRAY['https://images.unsplash.com/photo-1540575861501-7ad0582373f?auto=format&fit=crop&q=80&w=800'],
  'mission-japan-2026-ticket',
  'published',
  ARRAY[
    'Full 3-day access', 
    'Conference materials and study guide', 
    'Workshop registration included', 
    'VIP seating options available'
  ],
  '{
    "Dates": "November 14-16, 2026",
    "Location": "Tokyo Metropolitan Center",
    "Format": "Digital Ticket + Badge",
    "Language": "English, Japanese, Korean, Portuguese"
  }',
  '[
    {"question": "Is food included?", "answer": "Premium buffet lunch options can be added to your registration at the next step."},
    {"question": "Is this refundable?", "answer": "Tickets are non-refundable but transferable to another individual up to 7 days before the event."}
  ]'
);

-- Signature Tee
INSERT INTO merchandise (
  org_id, 
  category_id, 
  name, 
  subtitle,
  description, 
  long_description,
  price, 
  stock_quantity, 
  images, 
  slug, 
  status,
  features,
  specifications,
  faqs
) VALUES (
  'fa547adf-f820-412f-9458-d6bade11517d',
  (SELECT id FROM merchandise_categories WHERE slug = 'gear-apparel'),
  'JKC SIGNATURE TEE',
  'Equip the Vision - 100% Premium Cotton',
  'Comfortable, premium-weight cotton tee with the JKC mission mandate.',
  'Crafted from 100% heavyweight premium cotton, the JKC Signature Tee is built for comfort and longevity. Featuring a minimalist design with our "Equip the Vision" mandate on the sleeve and the JKC logo on the chest, it''s the perfect way to carry the vision wherever you go.',
  3500.00,
  200,
  ARRAY['https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=800'],
  'jkc-signature-tee',
  'published',
  ARRAY[
    '100% Super-combed cotton', 
    '240 GSM Heavyweight fabric', 
    'Pre-shrunken and bio-washed', 
    'Reinforced neck and shoulder seams'
  ],
  '{
    "Material": "100% Cotton",
    "Weight": "240 GSM",
    "Fit": "Modern Boxy Fit",
    "Wash Care": "Machine wash cold, air dry recommended"
  }',
  '[
    {"question": "How does the sizing run?", "answer": "This tee runs slightly oversized for a modern streetwear look. If you prefer a tighter fit, consider sizing down."},
    {"question": "Is it durable?", "answer": "Yes, we use a 240 GSM heavyweight fabric that maintains its shape even after multiple washes."}
  ]'
);
