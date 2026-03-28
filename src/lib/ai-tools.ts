import { supabase } from '@/lib/supabase';

/**
 * AI TOOLS - Operational Layer for Church OS
 * This file defines the tools Gemini can call to perform database operations.
 * @see knowledge/domain/index.md for data governance rules.
 */

// Tool definitions for Gemini (Function Calling Specs)
export const aiTools = [
  {
    functionDeclarations: [
      {
        name: 'create_care_task',
        description: 'Create a pastoral care follow-up task for a member who needs attention',
        parameters: {
          type: 'OBJECT',
          properties: {
            member_id: {
              type: 'STRING',
              description: 'The UUID of the member to create a task for'
            },
            task_type: {
              type: 'STRING',
              enum: ['call', 'visit', 'prayer', 'check_in', 'follow_up'],
              description: 'Type of care task'
            },
            due_date: {
              type: 'STRING',
              description: 'ISO date string for when this task is due'
            },
            notes: {
              type: 'STRING',
              description: 'Additional context or notes about this task'
            }
          },
          required: ['member_id', 'task_type']
        }
      },
      {
        name: 'mark_insight_visited',
        description: 'Mark a prophetic insight as addressed/visited',
        parameters: {
          type: 'OBJECT',
          properties: {
            insight_id: {
              type: 'STRING',
              description: 'The UUID of the prophetic insight to mark as visited'
            }
          },
          required: ['insight_id']
        }
      },
      {
        name: 'update_profile_skill',
        description: 'Add or remove a skill/talent from the user\'s profile',
        parameters: {
          type: 'OBJECT',
          properties: {
            action: {
              type: 'STRING',
              enum: ['add', 'remove'],
              description: 'Whether to add or remove the skill'
            },
            skill: {
              type: 'STRING',
              description: 'The skill name to manage (e.g., "Worship", "Teaching", "Tech")'
            }
          },
          required: ['action', 'skill']
        }
      },
      {
        name: 'escalate_to_human',
        description: 'Escalate the conversation to a human staff member when AI cannot help',
        parameters: {
          type: 'OBJECT',
          properties: {
            reason: {
              type: 'STRING',
              description: 'The reason for escalation'
            },
            department: {
              type: 'STRING',
              enum: ['pastoral', 'technical', 'administrative', 'events'],
              description: 'Which department should handle this'
            },
            urgency: {
              type: 'STRING',
              enum: ['normal', 'high', 'emergency'],
              description: 'Urgency level'
            }
          },
          required: ['reason', 'department']
        }
      },
      {
        name: 'create_prayer_request',
        description: 'Create a prayer request for the user',
        parameters: {
          type: 'OBJECT',
          properties: {
            category: {
              type: 'STRING',
              description: 'Category: health, family, financial, spiritual, career, etc.'
            },
            request_text: {
              type: 'STRING',
              description: 'The detailed prayer request'
            },
            urgency: {
              type: 'STRING',
              enum: ['normal', 'urgent', 'crisis'],
              description: 'Urgency level'
            },
            is_anonymous: {
              type: 'BOOLEAN',
              description: 'Whether to hide the user\'s name from the prayer list'
            }
          },
          required: ['category', 'request_text']
        }
      },
      {
        name: 'schedule_reminder',
        description: 'Schedule a personal reminder for the user',
        parameters: {
          type: 'OBJECT',
          properties: {
            message: {
              type: 'STRING',
              description: 'What to remind the user about'
            },
            datetime: {
              type: 'STRING',
              description: 'ISO datetime string for when to send the reminder'
            },
            reminder_type: {
              type: 'STRING',
              enum: ['devotion', 'event', 'prayer', 'follow_up', 'general'],
              description: 'Type of reminder'
            }
          },
          required: ['message', 'datetime']
        }
      },
      {
        name: 'record_attendance',
        description: 'Record a member\'s attendance at a Sunday or Midweek service',
        parameters: {
          type: 'OBJECT',
          properties: {
            member_id: {
              type: 'STRING',
              description: 'The UUID of the member attending'
            },
            event_type: {
              type: 'STRING',
              enum: ['sunday_service', 'midweek_service', 'fellowship', 'event'],
              description: 'Type of event category'
            },
            event_date: {
              type: 'STRING',
              description: 'ISO date string (YYYY-MM-DD)'
            }
          },
          required: ['member_id', 'event_type', 'event_date']
        }
      }
    ]
  }
];

// Tool execution logic
export async function executeToolCall(
  toolName: string,
  args: any,
  userId: string,
  userRole: string
): Promise<{ success: boolean; message: string; data?: any }> {
  
  console.log(`[AI TOOLS] Executing tool: ${toolName} for user ${userId} (${userRole})`);

  try {
    switch (toolName) {
      case 'create_care_task':
        return await createCareTask(args, userId);
        
      case 'mark_insight_visited':
        return await markInsightVisited(args);
        
      case 'update_profile_skill':
        return await updateProfileSkill(args, userId);
        
      case 'escalate_to_human':
        return await escalateToHuman(args, userId);
        
      case 'create_prayer_request':
        return await createPrayerRequest(args, userId);
        
      case 'schedule_reminder':
        return await scheduleReminder(args, userId);
        
      case 'record_attendance':
        return await recordAttendance(args);
        
      default:
        return { success: false, message: `Tool not found: ${toolName}` };
    }
  } catch (err: any) {
    console.error(`[AI TOOLS] Execution error in ${toolName}:`, err);
    return { success: false, message: `System error: ${err.message}` };
  }
}

// Tool Implementation Logic

async function createCareTask(params: any, userId: string) {
  const { data, error } = await supabase
    .from('care_records')
    .insert({
      member_id: params.member_id,
      shepherd_id: userId,
      task_type: params.task_type,
      due_date: params.due_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      notes: params.notes,
      status: 'pending'
    })
    .select()
    .single();

  if (error) return { success: false, message: error.message };
  return { success: true, message: `Created care task for member successfully.`, data };
}

async function markInsightVisited(params: any) {
  const { error } = await supabase
    .from('prophetic_insights')
    .update({ visited: true, visited_at: new Date().toISOString() })
    .eq('id', params.insight_id);

  if (error) return { success: false, message: error.message };
  return { success: true, message: 'Insight marked as addressed.' };
}

async function updateProfileSkill(params: any, userId: string) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('skills_talents')
    .eq('id', userId)
    .single();

  let currentSkills = Array.isArray(profile?.skills_talents) ? profile.skills_talents : [];
  
  if (params.action === 'add') {
    if (!currentSkills.includes(params.skill)) currentSkills.push(params.skill);
  } else {
    currentSkills = currentSkills.filter((s: string) => s !== params.skill);
  }

  const { error } = await supabase
    .from('profiles')
    .update({ skills_talents: currentSkills })
    .eq('id', userId);

  if (error) return { success: false, message: error.message };
  return { success: true, message: `Successfully updated your skills: ${params.skill} ${params.action}ed.` };
}

async function escalateToHuman(params: any, userId: string) {
  const { data, error } = await supabase
    .from('escalations')
    .insert({
      user_id: userId,
      department: params.department,
      reason: params.reason,
      urgency: params.urgency || 'normal'
    })
    .select()
    .single();

  if (error) return { success: false, message: error.message };
  return { success: true, message: `Case escalated to ${params.department}. A representative will contact you.`, data };
}

async function createPrayerRequest(params: any, userId: string) {
  const { error } = await supabase
    .from('prayer_requests')
    .insert({
      user_id: userId,
      category: params.category,
      request_text: params.request_text,
      urgency: params.urgency || 'normal',
      is_anonymous: params.is_anonymous || false
    });

  if (error) return { success: false, message: error.message };
  return { success: true, message: 'Your prayer request has been submitted to the intercessory team.' };
}

async function scheduleReminder(params: any, userId: string) {
  const { error } = await supabase
    .from('reminders')
    .insert({
      user_id: userId,
      message: params.message,
      reminder_type: params.reminder_type || 'general',
      scheduled_for: params.datetime
    });

  if (error) return { success: false, message: error.message };
  return { success: true, message: `Reminder scheduled for ${new Date(params.datetime).toLocaleString()}.` };
}

async function recordAttendance(params: any) {
  const { error } = await supabase
    .from('attendance_records')
    .insert({
      user_id: params.member_id,
      event_type: params.event_type,
      event_date: params.event_date
    });

  if (error) return { success: false, message: error.message };
  return { success: true, message: 'Attendance recorded successfully.' };
}
