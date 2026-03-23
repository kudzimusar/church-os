export type ManualRole = 'super-admin' | 'pastor-hq' | 'media-ministry' | 'ministry-leader' | 'member';

export interface ManualSection {
  title: string;
  id: string;
  icon: string;
  overview: string;
  workflow: string[];
  systemBehavior: {
    action: string;
    internalEvent: string;
    affectedTables: string[];
  }[];
  validation: {
    testTask: string;
    expectedResult: string;
    failureScenario: string;
  };
}

export const MANUAL_CONTENT: Record<ManualRole, ManualSection[]> = {
  'super-admin': [
    {
      id: 'org-creation',
      title: 'Multitenancy & Org Creation',
      icon: 'Building2',
      overview: 'Create and isolate new church instances within the OS.',
      workflow: [
        'Navigate to Global Admin > Organizations',
        'Enter unique slug and metadata',
        'Assign a primary Admin to the org_members table'
      ],
      systemBehavior: [
        { action: 'Insert Org', internalEvent: 'trigger_org_init', affectedTables: ['organizations', 'org_members'] }
      ],
      validation: {
        testTask: 'Create a "Test Church" instance.',
        expectedResult: 'New UUID generated in organizations table; user becomes admin.',
        failureScenario: 'Creating an org with a duplicate slug returns a 409 conflict.'
      }
    },
    {
        id: 'sermon-oversight',
        title: 'Sermon Oversight (Global)',
        icon: 'ShieldAlert',
        overview: 'Cross-org monitoring and audit of sermon assets.',
        workflow: [
          'Verify sermon exists per org',
          'Audit storage paths for correctness',
          'Check global aggregate metrics'
        ],
        systemBehavior: [
          { action: 'Monitor Assets', internalEvent: 'audit_event', affectedTables: ['public_sermons', 'media_assets'] }
        ],
        validation: {
          testTask: 'Verify "Test Church" sermon isolation.',
          expectedResult: 'No cross-tenant leakage; org_id correctly applied.',
          failureScenario: 'Missing org_id index results in cross-tenant data leakage (Blocked by RLS).'
        }
    }
  ],
  'pastor-hq': [
    {
      id: 'spiritual-followup',
      title: 'Spiritual Altar & Follow-ups',
      icon: 'Flame',
      overview: 'Manage real-time decisions from the Watch Library.',
      workflow: [
        'Open Pastor DASHBOARD',
        'Monitor "Decision Feed" (Live)',
        'Click "Assign" to route to a leader'
      ],
      systemBehavior: [
        { action: 'Member Commitment', internalEvent: 'trigger_spiritual_alert', affectedTables: ['spiritual_responses', 'system_logs'] }
      ],
      validation: {
        testTask: 'Submit a "Salvation Decision" on the Watch Page.',
        expectedResult: 'Alert appears in Pastor Dashboard Decision Feed within 2 seconds.',
        failureScenario: 'Un-authenticated response submission results in a 401 error.'
      }
    },
    {
        id: 'pastor-sermon-view',
        title: 'Ministry Content Utilization',
        icon: 'Video',
        overview: 'Leverage sermons for ministry and spiritual follow-up.',
        workflow: [
            'Filter sermons by speaker/date',
            'Access AI-generated transcripts for study',
            'Review spiritual impact heatmap'
        ],
        systemBehavior: [
            { action: 'Review Analytics', internalEvent: 'analytics_sync', affectedTables: ['sermon_metrics', 'spiritual_responses'] }
        ],
        validation: {
            testTask: 'Check newly uploaded sermon visibility.',
            expectedResult: 'Newly uploaded sermon appears in the correct org dashboard only.',
            failureScenario: 'Searching for an unpublished sermon results in "No items found".'
        }
    }
  ],
  'media-ministry': [
    {
        id: 'sermon-upload-workflow',
        title: 'Sermon Upload & Management',
        icon: 'Video',
        overview: 'The primary entry point for church media content.',
        workflow: [
            'Navigate to Mission Control > Sermons Tab',
            'Click "Upload Sermon" and fill Title, Speaker, Date',
            'Provide YouTube URL and metadata (Series, Scripture)',
            'Click "Post Sermon" to publish'
        ],
        systemBehavior: [
            { action: 'Insert Sermon', internalEvent: 'database_insert', affectedTables: ['public_sermons', 'media_assets'] },
            { action: 'Trigger Automation', internalEvent: 'event_outbox_push', affectedTables: ['system_event_outbox'] }
        ],
        validation: {
            testTask: 'Perform a Standard Manual Upload.',
            expectedResult: 'Sermon appears in list; correctly linked to org_id; storage paths valid.',
            failureScenario: 'Upload without required fields results in validation error toast.'
        }
    },
    {
        id: 'automation-validation',
        title: 'Automation & Processing',
        icon: 'Cpu',
        overview: 'Validate AI pipeline and background event processing.',
        workflow: [
            'Upload sermon and monitor AI Pipeline widget',
            'Verify entry in system_event_outbox (Internal)',
            'Check AI transcript generation/edit'
        ],
        systemBehavior: [
            { action: 'AI Job Processing', internalEvent: 'ai_worker_trigger', affectedTables: ['job_queue', 'media_assets', 'ai_usage'] }
        ],
        validation: {
            testTask: 'Trigger manual AI Insight edit.',
            expectedResult: 'Changes saved to public_sermons and media_assets tables.',
            failureScenario: 'Failed AI jobs move to DLQ (Dead Letter Queue) for retry.'
        }
    },
    {
        id: 'data-verification',
        title: 'Data & Output Verification',
        icon: 'Activity',
        overview: 'Ensure visibility and traceability across the system.',
        workflow: [
            'Check "Decision Feed" for new responses',
            'Verify "Impact Heatmap" for engagement data',
            'Audit activity logs for upload trails'
        ],
        systemBehavior: [
            { action: 'Log Activity', internalEvent: 'activity_audit', affectedTables: ['system_logs', 'activity_log'] }
        ],
        validation: {
            testTask: 'Verify file storage path.',
            expectedResult: 'Assets stored under /{org_id}/sermons/{id}/ structure.',
            failureScenario: 'Storage bucket permissions mismatch prevents asset viewing.'
        }
    }
  ],
  'ministry-leader': [
    {
      id: 'ai-ingestion',
      title: 'Sermon Automation Ingestion',
      icon: 'Video',
      overview: 'How a YouTube link becomes an intelligent media asset.',
      workflow: [
        'Post link in Sermon Manager',
        'Wait for "Job Worker" polling (1-min interval)',
        'Review AI Transcript & Summary outputs'
      ],
      systemBehavior: [
        { action: 'Create Sermon', internalEvent: 'ai-worker trigger', affectedTables: ['job_queue', 'media_assets', 'ai_usage'] }
      ],
      validation: {
        testTask: 'Add a new YouTube Sermon link.',
        expectedResult: 'Job queue shows "pending" then "completed". Transcript appears in UI.',
        failureScenario: 'Exceeding AI monthly token quota blocks the processing job.'
      }
    }
  ],
  'member': [
    {
      id: 'devotion-engine',
      title: 'Personal SOAPs & Streaks',
      icon: 'BookOpen',
      overview: 'Submit daily devotions and track your spiritual growth.',
      workflow: [
        'Open Devotions tab',
        'Complete Scriptue, Observation, Application, Prayer',
        'Save and view streak update'
      ],
      systemBehavior: [
        { action: 'SOAP Submission', internalEvent: 'sentiment_analysis', affectedTables: ['soap_entries', 'user_progress'] }
      ],
      validation: {
        testTask: 'Submit a new SOAP entry.',
        expectedResult: 'Daily streak increments; Sentiment analysis logs to HQ.',
        failureScenario: 'Trying to edit another member\'s devotion results in permission denied.'
      }
    },
    {
        id: 'member-sermon-consumption',
        title: 'Sermon Consumption',
        icon: 'PlayCircle',
        overview: 'Access life-changing messages from your mobile device.',
        workflow: [
            'Search for sermons by title or topic',
            'Play video/audio media',
            'Submit spiritual responses (Salvation, Prayer)'
        ],
        systemBehavior: [
            { action: 'Log Playback', internalEvent: 'member_analytics', affectedTables: ['member_analytics', 'sermon_metrics'] }
        ],
        validation: {
            testTask: 'Submit a Salvation decision.',
            expectedResult: 'Response logged in spiritual_responses; Pastor notified.',
            failureScenario: 'Accessing draft sermons is blocked via RLS.'
        }
    }
  ]
};
