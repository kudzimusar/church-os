import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function checkRest() {
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/profiles?select=marital_status&limit=1`;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    console.log(`Checking ${url}...`);
    const resp = await fetch(url, {
        headers: {
            'apikey': anonKey,
            'Authorization': `Bearer ${anonKey}`
        }
    });

    const data = await resp.json();
    console.log("REST Data Response:", JSON.stringify(data, null, 2));
}

checkRest();
