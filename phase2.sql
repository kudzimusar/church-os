-- Seed the 12 core JKC ministries
INSERT INTO ministries (org_id, name, slug, category, color, icon) VALUES
  ('fa547adf-f820-412f-9458-d6bade11517d', 'Worship Ministry',     'worship',     'worship',  '#7C3AED', 'music'),
  ('fa547adf-f820-412f-9458-d6bade11517d', 'Ushering Ministry',    'ushers',      'admin',    '#0EA5E9', 'door-open'),
  ('fa547adf-f820-412f-9458-d6bade11517d', 'Children''s Ministry', 'childrens',   'care',     '#F59E0B', 'heart'),
  ('fa547adf-f820-412f-9458-d6bade11517d', 'Youth Ministry',       'youth',       'care',     '#10B981', 'star'),
  ('fa547adf-f820-412f-9458-d6bade11517d', 'Evangelism Ministry',  'evangelism',  'outreach', '#EF4444', 'send'),
  ('fa547adf-f820-412f-9458-d6bade11517d', 'Prayer Ministry',      'prayer',      'worship',  '#8B5CF6', 'activity'),
  ('fa547adf-f820-412f-9458-d6bade11517d', 'Media Ministry',       'media',       'media',    '#06B6D4', 'video'),
  ('fa547adf-f820-412f-9458-d6bade11517d', 'Hospitality Ministry', 'hospitality', 'care',     '#F97316', 'coffee'),
  ('fa547adf-f820-412f-9458-d6bade11517d', 'Fellowship Circles',   'fellowship',  'care',     '#84CC16', 'users'),
  ('fa547adf-f820-412f-9458-d6bade11517d', 'Finance Ministry',     'finance',     'admin',    '#14B8A6', 'dollar-sign'),
  ('fa547adf-f820-412f-9458-d6bade11517d', 'Missions Ministry',    'missions',    'outreach', '#F43F5E', 'globe'),
  ('fa547adf-f820-412f-9458-d6bade11517d', 'Pastoral Care',        'pastoral',    'care',     '#A855F7', 'shield')
ON CONFLICT (org_id, slug) DO NOTHING;

-- FORM 1: Ministry Attendance Report
INSERT INTO form_templates (org_id, name, report_type, description, fields) VALUES (
  'fa547adf-f820-412f-9458-d6bade11517d',
  'Ministry Attendance Report',
  'attendance',
  'Track service attendance, visitors, and headcount for any ministry',
  '[
    {"name":"service_date",   "label":"Service Date",     "type":"date",   "required":true},
    {"name":"service_type",   "label":"Service Type",     "type":"select", "required":true,
     "options":["Sunday Service","Midweek Service","Special Event","Training","Retreat"]},
    {"name":"total_adults",   "label":"Total Adults",     "type":"number", "required":true},
    {"name":"total_children", "label":"Total Children",   "type":"number", "required":false},
    {"name":"first_time_visitors","label":"First-Time Visitors","type":"number","required":false},
    {"name":"notes",          "label":"Notes",            "type":"textarea","required":false}
  ]'
);

-- FORM 2: Weekly Ministry Activity Report
INSERT INTO form_templates (org_id, name, report_type, description, fields) VALUES (
  'fa547adf-f820-412f-9458-d6bade11517d',
  'Ministry Activity Report',
  'activity',
  'Weekly summary of ministry activities, outcomes, and prayer requests',
  '[
    {"name":"activity_description", "label":"Activity Description", "type":"textarea","required":true},
    {"name":"members_involved",     "label":"Members Involved",     "type":"number", "required":true},
    {"name":"outcome",              "label":"Outcome / Result",     "type":"textarea","required":true},
    {"name":"challenges",           "label":"Challenges Faced",    "type":"textarea","required":false},
    {"name":"prayer_requests",      "label":"Prayer Requests",     "type":"textarea","required":false},
    {"name":"status",               "label":"Report Status",       "type":"select", "required":true,
     "options":["submitted","flagged"]}
  ]'
);

-- FORM 3: Event Report
INSERT INTO form_templates (org_id, name, report_type, description, fields) VALUES (
  'fa547adf-f820-412f-9458-d6bade11517d',
  'Ministry Event Report',
  'event',
  'Post-event report capturing attendance, salvations, testimonies, and budget',
  '[
    {"name":"event_name",   "label":"Event Name",           "type":"text",    "required":true},
    {"name":"attendance",   "label":"Total Attendance",     "type":"number",  "required":true},
    {"name":"visitors",     "label":"Visitors",             "type":"number",  "required":false},
    {"name":"salvations",   "label":"Salvations",           "type":"number",  "required":false},
    {"name":"testimonies",  "label":"Testimonies",          "type":"textarea","required":false},
    {"name":"budget_used",  "label":"Budget Used (JPY)",    "type":"number",  "required":false},
    {"name":"outcome",      "label":"Overall Outcome",      "type":"textarea","required":true}
  ]'
);

-- FORM 4: Resource & Equipment Report
INSERT INTO form_templates (org_id, name, report_type, description, fields) VALUES (
  'fa547adf-f820-412f-9458-d6bade11517d',
  'Resource & Equipment Report',
  'equipment',
  'Track equipment status, damage, and repair needs',
  '[
    {"name":"equipment_name",       "label":"Equipment Name",    "type":"text",   "required":true},
    {"name":"status",               "label":"Status",            "type":"select", "required":true,
     "options":["Working","Needs Repair","Damaged","Lost"]},
    {"name":"damage_description",   "label":"Damage Description","type":"textarea","required":false},
    {"name":"repair_required",      "label":"Repair Required?",  "type":"boolean","required":true},
    {"name":"urgency",              "label":"Urgency",           "type":"select", "required":false,
     "options":["Low","Medium","Critical"]}
  ]'
);

-- CHILDREN'S MINISTRY: Sunday School Class Report
INSERT INTO form_templates (org_id, ministry_id, name, report_type, description, fields)
SELECT 'fa547adf-f820-412f-9458-d6bade11517d', m.id,
  'Sunday School Class Report', 'children_class',
  'Weekly classroom attendance, lesson tracking, and incident notes',
  '[
    {"name":"class_name",           "label":"Class Name",            "type":"text",    "required":true},
    {"name":"teacher_name",         "label":"Teacher Name",          "type":"text",    "required":true},
    {"name":"lesson_topic",         "label":"Lesson Topic",          "type":"text",    "required":true},
    {"name":"bible_passage",        "label":"Bible Passage",         "type":"text",    "required":false},
    {"name":"children_present",     "label":"Children Present",      "type":"number",  "required":true},
    {"name":"activities_completed", "label":"Activities Completed",  "type":"textarea","required":false},
    {"name":"behaviour_notes",      "label":"Behaviour Notes",       "type":"textarea","required":false},
    {"name":"prayer_requests",      "label":"Children Prayer Requests","type":"textarea","required":false},
    {"name":"incidents",            "label":"Incidents (if any)",    "type":"textarea","required":false}
  ]'
FROM ministries m WHERE m.slug = 'childrens' AND m.org_id = 'fa547adf-f820-412f-9458-d6bade11517d';

-- USHERING: Service Headcount & Offering
INSERT INTO form_templates (org_id, ministry_id, name, report_type, description, fields)
SELECT 'fa547adf-f820-412f-9458-d6bade11517d', m.id,
  'Service Headcount Report', 'offering_recon',
  'Official usher attendance count and offering reconciliation',
  '[
    {"name":"total_adults",          "label":"Total Adults",          "type":"number", "required":true},
    {"name":"total_children",        "label":"Total Children",        "type":"number", "required":true},
    {"name":"first_time_visitors",   "label":"First-Time Visitors",   "type":"number", "required":true},
    {"name":"offering_collected",    "label":"Offering Collected (JPY)","type":"number","required":false},
    {"name":"incidents",             "label":"Incidents or Seating Notes","type":"textarea","required":false}
  ]'
FROM ministries m WHERE m.slug = 'ushers' AND m.org_id = 'fa547adf-f820-412f-9458-d6bade11517d';

-- EVANGELISM: Outreach Report
INSERT INTO form_templates (org_id, ministry_id, name, report_type, description, fields)
SELECT 'fa547adf-f820-412f-9458-d6bade11517d', m.id,
  'Outreach Event Report', 'outreach',
  'Capture souls reached, salvations recorded, and follow-up contacts',
  '[
    {"name":"outreach_location",  "label":"Location",              "type":"text",    "required":true},
    {"name":"volunteers_present", "label":"Volunteers Present",    "type":"number",  "required":true},
    {"name":"people_reached",     "label":"People Reached",        "type":"number",  "required":true},
    {"name":"salvations",         "label":"Salvations Recorded",   "type":"number",  "required":true},
    {"name":"contacts_collected", "label":"Contacts Collected",    "type":"number",  "required":false},
    {"name":"follow_up_notes",    "label":"Follow-Up Notes",       "type":"textarea","required":false}
  ]'
FROM ministries m WHERE m.slug = 'evangelism' AND m.org_id = 'fa547adf-f820-412f-9458-d6bade11517d';

-- MEDIA: Livestream Analytics
INSERT INTO form_templates (org_id, ministry_id, name, report_type, description, fields)
SELECT 'fa547adf-f820-412f-9458-d6bade11517d', m.id,
  'Livestream Analytics Report', 'media_stream',
  'Digital reach metrics: viewers, uploads, and technical issues',
  '[
    {"name":"stream_platform",     "label":"Platform",           "type":"select",  "required":true,
     "options":["YouTube","Facebook","YouTube + Facebook","Other"]},
    {"name":"peak_viewers",        "label":"Peak Viewers",       "type":"number",  "required":true},
    {"name":"total_views",         "label":"Total Views",        "type":"number",  "required":false},
    {"name":"recording_uploaded",  "label":"Recording Uploaded?","type":"boolean", "required":true},
    {"name":"technical_issues",    "label":"Technical Issues",   "type":"textarea","required":false}
  ]'
FROM ministries m WHERE m.slug = 'media' AND m.org_id = 'fa547adf-f820-412f-9458-d6bade11517d';

-- PASTORAL CARE: Counseling / Visitation Log
INSERT INTO form_templates (org_id, ministry_id, name, report_type, description, fields)
SELECT 'fa547adf-f820-412f-9458-d6bade11517d', m.id,
  'Pastoral Care Session Log', 'counseling',
  'Log counseling sessions, visitations, and crisis support cases',
  '[
    {"name":"session_type",   "label":"Session Type",    "type":"select",  "required":true,
     "options":["Counseling","Visitation","Crisis Support","Phone Call","Prayer"]},
    {"name":"anonymous_code", "label":"Member Code (no names)","type":"text","required":true},
    {"name":"session_summary","label":"Summary",          "type":"textarea","required":true},
    {"name":"outcome",        "label":"Outcome",          "type":"textarea","required":false},
    {"name":"follow_up_needed","label":"Follow-Up Needed?","type":"boolean","required":true},
    {"name":"urgency",        "label":"Urgency Level",    "type":"select",  "required":true,
     "options":["Normal","Monitor","Urgent","Crisis"]}
  ]'
FROM ministries m WHERE m.slug = 'pastoral' AND m.org_id = 'fa547adf-f820-412f-9458-d6bade11517d';

-- WORSHIP: Rehearsal & Service Report
INSERT INTO form_templates (org_id, ministry_id, name, report_type, description, fields)
SELECT 'fa547adf-f820-412f-9458-d6bade11517d', m.id,
  'Worship Team Report', 'activity',
  'Rehearsal attendance, songs used, and technical status per service',
  '[
    {"name":"worship_leader",  "label":"Worship Leader",    "type":"text",    "required":true},
    {"name":"musicians_present","label":"Musicians Present", "type":"number",  "required":true},
    {"name":"songs_used",      "label":"Songs Used",         "type":"textarea","required":true},
    {"name":"rehearsal_held",  "label":"Rehearsal Held?",    "type":"boolean", "required":true},
    {"name":"technical_issues","label":"Technical Issues",   "type":"textarea","required":false},
    {"name":"notes",           "label":"Notes",              "type":"textarea","required":false}
  ]'
FROM ministries m WHERE m.slug = 'worship' AND m.org_id = 'fa547adf-f820-412f-9458-d6bade11517d';
