import pkg from 'pg';
const { Client } = pkg;
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local
const envPath = resolve(__dirname, '../.env.local');
const envFile = readFileSync(envPath, 'utf8');
envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) process.env[match[1]] = match[2];
});

const CONNECTION_STRING = `postgresql://postgres:Youblessme-1985@db.dapxrorkcvpzzkggopsa.supabase.co:5432/postgres`;

const client = new Client({
    connectionString: CONNECTION_STRING,
    ssl: { rejectUnauthorized: false }
});

async function run(sql: string, label: string) {
    try {
        await client.query(sql);
        console.log(`  ✅ ${label}`);
    } catch (e: any) {
        if (e.message.includes('already exists')) {
            console.log(`  ⏭️  ${label} (already exists)`);
        } else {
            console.log(`  ⚠️  ${label}: ${e.message}`);
        }
    }
}

async function main() {
    console.log('📡 Connecting to Supabase Postgres to apply RLS patches...');
    await client.connect();
    console.log('✅ Connected!\n');

    console.log('─── Applying RLS Policies for org_members ───');
    // Allow users to read their own org_members record
    await run(`DROP POLICY IF EXISTS "Users read own org_membership" ON public.org_members;`, 'Drop old org_members policy');
    await run(`CREATE POLICY "Users read own org_membership" ON public.org_members FOR SELECT USING (user_id = auth.uid());`, 'Create read own org_members policy');

    console.log('\n─── Updating Admin Policies with super_admin ───');
    // Update the admin role check to include super_admin
    const adminRoles = `('super_admin', 'shepherd', 'admin', 'owner', 'ministry_lead')`;
    const adminCheck = `EXISTS (SELECT 1 FROM public.org_members WHERE user_id = auth.uid() AND role IN ${adminRoles})`;

    await run(`DROP POLICY IF EXISTS "Admins read all profiles" ON public.profiles;`, 'drop profiles policy');
    await run(`CREATE POLICY "Admins read all profiles" ON public.profiles FOR SELECT USING (${adminCheck} OR id = auth.uid());`, 'policy: profiles');

    await run(`DROP POLICY IF EXISTS "Admins read all stats" ON public.member_stats;`, 'drop member_stats policy');
    await run(`CREATE POLICY "Admins read all stats" ON public.member_stats FOR SELECT USING (${adminCheck});`, 'policy: member_stats admin');

    await run(`DROP POLICY IF EXISTS "Admins read all soap" ON public.soap_entries;`, 'drop soap policy');
    await run(`CREATE POLICY "Admins read all soap" ON public.soap_entries FOR SELECT USING (${adminCheck});`, 'policy: soap admin');

    await run(`DROP POLICY IF EXISTS "Admins read prayer requests" ON public.prayer_requests;`, 'drop prayer policy');
    await run(`CREATE POLICY "Admins read prayer requests" ON public.prayer_requests FOR SELECT USING (${adminCheck});`, 'policy: prayer admin');

    await run(`DROP POLICY IF EXISTS "Admins manage pastoral notes" ON public.pastoral_notes;`, 'drop pastoral_notes policy');
    await run(`CREATE POLICY "Admins manage pastoral notes" ON public.pastoral_notes FOR ALL USING (${adminCheck.replace(adminRoles, "('super_admin', 'shepherd', 'admin', 'owner')")});`, 'policy: pastoral_notes');

    await run(`DROP POLICY IF EXISTS "Admins read insights" ON public.ai_insights;`, 'drop ai_insights policy');
    await run(`CREATE POLICY "Admins read insights" ON public.ai_insights FOR SELECT USING (${adminCheck});`, 'policy: ai_insights');

    await run(`DROP POLICY IF EXISTS "Admins read all attendance" ON public.attendance_records;`, 'drop attendance policy');
    await run(`CREATE POLICY "Admins read all attendance" ON public.attendance_records FOR SELECT USING (${adminCheck});`, 'policy: attendance admin');

    await run(`DROP POLICY IF EXISTS "Admins manage ministry" ON public.ministry_members;`, 'drop ministry policy');
    await run(`CREATE POLICY "Admins manage ministry" ON public.ministry_members FOR ALL USING (${adminCheck});`, 'policy: ministry_members');

    console.log('\n─── Refreshing Schema Cache ───');
    await run(`NOTIFY pgrst, 'reload schema'`, 'PostgREST schema cache reloaded');

    await client.end();
    console.log('\n✅ Database Patch Complete! RLS issues fixed.');
}

main().catch(async (e) => {
    console.error('Migration failed:', e.message);
    try { await client.end(); } catch { }
    process.exit(1);
});
