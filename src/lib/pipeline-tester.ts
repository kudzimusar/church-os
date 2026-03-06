import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

/**
 * Script to test the Digital Ministry Forms Pipeline.
 * 1. Simulates a form submission.
 * 2. Verifies data in form_submissions and form_submission_values.
 * 3. Checks if the dispatcher correctly moved data to specialized tables (e.g. service_reports).
 */
export async function testMinistryPipeline() {
    console.log("🧪 Starting Ministry Pipeline Integration Test...");

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Auth required for testing");

        // 1. Find the Usher form
        const { data: form } = await supabase.from('forms').select('id').eq('name', 'Usher Headcount Report').single();
        if (!form) throw new Error("Usher form not found");

        const testId = `test_${Math.random().toString(36).substr(2, 5)}`;

        // 2. Submit header
        const { data: submission, error: sError } = await supabase.from('form_submissions').insert([{
            form_id: form.id,
            user_id: user.id,
            notes: `INTEGRATION TEST: ${testId}`
        }]).select().single();
        if (sError) throw sError;

        // 3. Submit values (Mock Adults: 50, Children: 20, Total: 70)
        const fields = await supabase.from('form_fields').select('id, label').eq('form_id', form.id);
        const values = fields.data?.map(f => ({
            submission_id: submission.id,
            field_id: f.id,
            field_value: f.label === 'Adults' ? '50' : f.label === 'Children' ? '20' : f.label === 'Total' ? '70' : 'Test'
        })) || [];

        const { error: vError } = await supabase.from('form_submission_values').insert(values);
        if (vError) throw vError;

        // 4. Trigger Dispatcher
        const { data: result, error: rpcError } = await supabase.rpc('finalize_form_submission', {
            p_submission_id: submission.id
        });
        if (rpcError) throw rpcError;

        console.log("✅ Pipeline Dispatcher Result:", result);

        // 5. Verify service_reports
        const { data: report } = await supabase.from('service_reports')
            .select('*')
            .eq('notes', `INTEGRATION TEST: ${testId}`)
            .single();

        if (report && report.total_count === 70) {
            console.log("🎉 SUCCESS: Data correctly synchronized to service_reports.");
            toast.success("Ministry Pipeline Test Passed!");
            return true;
        } else {
            throw new Error("Data synchronization failed: Record not found in service_reports");
        }

    } catch (err: any) {
        console.error("❌ Pipeline Test Failed:", err);
        toast.error(`Pipeline Test Failed: ${err.message}`);
        return false;
    }
}
