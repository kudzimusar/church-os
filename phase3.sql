INSERT INTO ministry_members (org_id, user_id, ministry_id, ministry_role, ministry_name)
SELECT
  'fa547adf-f820-412f-9458-d6bade11517d',
  'c58b07e8-7d05-4d15-b196-e8cf0022209b',
  id,
  'leader',
  'Worship Ministry'
FROM ministries
WHERE slug = 'worship'
  AND NOT EXISTS (
    SELECT 1 FROM ministry_members 
    WHERE user_id = 'c58b07e8-7d05-4d15-b196-e8cf0022209b' 
      AND (ministry_id = ministries.id OR ministry_name ILIKE '%worship%')
  );

UPDATE ministry_members
SET ministry_id = (SELECT id FROM ministries WHERE slug = 'worship'),
    ministry_role = 'leader'
WHERE user_id = 'c58b07e8-7d05-4d15-b196-e8cf0022209b' 
  AND (ministry_name ILIKE '%worship%');
