import { Client } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function checkUserIntegrity(email) {
    const connectionString = process.env.SUPABASE_CONNECTION_STRING;
    const client = new Client({ connectionString });
    await client.connect();

    try {
        console.log(`Checking integrity for: ${email}`);
        
        // 1. Check Profile
        const profileRes = await client.query(
            `SELECT id, name, email, membership_status, org_id FROM public.profiles WHERE email = $1`,
            [email]
        );
        const profile = profileRes.rows[0];
        console.log("Profile in DB:", profile);

        if (profile) {
            // 2. Check Milestones
            const milestonesRes = await client.query(
                `SELECT * FROM public.member_milestones WHERE user_id = $1`,
                [profile.id]
            );
            console.log("Milestones in DB:", milestonesRes.rows);

            // 3. Check Org Members (for role/status)
            const orgMembersRes = await client.query(
                `SELECT * FROM public.org_members WHERE user_id = $1`,
                [profile.id]
            );
            console.log("Org Members in DB:", orgMembersRes.rows);
            
            // 4. Check for duplicates (same email different ID?)
            const allProfilesRes = await client.query(
                `SELECT id, name, email FROM public.profiles WHERE email = $1`,
                [email]
            );
            if (allProfilesRes.rows.length > 1) {
                console.warn("DUPLICATE PROFILES DETECTED:", allProfilesRes.rows);
            }
        } else {
            console.error("No profile found for this email.");
        }

    } catch (err) {
        console.error("Error during integrity check:", err);
    } finally {
        await client.end();
    }
}

const userEmail = "kudzimusar@gmail.com";
checkUserIntegrity(userEmail);
