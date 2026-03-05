"use client";

import { useState } from "react";
import { ShepherdView } from "@/components/dashboard/shepherd-view";
import { useAdminCtx } from "./layout";

export default function ShepherdDashboardPage() {
    const { userName } = useAdminCtx();
    const [dashLang, setDashLang] = useState<"EN" | "JP">("EN");

    return (
        <div className="p-6 xl:p-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-black text-white tracking-wide">Church Mission Control</h1>
                    <p className="text-[11px] text-white/30 mt-0.5">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} · JST
                    </p>
                </div>
                <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/10">
                    <button onClick={() => setDashLang('EN')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${dashLang === 'EN' ? 'bg-violet-600 text-white' : 'text-white/30 hover:text-white'}`}>EN</button>
                    <button onClick={() => setDashLang('JP')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${dashLang === 'JP' ? 'bg-violet-600 text-white' : 'text-white/30 hover:text-white'}`}>日本語</button>
                </div>
            </div>
            <ShepherdView lang={dashLang} />
        </div>
    );
}
