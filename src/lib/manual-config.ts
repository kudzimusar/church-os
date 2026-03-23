export type ManualRole = 'super-admin' | 'pastor-hq' | 'ministry-leader' | 'member';

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
    }
  ]
};
