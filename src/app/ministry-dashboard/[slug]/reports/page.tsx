"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { MinistryAuth, MinistrySession } from '@/lib/ministry-auth';
import DynamicFormRenderer, { FormTemplate } from '@/components/forms/DynamicFormRenderer';
import Link from 'next/link';

export default function MinistryReportsPage() {
    const params = useParams();
    const slug = params.slug as string;
    
    const [session, setSession] = useState<MinistrySession | null>(null);
    const [templates, setTemplates] = useState<FormTemplate[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Require at least 'assistant' to submit reports
        MinistryAuth.requireAccess(slug, 'assistant').then(async sess => {
            setSession(sess);

            // Fetch available form templates for this ministry (and universal ones where ministry_id is null)
            const { data, error } = await supabase
                .from('form_templates')
                .select('*')
                .eq('is_active', true)
                .or(`ministry_id.is.null,ministry_id.eq.${sess.ministryId}`);
            
            if (data) {
                setTemplates(data as FormTemplate[]);
            } else {
                console.error("Failed to load templates", error);
            }
            
            setLoading(false);
        }).catch(err => {
            console.error(err);
        });
    }, [slug]);

    if (loading || !session) {
        return <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-white"><p>Loading...</p></div>;
    }

    return (
        <div className="min-h-screen bg-neutral-950 text-white p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                
                <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
                    <div>
                        <h1 className="text-2xl font-bold">{session.ministryName} Reports</h1>
                        <p className="text-neutral-400 text-sm">Submit operational reports and track metrics.</p>
                    </div>
                    <Link href={`/ministry-dashboard/${slug}`} className="text-sm font-medium hover:text-indigo-400 transition-colors">
                        ← Back to Ministry Hub
                    </Link>
                </div>

                {!selectedTemplate ? (
                    <div>
                        <h2 className="text-xl font-semibold mb-4">Select a Report Type</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {templates.map(tmpl => (
                                <button 
                                    key={tmpl.id} 
                                    onClick={() => setSelectedTemplate(tmpl)}
                                    className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl hover:border-indigo-500 transition-colors text-left group"
                                >
                                    <h3 className="font-semibold text-lg text-white group-hover:text-indigo-400">{tmpl.name}</h3>
                                    {tmpl.description && (
                                        <p className="text-neutral-400 text-sm mt-2">{tmpl.description}</p>
                                    )}
                                    <div className="mt-4 inline-flex text-xs bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded-md">
                                        Type: {tmpl.report_type}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <button 
                            onClick={() => setSelectedTemplate(null)}
                            className="bg-neutral-900 px-4 py-2 border border-neutral-800 rounded-lg text-sm hover:bg-neutral-800 transition-colors"
                        >
                            ← Select Different Tool
                        </button>
                        
                        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
                            <h2 className="text-xl font-bold text-white mb-6">New: {selectedTemplate.name}</h2>
                            <DynamicFormRenderer 
                                template={selectedTemplate} 
                                ministryId={session.ministryId}
                                onSuccess={() => {
                                    setSelectedTemplate(null);
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
