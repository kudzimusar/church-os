import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing credentials in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("Checking organizations...");
    let { data: org, error: orgErr } = await supabase.from('organizations').select('id').limit(1).maybeSingle();

    if (!org) {
        console.log("No organization found. Creating 'Japan Kingdom Church'...");
        const { data: newOrg, error: insErr } = await supabase.from('organizations').insert({
            name: 'Japan Kingdom Church',
            domain: 'jkc.org'
        }).select().single();

        if (insErr) {
            console.error("Failed to create org:", insErr);
            process.exit(1);
        }
        org = newOrg;
    }

    console.log("Organization ID:", org.id);

    console.log("Aligning all profiles to organization...");
    const { error: updErr } = await supabase.from('profiles')
        .update({ org_id: org.id })
        .is('org_id', null);

    if (updErr) console.error("Profile update error:", updErr);

    console.log("Granting read access to organizations for all authenticated users...");
    // We can't run raw SQL from the JS client easily unless we use an RPC.
    // But we can check if there's any user without an org_member.
    const { data: profiles } = await supabase.from('profiles').select('id');
    for (const p of (profiles || [])) {
        await supabase.from('org_members').upsert({
            user_id: p.id,
            org_id: org.id,
            role: 'visitor',
            stage: 'seeker'
        }, { onConflict: 'user_id, org_id' });
    }

    console.log("Done.");
}

run();
