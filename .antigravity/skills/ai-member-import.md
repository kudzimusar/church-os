# Skill: Maintaining AI Member Import System

This skill provides instructions for maintaining, debugging, and extending the AI-powered member import capability.

## Overview
The system relies on Gemini 2.0 Flash to classify and map membership data. Any changes to the database schema (e.g., adding a new field to `profiles`) must be synchronized across three layers.

## 1. Extending the Data Model
If you need to support a new field (e.g., `blood_group`):
1. **Database**: Add the column to the `profiles` table.
2. **Edge Function**: Update the `GEMINI_SYSTEM_PROMPT` in `supabase/functions/member-import-ai/index.ts`.
    - Add the field to the `output_format` JSON schema.
    - Add an instruction explaining how to detect this field.
3. **Wizard**: Update `ParsedMember` interface in `MemberImportWizard.tsx`.
    - Update `executeImport` to include the new field in the `profileRows` map.

## 2. Debugging AI Extraction
If the AI is failing to map specific columns:
- Check the `field_mapping` and `ai_confidence` in the `migration_jobs` table for the failing Job ID.
- Adjust the `Analysis` step in the Edge Function.
- **Tip**: For binary files (PDF/Images), ensure the user is prompted to upload high-resolution images, as OCR accuracy depends on image quality.

## 3. Managing the Rollback Window
The 24-hour rollback window is enforced by:
- `migration_jobs.rollback_deadline` (calculated as `created_at + interval '24 hours'`).
- The `undo_migration_job` SQL function which checks `NOW() < rollback_deadline`.
- To extend the window, update the interval in `supabase/migrations/20260425000000_member_migration_jobs.sql`.

## 4. Key Files to Watch
- `src/components/dashboard/import/MemberImportWizard.tsx`: Core UI and batching logic.
- `supabase/functions/member-import-ai/index.ts`: The AI "Brain" and formatting logic.
- `src/app/onboarding/page.tsx`: Entry point for new church migrations.
