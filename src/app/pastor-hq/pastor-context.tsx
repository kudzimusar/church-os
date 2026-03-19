"use client";

import { createContext, useContext } from "react";
import { AdminRole } from "@/lib/admin-auth";

export interface PastorCtx {
    role: AdminRole;
    userName: string;
    userId: string;
    orgId: string;
    refreshDashboard: () => void;
}

export const PastorContext = createContext<PastorCtx>({
    role: 'super_admin', userName: 'Pastor', userId: '', orgId: '',
    refreshDashboard: () => { }
});

export const usePastorCtx = () => useContext(PastorContext);
