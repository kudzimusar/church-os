"use client";

import { SuperAdminGuard } from "@/components/auth/super-admin-guard";
import { Sidebar } from "@/components/layout/super-admin-sidebar";
import { UserNav } from "@/components/layout/user-nav";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SuperAdminGuard>
      <TooltipProvider>
        <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-50">
        {/* Glassmorphic Background Elements */}
        <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/10 blur-[120px]" />
        </div>

        {/* Sidebar */}
        <Sidebar className="w-64 flex-shrink-0" />

        {/* Main Content Area */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative">
          {/* Top Header */}
          <header className="h-16 flex items-center justify-between px-8 border-b border-slate-800/50 bg-slate-950/50 backdrop-blur-xl sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <h2 className="text-sm font-medium text-slate-400">Church OS / Super Admin</h2>
            </div>
            <div className="flex items-center gap-4">
              <UserNav />
            </div>
          </header>

          {/* Scrollable Content */}
          <main className="flex-1 overflow-y-auto overflow-x-hidden p-8 custom-scrollbar">
            <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
              {children}
            </div>
          </main>
        </div>
        <Toaster position="top-right" />
      </div>
      </TooltipProvider>
    </SuperAdminGuard>
  );
}
