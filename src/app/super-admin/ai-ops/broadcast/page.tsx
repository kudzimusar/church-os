import { createClient } from "@supabase/supabase-js";
import BroadcastForm from "@/components/super-admin/BroadcastForm";
import { Suspense } from "react";
import Loading from "../../loading";
import { ArrowLeft, Megaphone } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function getBroadcastContext() {
  const { data: plans } = await supabaseAdmin
    .from("company_plans")
    .select("*")
    .order("price_monthly", { ascending: true });

  const { data: orgs } = await supabaseAdmin
    .from("organizations")
    .select("id, name")
    .eq("status", "active")
    .order("name", { ascending: true });

  return { 
    plans: plans || [], 
    orgs: orgs || [] 
  };
}

export default async function CreateBroadcastPage() {
  const context = await getBroadcastContext();

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
            <Link 
                href="/super-admin/ai-ops" 
                className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-400 transition-colors uppercase tracking-widest pl-1 group"
            >
                <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
                Back to AI Ops
            </Link>
            <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                System Broadcast
            </h1>
        </div>

        <Button asChild variant="ghost" className="text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-xl">
           <Link href="/super-admin/ai-ops/broadcast/history" className="flex items-center gap-2">
              <Megaphone className="w-4 h-4" />
              View Dispatch History
           </Link>
        </Button>
      </div>

      <Suspense fallback={<Loading />}>
        <BroadcastForm {...context} />
      </Suspense>
    </div>
  );
}
