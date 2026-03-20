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
    let changed = false;

    // 1. Resolve 'use client' position
    const clientDirectiveRegex = /^['"]use client['"];?\n?/m;
    const hasClientDirective = clientDirectiveRegex.test(content);
    
    if (hasClientDirective) {
        // Find where it is and remove it
        const match = content.match(clientDirectiveRegex);
        const directiveStr = match[0].trim() + '\n';
        content = content.replace(clientDirectiveRegex, '');
        
        // Remove any other occurrences (just in case)
        content = content.replace(/['"]use client['"];?\n?/g, '');
        
        // Prepend to top
        content = `"use client";\n` + content.trimStart();
        changed = true;
    }

    // 2. Remove duplicate supabase imports
    const supabaseImportLine = 'import { supabase } from "@/lib/supabase";';
    const supabaseImportLineAlt = "import { supabase } from '@/lib/supabase';";
    
    let lines = content.split('\n');
    let seenSupabase = false;
    let newLines = [];
    
    for (let line of lines) {
        const trimmed = line.trim();
        if (trimmed === supabaseImportLine || trimmed === supabaseImportLineAlt || 
            trimmed === 'import { supabase } from "@/lib/supabase"' || 
            trimmed === "import { supabase } from '@/lib/supabase'") {
            if (seenSupabase) {
                // Skip duplicate
                continue;
            }
            seenSupabase = true;
            newLines.push(supabaseImportLine); // Standardize
        } else {
            newLines.push(line);
        }
    }

    if (seenSupabase || hasClientDirective) {
        const newContent = newLines.join('\n');
        if (newContent !== content || changed) {
            fs.writeFileSync(file, newContent);
            console.log(`Cleaned: ${file}`);
        }
    }
});
