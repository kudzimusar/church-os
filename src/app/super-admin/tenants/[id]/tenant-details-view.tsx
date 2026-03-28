"use client";

import { useEffect, useState } from "react";
import { useParams, notFound } from "next/navigation";
import TenantDetailsClient from "./tenant-details-client";
import { supabase } from "@/lib/supabase";
import Loading from "@/app/super-admin/loading";

export default function TenantDetailsView() {
  const params = useParams();
  const id = params?.id as string;
  const [data, setData] = useState<{ org: any, memberCount: number, auditLogs: any[], plans: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!id) return;

    async function fetchTenantDetails() {
      try {
        // Fetch organization details
        const { data: org, error: orgError } = await supabase
          .from('organizations')
          .select(`
            *,
            organization_subscriptions (
              *,
              company_plans (*)
            ),
            organization_features (*),
            admin_ai_insights (*)
          `)
          .is('admin_ai_insights.resolved_at', null)
          .eq('id', id)
          .single();

        if (orgError || !org) {
          setError(true);
          return;
        }

        // Fetch member count
        const { count } = await supabase
          .from('org_members')
          .select('*', { count: 'exact', head: true })
          .eq('org_id', id);

        const memberCount = count || 0;

        // Fetch recent audit logs for this tenant
        const { data: auditLogs } = await supabase
          .from('admin_audit_logs')
          .select(`
            *,
            profiles:admin_id (name, email)
          `)
          .eq('target_id', id)
          .order('created_at', { ascending: false })
          .limit(10);

        // Fetch all plans for the override modal
        const { data: plans } = await supabase
          .from('company_plans')
          .select('*')
          .eq('is_active', true);

        setData({
          org,
          memberCount,
          auditLogs: auditLogs || [],
          plans: plans || []
        });
      } catch (err) {
        console.error("Error fetching tenant details:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    fetchTenantDetails();
  }, [id]);

  if (loading) return <Loading />;
  if (error || !data) return notFound();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <TenantDetailsClient 
        org={data.org} 
        memberCount={data.memberCount} 
        auditLogs={data.auditLogs}
        plans={data.plans}
      />
    </div>
  );
}
