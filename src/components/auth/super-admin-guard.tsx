"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export function SuperAdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    async function checkSuperAdmin() {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          router.push("/login");
          return;
        }

        const { data: role, error: roleError } = await supabase
          .from("admin_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "super_admin")
          .single();

        if (roleError || !role) {
          console.error("Access denied: Not a super admin");
          router.push("/");
          return;
        }

        setIsSuperAdmin(true);
      } catch (err) {
        console.error("SuperAdminGuard Error:", err);
        router.push("/");
      } finally {
        setLoading(false);
      }
    }

    checkSuperAdmin();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background/50 backdrop-blur-sm">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isSuperAdmin) return null;

  return <>{children}</>;
}
