"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles, LayoutDashboard, BarChart3, Settings2, ArrowRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { basePath as BP } from '@/lib/utils';

interface Action {
    label: string;
    description: string;
    href: string;
    Icon: LucideIcon;
}

export default function OnboardingSuccessPage() {
    const [churchName, setChurchName] = useState('');

    useEffect(() => {
        const query = new URLSearchParams(window.location.search);
        const name = query.get('church');
        if (name) setChurchName(decodeURIComponent(name));
    }, []);

    const actions: Action[] = [
        {
            label: 'Open Mission Control',
            description: 'Manage your congregation and view reports',
            href: `${BP}/shepherd/dashboard`,
            Icon: LayoutDashboard,
        },
        {
            label: "View Pastor's HQ",
            description: 'Strategic intelligence and financial overview',
            href: `${BP}/pastor-hq`,
            Icon: BarChart3,
        },
        {
            label: 'Configure Settings',
            description: 'Customize your brand and preferences',
            href: `${BP}/settings`,
            Icon: Settings2,
        },
    ];

    return (
        <div className="onboarding-theme bg-[#0c0e12] min-h-screen text-[#f6f6fc] flex flex-col items-center justify-center px-6">
            <div className="fixed top-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#72eff5]/5 rounded-full blur-[120px] -z-10 animate-pulse" />
            <div className="fixed bottom-[-5%] left-[-5%] w-[400px] h-[400px] bg-[#c37fff]/5 rounded-full blur-[100px] -z-10" />

            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="w-full max-w-lg flex flex-col items-center text-center space-y-10"
            >
                {/* Animated checkmark */}
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5, type: 'spring', stiffness: 200 }}
                    className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center"
                >
                    <Check size={36} className="text-emerald-400" strokeWidth={2.5} />
                </motion.div>

                {/* Heading */}
                <div className="space-y-3">
                    <h1 className="font-headline text-4xl md:text-5xl font-extrabold tracking-tight text-[#f6f6fc] leading-tight">
                        Your Sanctuary is <span className="text-[#72eff5]">Ready.</span>
                    </h1>
                    {churchName && (
                        <p className="text-[#72eff5] text-lg font-bold">{churchName}</p>
                    )}
                    <p className="text-[#aaabb0] text-sm flex items-center justify-center gap-2">
                        <Sparkles size={14} className="text-[#c37fff]" />
                        Your AI is already generating your first insights.
                    </p>
                </div>

                {/* Action cards */}
                <div className="w-full grid grid-cols-1 gap-3">
                    {actions.map(({ label, description, href, Icon }) => (
                        <a
                            key={label}
                            href={href}
                            className="flex items-center gap-4 p-5 rounded-2xl bg-[#171a1f] border border-[#46484d]/30 hover:border-[#72eff5]/40 hover:bg-[#72eff5]/5 transition-all group text-left"
                        >
                            <div className="w-10 h-10 rounded-xl bg-[#23262c] border border-[#46484d]/30 flex items-center justify-center flex-shrink-0 group-hover:border-[#72eff5]/30 transition-colors">
                                <Icon size={18} className="text-[#aaabb0] group-hover:text-[#72eff5] transition-colors" />
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-[#f6f6fc] group-hover:text-[#72eff5] transition-colors text-sm">
                                    {label}
                                </p>
                                <p className="text-xs text-[#aaabb0] mt-0.5">{description}</p>
                            </div>
                            <ArrowRight size={16} className="text-[#aaabb0] group-hover:text-[#72eff5] group-hover:translate-x-1 transition-all flex-shrink-0" />
                        </a>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}
