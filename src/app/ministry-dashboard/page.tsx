"use client";

import { useEffect, useState, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { basePath as BP } from '@/lib/utils';
import { Flame } from 'lucide-react';
import { withRoleGuard } from '@/components/auth/withRoleGuard';

import { MinistryHubGrid } from '@/components/dashboard/ministries/MinistryHubGrid';

function MinistryDashboardContent() {
  const router = useRouter();
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.replace("/login/");
        return;
      }
      setSessionUser(session.user);
      setLoading(false);
    };
    init();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#080c14] text-white">
        <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080c14] text-white p-6 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-violet-900/10 to-transparent pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-violet-600/5 blur-3xl pointer-events-none" />

      <div className="relative max-w-[1400px] mx-auto space-y-8 mt-10 z-10">
        <div className="flex items-center justify-between mb-12">
            <div>
              <div className="flex items-center gap-2 mb-2">
                 <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
                 <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-black">Member Intelligence Hub</p>
              </div>
              <h1 className="text-5xl font-black text-white tracking-tighter">My Ministries</h1>
            </div>
            <button 
                onClick={async () => {
                   await supabase.auth.signOut();
                   router.replace("/login/");
                 }}
                className="h-10 px-6 rounded-xl bg-white/5 border border-white/10 text-[10px] text-white/60 font-black hover:bg-white/10 transition-all uppercase tracking-widest"
            >
                Log Out System
            </button>
        </div>
        
        <MinistryHubGrid 
          userId={sessionUser?.id}
          onSelect={(m) => router.push(`/ministry-dashboard/${m.slug}/`)}
        />
      </div>
    </div>
  );
}

function MinistryDashboardIndex() {
  return (
    <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen bg-[#080c14]">
            <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
        </div>
    }>
      <MinistryDashboardContent />
    </Suspense>
  )
}

export default withRoleGuard(MinistryDashboardIndex, ['ministry_leader', 'ministry_lead', 'admin', 'shepherd', 'super_admin', 'owner', 'pastor', 'member']);
