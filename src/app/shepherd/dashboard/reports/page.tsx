"use client";
import { FileText, Download, BarChart2, Users, BookOpen, Heart } from "lucide-react";

const REPORTS = [
    { name: 'Congregational Health Report', desc: 'Devotion streaks, engagement scores, SOAP analytics', icon: Heart, color: 'text-violet-400', bg: 'bg-violet-500/10' },
    { name: 'Member Directory Export', desc: 'Full member list with status, city, and contact info (CSV)', icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { name: 'Attendance Summary', desc: 'Sunday service + events attendance for the last 6 months', icon: BarChart2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { name: 'Devotion Completion Report', desc: 'Daily completion rates, top performers, goal tracking', icon: BookOpen, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { name: 'Ministry Staffing Report', desc: 'Team sizes, roles, training status, gaps', icon: FileText, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { name: 'Prayer Request Summary', desc: 'All active/answered requests by category and urgency', icon: Heart, color: 'text-red-400', bg: 'bg-red-500/10' },
    { name: 'Financial Stewardship Report', desc: 'Anonymous giving summary by type and month', icon: BarChart2, color: 'text-green-400', bg: 'bg-green-500/10' },
    { name: 'Growth Intelligence Export', desc: 'Evangelism pipeline, conversions, household data', icon: BarChart2, color: 'text-pink-400', bg: 'bg-pink-500/10' },
];

export default function ReportsPage() {
    const handleExport = (name: string) => {
        // In production, this would generate a real CSV/PDF via an API route
        alert(`Generating: ${name}\n\nThis would produce a CSV/PDF export in the full production version.`);
    };

    return (
        <div className="p-6 xl:p-8">
            <div className="mb-6">
                <h1 className="text-xl font-black text-white">Reports & Data</h1>
                <p className="text-[11px] text-white/30 mt-0.5">Export reports for leadership meetings, board reviews, and data analysis</p>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 mb-6 flex items-start gap-3">
                <BarChart2 className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="text-xs font-black text-amber-300">Production Feature</p>
                    <p className="text-[10px] text-amber-300/60 mt-0.5">Export functionality generates real CSV/PDF via server-side API routes. Currently shows report previews — full export requires backend API deployment.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {REPORTS.map((report, i) => (
                    <div key={report.name} className="bg-[#111827] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-xl ${report.bg} flex items-center justify-center flex-shrink-0`}>
                            <report.icon className={`w-5 h-5 ${report.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-white">{report.name}</p>
                            <p className="text-[10px] text-white/35 mt-1 leading-relaxed">{report.desc}</p>
                        </div>
                        <button
                            onClick={() => handleExport(report.name)}
                            className="flex items-center gap-1 text-[9px] font-black text-violet-400 hover:text-violet-300 transition-colors flex-shrink-0 mt-1"
                        >
                            <Download className="w-3 h-3" /> Export
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
