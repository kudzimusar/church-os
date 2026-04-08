-- pastoral_notes RLS fix: allow org admins/shepherds to read and write
-- pastoral notes for members in their own org.

-- Enable RLS (idempotent)
ALTER TABLE pastoral_notes ENABLE ROW LEVEL SECURITY;

-- SELECT: org admins/shepherds can read notes for members in their org
CREATE POLICY "org_admins_select_pastoral_notes"
ON pastoral_notes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM org_members
    WHERE user_id = auth.uid()
      AND org_id = pastoral_notes.org_id
      AND role IN ('admin', 'super_admin', 'shepherd')
  )
);

-- INSERT: org admins/shepherds can create notes for members in their org
CREATE POLICY "org_admins_insert_pastoral_notes"
ON pastoral_notes
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM org_members
    WHERE user_id = auth.uid()
      AND org_id = pastoral_notes.org_id
      AND role IN ('admin', 'super_admin', 'shepherd')
  )
);

-- UPDATE: org admins/shepherds can update notes for members in their org
CREATE POLICY "org_admins_update_pastoral_notes"
ON pastoral_notes
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM org_members
    WHERE user_id = auth.uid()
      AND org_id = pastoral_notes.org_id
      AND role IN ('admin', 'super_admin', 'shepherd')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM org_members
    WHERE user_id = auth.uid()
      AND org_id = pastoral_notes.org_id
      AND role IN ('admin', 'super_admin', 'shepherd')
  )
);
