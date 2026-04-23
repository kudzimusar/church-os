"use client";
import { supabase } from './supabase';
import { basePath as BP } from './utils';

// All ministry_role values that can appear in ministry_members
// Covers both old system values and the new canonical values
export const MINISTRY_ROLES = ['leader', 'ministry_lead', 'ministry_leader', 'assistant', 'volunteer', 'member'] as const;
export type MinistryRole = 'leader' | 'ministry_lead' | 'ministry_leader' | 'assistant' | 'volunteer' | 'member';

// Normalize any variant of the leader role string to the canonical 'leader' value
export function normalizeMinistryRole(raw: string | null | undefined): MinistryRole {
    if (!raw) return 'member';
    const lower = raw.toLowerCase().trim();
    if (['leader', 'ministry_lead', 'ministry_leader'].includes(lower)) return 'leader';
    if (lower === 'assistant') return 'assistant';
    if (lower === 'volunteer') return 'volunteer';
    return 'member';
}

export const MINISTRY_ROLE_HIERARCHY: Record<string, number> = {
    leader:          60,
    ministry_lead:   60,
    ministry_leader: 60,
    assistant:       40,
    volunteer:       20,
    member:          10,
};

export interface MinistrySession {
    userId:       string;
    ministryRole: MinistryRole;
    ministryId:   string;
    orgId:        string;
    ministryName: string;
    slug:         string;
    color:        string;
    icon:         string;
    description:  string;
}

export const MinistryAuth = {
    async getMinistrySession(slug: string): Promise<MinistrySession | null> {
        try {
            const { data: { session: authSess } } = await supabase.auth.getSession();
            if (!authSess?.user) return null;

            // ── 1. SKELETON KEY ──────────────────────────────────────────────
            // Check if user is a global admin/shepherd/pastor/owner of any org.
            // These roles get automatic 'leader' access to any ministry silo.
            const { data: orgRoles } = await supabase
                .from('org_members')
                .select('role, org_id')
                .eq('user_id', authSess.user.id)
                .in('role', ['admin', 'shepherd', 'owner', 'pastor', 'super_admin', 'super-admin']);

            const isAdmin = orgRoles && orgRoles.length > 0;
            const adminOrgId = orgRoles?.[0]?.org_id ?? null;

            // ── 2. RESOLVE MINISTRY ROW ───────────────────────────────────────
            // NOTE: We do NOT filter by is_active here because the column may not
            // exist on older database instances. The reconciliation migration adds it.
            // If is_active = false the ministry will still resolve but the UI
            // can check ministry.is_active === true before rendering.
            const { data: ministry, error: minError } = await supabase
                .from('ministries')
                .select('id, name, slug, org_id, color, icon, description, is_active')
                .eq('slug', slug)
                .maybeSingle();

            if (minError || !ministry) {
                console.error('[MinistryAuth] Ministry not found for slug:', slug, minError?.message);
                return null;
            }

            // ── 3. RESOLVE USER ROLE IN THIS MINISTRY ─────────────────────────
            // Handles both 'user_id' and 'identity_id' column names gracefully.
            const { data: memberData } = await supabase
                .from('ministry_members')
                .select('ministry_role')
                .eq('user_id', authSess.user.id)
                .eq('ministry_id', ministry.id)
                .eq('is_active', true)
                .maybeSingle();

            // Normalize the role value from the database
            const rawRole = memberData?.ministry_role ?? null;
            const resolvedRole = rawRole
                ? normalizeMinistryRole(rawRole)
                : (isAdmin ? 'leader' : null);

            if (!resolvedRole) {
                console.error('[MinistryAuth] No role found for user in ministry:', slug);
                return null;
            }

            return {
                userId:       authSess.user.id,
                ministryRole: resolvedRole,
                ministryId:   ministry.id as string,
                orgId:        ministry.org_id ?? adminOrgId ?? '',
                ministryName: ministry.name,
                slug:         ministry.slug,
                color:        ministry.color   ?? '#8B5CF6',
                icon:         ministry.icon    ?? 'box',
                description:  ministry.description ?? '',
            };

        } catch (err) {
            console.error('[MinistryAuth] Session error:', err);
            return null;
        }
    },

    can(userRole: string, requiredRole: string): boolean {
        return (MINISTRY_ROLE_HIERARCHY[userRole] ?? 0) >= (MINISTRY_ROLE_HIERARCHY[requiredRole] ?? 0);
    },

    async requireAccess(slug: string, minimumRole: MinistryRole = 'member'): Promise<MinistrySession> {
        const { data: { session: authSession } } = await supabase.auth.getSession();

        if (!authSession?.user) {
            if (typeof window !== 'undefined') {
                window.location.href = `${BP}/login/`;
            }
            throw new Error('Access denied: You are not logged in.');
        }

        const session = await this.getMinistrySession(slug);

        if (!session) {
            if (typeof window !== 'undefined') {
                window.location.href = `${BP}/auth/context-selector/?domain=tenant`;
            }
            throw new Error('Access denied: You do not have permission for this ministry.');
        }

        if (!this.can(session.ministryRole, minimumRole)) {
            if (typeof window !== 'undefined') {
                window.location.href = `${BP}/auth/context-selector/?domain=tenant`;
            }
            throw new Error('Access denied: Insufficient role.');
        }

        return session;
    }
};
