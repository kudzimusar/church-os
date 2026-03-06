import { supabaseAdmin } from '../src/lib/supabase-admin';
import { MINISTRY_OPTIONS } from '../src/lib/constants';

async function runAudit() {
    console.log("🚀 STARTING CHURCH OS DATA PIPELINE AUDIT\n");

    // 1. Check Table Consistency
    console.log("--- 1. Table Statistics ---");
    const tables = [
        'profiles',
        'ministry_members',
        'attendance_records',
        'ministry_reports',
        'member_milestones',
        'prophetic_insights'
    ];

    for (const table of tables) {
        const { count, error } = await supabaseAdmin.from(table).select('*', { count: 'exact', head: true });
        if (error) {
            console.error(`❌ Table ${table}: Error - ${error.message}`);
        } else {
            console.log(`✅ Table ${table}: ${count} records`);
        }
    }

    // 2. Check View Consistency
    console.log("\n--- 2. Analytical View Health ---");
    const views = [
        'vw_attendance_reconciliation',
        'vw_ministry_efficiency',
        'vw_spiritual_pulse',
        'vw_activity_velocity'
    ];

    for (const view of views) {
        const { data, error } = await supabaseAdmin.from(view).select('*').limit(1);
        if (error) {
            console.error(`❌ View ${view}: FAILED - ${error.message}`);
        } else {
            console.log(`✅ View ${view}: OPERATIONAL (${data?.length || 0} sample rows)`);
            if (data && data.length > 0) {
                console.log(`   Sample Data:`, JSON.stringify(data[0]).substring(0, 100) + "...");
            }
        }
    }

    // 3. Ministry Alignment Check
    console.log("\n--- 3. Ministry Alignment Audit ---");
    const { data: dbMinistries } = await supabaseAdmin.from('ministry_members').select('ministry_name');
    const uniqueDbMinistries = [...new Set(dbMinistries?.map(m => m.ministry_name) || [])];

    console.log(`Database has ${uniqueDbMinistries.length} unique ministries in use.`);
    console.log(`Constants file defines ${MINISTRY_OPTIONS.length} available ministries.`);

    const missingInConstants = uniqueDbMinistries.filter(m => !MINISTRY_OPTIONS.includes(m));
    if (missingInConstants.length > 0) {
        console.warn(`⚠️  Ministries in DB but NOT in constants:`, missingInConstants);
    } else {
        console.log(`✅ All active DB ministries are accounted for in constants.`);
    }

    // 4. Trace a sample "Attendance" Pipeline
    console.log("\n--- 4. Data Pipeline Trace (Sample) ---");
    const { data: latestReport } = await supabaseAdmin.from('ministry_reports')
        .select('*')
        .order('report_date', { ascending: false })
        .limit(1);

    if (latestReport && latestReport.length > 0) {
        const report = latestReport[0];
        console.log(`Latest Ministry Report: ${report.ministry_name} on ${report.report_date}`);

        const { data: recon } = await supabaseAdmin.from('vw_attendance_reconciliation')
            .select('*')
            .eq('report_date', report.report_date);

        if (recon && recon.length > 0) {
            console.log(`✅ Pipeline Trace SUCCESS: Report from ${report.report_date} is visible in Analytics View.`);
            console.log(`   Physical: ${recon[0].total_physical}, Digital: ${recon[0].total_digital}`);
        } else {
            console.warn(`⚠️  Pipeline Gap: Report exists for ${report.report_date} but NOT visible in Reconciliation view. Check filters.`);
        }
    } else {
        console.log("ℹ️ No ministry reports found to trace.");
    }

    console.log("\n--- AUDIT COMPLETE ---");
}

runAudit().catch(console.error);
