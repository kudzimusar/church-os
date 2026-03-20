import { Client } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function updateName() {
    const connectionString = process.env.SUPABASE_CONNECTION_STRING;
    const client = new Client({ connectionString });
    await client.connect();

    try {
        const userId = 'c58b07e8-7d05-4d15-b196-e8cf0022209b';
        const newName = 'Kudzanai Shadreck Musarurwa';
        
        await client.query(
            `UPDATE public.profiles SET name = $1 WHERE id = $2`,
            [newName, userId]
        );
        console.log(`Updated profile name to: ${newName}`);
        
    } finally {
        await client.end();
    }
}

updateName();
