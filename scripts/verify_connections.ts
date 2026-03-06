import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { supabaseAdmin } from '../src/lib/supabase-admin';

async function verify() {
    console.log("🔍 VERIFYING CHURCH OS CONNECTIONS\n");

    // 1. MEMBER -> MINISTRY CONNECTION
    console.log("--- 1. Member -> Ministry Connection ---");
    const { data: profile } = await supabaseAdmin.from('profiles').select('id, name').limit(1).single();
    if (profile) {
        console.log(`Checking connection for member: ${profile.name} (${profile.id})`);

        // Ensure they are in a ministry
        const testMinistry = "Worship Ministry";
        const { error: joinError } = await supabaseAdmin.from('ministry_members').upsert({
            user_id: profile.id,
            ministry_name: testMinistry,
            role: 'Member',
            active_status: true
        });

        if (joinError) {
            console.error("❌ Join Error:", joinError.message);
        } else {
            console.log(`✅ Member added to ${testMinistry}`);

            // Check view
            const { data: viewData, error: viewError } = await supabaseAdmin.from('vw_ministry_efficiency')
                .select('*')
                .eq('ministry_name', testMinistry)
                .single();

            if (viewError) {
                console.error("❌ View Error:", viewError.message);
            } else if (viewData && viewData.registered_members > 0) {
                console.log(`✅ SUCCESS: Member -> Ministry connection is REAL. View reflects ${viewData.registered_members} members in ${testMinistry}.`);
            } else {
                console.error("❌ CONNECTION FAILED: Member added but view shows 0 members.");
            }
        }
    } else {
        console.log("ℹ️ No profile found to test ministry connection.");
    }

    // 2. HEADCOUNT -> ATTENDANCE CONNECTION
    console.log("\n--- 2. Headcount -> Attendance Connection ---");
    const testDate = new Date().toISOString().split('T')[0];
    const testHeadcount = 150;

    const { error: reportError } = await supabaseAdmin.from('ministry_reports').upsert({
        ministry_name: "Ushers",
        report_date: testDate,
        metrics: { total: testHeadcount, adults: 100, children: 50 },
        summary: "INTEGRATION TEST HEADCOUNT"
    }, { onConflict: 'ministry_name, report_date' });

    if (reportError) {
        console.error("❌ Report Error:", reportError.message);
    } else {
        console.log(`✅ Headcount reported for ${testDate}: ${testHeadcount}`);

        const { data: recon, error: reconError } = await supabaseAdmin.from('vw_attendance_reconciliation')
            .select('*')
            .eq('report_date', testDate)
            .single();

        if (reconError) {
            console.error("❌ Recon View Error:", reconError.message);
        } else if (recon && recon.total_physical == testHeadcount) {
            console.log(`✅ SUCCESS: Headcount -> Dashboard connection is REAL. View reflects ${recon.total_physical} physical attendees.`);
        } else {
            console.error(`❌ CONNECTION FAILED: Headcount reported as ${testHeadcount} but view shows ${recon?.total_physical}.`);
        }
    }

    console.log("\n--- VERIFICATION FINISHED ---");
}

verify().catch(console.error);
