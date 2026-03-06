"use server";

import { supabaseAdmin as supabase } from "@/lib/supabase-admin";
import { AIService } from "@/lib/ai-service";
import { revalidatePath } from "next/cache";

export async function addMemberAction(formData: any) {
    try {
        const { name, email, phone, city, orgId, role = 'member' } = formData;

        // 1. In a real app, we might create a user in auth.users first via invite
        // For this demo, we'll assume the profile can be created or linked

        // Mocking user ID for now if email exists, or creating a profile placeholder
        const { data: profile, error: pError } = await supabase
            .from('profiles')
            .insert([{ name, email, phone, city, org_id: orgId }])
            .select()
            .single();

        if (pError) throw pError;

        const { error: mError } = await supabase
            .from('org_members')
            .insert([{ user_id: profile.id, org_id: orgId, role }]);

        if (mError) throw mError;

        revalidatePath('/shepherd/dashboard/members');
        return { success: true, data: profile };
    } catch (error: any) {
        console.error("Add Member Error:", error);
        return { success: false, error: error.message };
    }
}

export async function createEventAction(eventData: any) {
    try {
        const { name, type, date, location, description, orgId, userId } = eventData;

        // AI Enhancement: If description is short, expand it?
        // For now, just save.

        const { data, error } = await supabase
            .from('events')
            .insert([{
                name,
                event_type: type,
                event_date: date,
                location,
                description,
                org_id: orgId,
                created_by: userId
            }])
            .select()
            .single();

        if (error) throw error;

        revalidatePath('/shepherd/dashboard/events');
        return { success: true, data };
    } catch (error: any) {
        console.error("Create Event Error:", error);
        return { success: false, error: error.message };
    }
}

export async function addPrayerRequestAction(requestData: any) {
    try {
        const { text, userId, orgId, isAnonymous } = requestData;

        // AI Categorization & Urgency
        // In a real implementation, we'd call a specific AI method
        // Mocking AI classification for now
        const category = text.toLowerCase().includes('sick') || text.toLowerCase().includes('pain') ? 'health' :
            text.toLowerCase().includes('money') || text.toLowerCase().includes('job') ? 'financial' : 'general';

        const urgency = text.toLowerCase().includes('emergency') || text.toLowerCase().includes('urgent') ? 'urgent' : 'normal';

        const { data, error } = await supabase
            .from('prayer_requests')
            .insert([{
                user_id: userId,
                request_text: text,
                category,
                urgency,
                is_anonymous: isAnonymous,
                status: 'active'
            }])
            .select()
            .single();

        if (error) throw error;

        revalidatePath('/shepherd/dashboard/spiritual');
        return { success: true, data, aiInsight: `Automatically tagged as ${category} (${urgency})` };
    } catch (error: any) {
        console.error("Add Prayer Request Error:", error);
        return { success: false, error: error.message };
    }
}

export async function assignMinistryRoleAction(memberId: string, role: string, ministry: string, adminId: string) {
    try {
        const { data, error } = await supabase
            .from('ministry_members')
            .insert([{
                user_id: memberId,
                ministry_name: ministry,
                ministry_role: role,
                invited_by: adminId,
                status: 'pending_invitation'
            }])
            .select()
            .single();

        if (error) throw error;

        revalidatePath('/shepherd/dashboard/ministries');
        return { success: true, data };
    } catch (error: any) {
        console.error("Assign Role Error:", error);
        return { success: false, error: error.message };
    }
}

export async function generateReportAction(reportType: string, orgId: string, userId: string) {
    try {
        // 1. Fetch relevant data (Simulated)
        const title = `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Intelligence Briefing`;

        // 2. Use AI to synthesize (Mocked response for brevity)
        const aiSummary = `Based on current metrics for ${reportType}, we are seeing strong participation in morning devotions. However, small group attendance in the North Ward has seen a slight decline. Recommendation: Schedule a leadership meeting to discuss outreach strategies.`;

        const content = JSON.stringify({
            summary: aiSummary,
            timestamp: new Date().toISOString(),
            type: reportType
        });

        const { data, error } = await supabase
            .from('reports')
            .insert([{
                org_id: orgId,
                author_id: userId,
                title,
                report_type: reportType,
                content
            }])
            .select()
            .single();

        if (error) throw error;

        revalidatePath('/shepherd/dashboard/reports');
        return { success: true, data };
    } catch (error: any) {
        console.error("Generate Report Error:", error);
        return { success: false, error: error.message };
    }
}
