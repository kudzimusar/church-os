import * as fs from 'fs';
import * as path from 'path';

const directories = [
    'src/app/shepherd/dashboard',
    'src/components/dashboard',
    'src/app/(public)/profile'
];

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = directories.flatMap(walk);

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;

    // Replace import
    if (content.includes('supabaseAdmin')) {
        // Handle import replacement
        const importAdminRegex = /import\s+\{\s*supabaseAdmin\s*\}\s+from\s+["']@\/lib\/supabase-admin["'];?/g;
        if (importAdminRegex.test(content)) {
            content = content.replace(importAdminRegex, '');
            // Ensure supabase is imported
            if (!content.includes('import { supabase } from "@/lib/supabase"')) {
                content = 'import { supabase } from "@/lib/supabase";\n' + content;
            }
            modified = true;
        }

        // Alternative import matches
        content = content.replace(/import\s+\{\s*supabaseAdmin\s*\}\s+from\s+["']@\/lib\/supabase-admin["']/g, '');
        content = content.replace(/import\s+supabaseAdmin\s+from\s+["']@\/lib\/supabase-admin["']/g, '');

        // Replace variable usage
        const usageRegex = /\bsupabaseAdmin\b/g;
        if (usageRegex.test(content)) {
            content = content.replace(usageRegex, 'supabase');
            modified = true;
        }

        if (modified) {
            fs.writeFileSync(file, content);
            console.log(`Fixed: ${file}`);
        }
    }
});
