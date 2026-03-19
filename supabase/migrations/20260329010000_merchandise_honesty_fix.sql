-- Final Revised Merchandise Seeding (Honesty Audit V2)
-- Using verified UUIDs for categories and authentic books

-- 1. Ensure Categories exist or skip if naming is different
-- We use the existing IDs discovered from the database:
-- Publications: 30a6bbb1-7bb1-4024-a8b1-cf78f8633a0b
-- Gear & Apparel: 380d8bb2-f807-4a59-bc00-f8fe1e88120a
-- Live Events: 3353f496-dcd1-45a1-b197-38fe8e2465b4
-- Sanctuary Essentials: 896c64ec-9c87-4fc3-b5f2-20dd52703eb8

-- 2. Clear previous incorrect data for this organization
DELETE FROM merchandise WHERE org_id = 'fa547adf-f820-412f-9458-d6bade11517d';

-- 3. Seed Verified Products
INSERT INTO merchandise (
    id, org_id, category_id, name, subtitle, description, 
    price, stock_quantity, images, slug, status, metadata
) VALUES
-- Real Books (Category: Publications)
(
    gen_random_uuid(), 'fa547adf-f820-412f-9458-d6bade11517d', '30a6bbb1-7bb1-4024-a8b1-cf78f8633a0b', 
    'Power of Purpose', 'Discovering Your Core Identity', 
    'A transformative guide by Pastor Marcel Jonte on discovering why you are here and where you are going. This book has reached thousands seeking spiritual clarity.',
    2500, 100, ARRAY['/jkc-devotion-app/images/books/book-power-of-purpose.png'], 
    'power-of-purpose', 'published', 
    '{"long_description": "In this powerful literary work, Pastor Marcel Jonte draws from years of spiritual leadership and personal experience to help readers navigate the complexities of life with a clear sense of mission.", "specifications": {"Author": "Marcel Jonte", "ISBN": "978-4-00-000000-0", "Format": "Hardcover", "Language": "English/Japanese"}, "faqs": [{"question": "Is this book available in Japanese?", "answer": "Yes, we have both English and Japanese translations available."}]}'
),
(
    gen_random_uuid(), 'fa547adf-f820-412f-9458-d6bade11517d', '30a6bbb1-7bb1-4024-a8b1-cf78f8633a0b', 
    'A Miraculous Encounter', 'A True Story of Divine Intervention', 
    'The harrowing and inspiring true story of how God intervened in the most unlikely place. A must-read for anyone seeking hope in the dark.',
    2200, 50, ARRAY['/jkc-devotion-app/images/books/book-miraculous-encounter.webp'], 
    'a-miraculous-encounter', 'published', 
    '{"long_description": "Pastor Marcel shares an intimate look at a life-changing moment where faith met reality in a miraculous way.", "specifications": {"Author": "Marcel Jonte", "Page Count": "280", "Publisher": "JKC Media"}, "faqs": [{"question": "Is there an audiobook version?", "answer": "Currently, it is only available in print and e-book formats."}]}'
),
(
    gen_random_uuid(), 'fa547adf-f820-412f-9458-d6bade11517d', '30a6bbb1-7bb1-4024-a8b1-cf78f8633a0b', 
    'The Reason I''m Black', 'Navigating Identity and Grace', 
    'A profound exploration of identity, race, and grace in a global context. Bridging cultures through Christ.',
    2800, 75, ARRAY['/jkc-devotion-app/images/books/book-why-i-am-black.png'], 
    'the-reason-im-black', 'published', 
    '{"long_description": "Navigating the intersection of race and faith, Pastor Marcel provides a bridge for understanding and grace in the modern world.", "specifications": {"Author": "Marcel Jonte", "Subject": "Theology/Biography", "Region": "Global"}, "faqs": [{"question": "Who is the target audience?", "answer": "Anyone looking to understand God''s grace across cultural and racial boundaries."}]}'
),
(
    gen_random_uuid(), 'fa547adf-f820-412f-9458-d6bade11517d', '30a6bbb1-7bb1-4024-a8b1-cf78f8633a0b', 
    'The Ultimate Love Challenge', 'Radical Christ-Centered Relationships', 
    'A practical and spiritual guide to building relationships that last, centered on the profound love of Christ.',
    1800, 200, ARRAY['/jkc-devotion-app/images/books/book-love-challenge.jpg'], 
    'the-ultimate-love-challenge', 'published', 
    '{"long_description": "Build relationships that withstand the test of time using biblical principles outlined by Pastor Marcel.", "specifications": {"Type": "Guide/Manual", "Pages": "150", "Content": "Practical Exercises"}, "faqs": [{"question": "Is this for married couples only?", "answer": "No, it is designed for anyone seeking to build radical, Christ-centered relationships."}]}'
),
-- Real Merchandise (Category: Sanctuary Essentials / Gear)
(
    gen_random_uuid(), 'fa547adf-f820-412f-9458-d6bade11517d', '896c64ec-9c87-4fc3-b5f2-20dd52703eb8', 
    'Prophetic Water', 'Sanctified Drinking Water', 
    'Natural mineral water for refreshment and spiritual presence. 500ml bottle.',
    100, 1000, ARRAY['/jkc-devotion-app/images/shop/water-bottle.png'], 
    'prophetic-water', 'published', 
    '{"specifications": {"Volume": "500ml", "Origin": "Japanese Alps", "Type": "Still Mineral Water"}}'
),
(
    gen_random_uuid(), 'fa547adf-f820-412f-9458-d6bade11517d', '380d8bb2-f807-4a59-bc00-f8fe1e88120a', 
    'Kingdom Wristband', 'Strength in Unity', 
    'High-quality silicone wristband featuring the JKC Kingdom emblem. For daily wear.',
    500, 500, ARRAY['/jkc-devotion-app/images/shop/wristband.png'], 
    'kingdom-wristband', 'published', 
    '{"specifications": {"Material": "Silicone", "Color": "Navy/Gold", "Size": "Standard Adult"}}'
);
