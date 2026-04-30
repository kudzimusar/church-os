'use client'

import { useEffect, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Loader2, AlertTriangle, TrendingUp, Users, DollarSign, MessageSquare, ArrowUpRight } from "lucide-react"
import Link from "next/link"

interface OrgQuotaHealth {
  org_id: string
  org_name: string
  plan_name: string
  monthly_limit: number
  messages_used: number
  quota_pct_used: number
  cost_usd: number
  renews_at: string | null
}

const PLAN_COLOR: Record<string, string> = {
  starter:    'bg-slate-700 text-slate-300',
  lite:       'bg-yellow-500/20 text-yellow-300',
  pro:        'bg-blue-500/20 text-blue-300',
  enterprise: 'bg-violet-500/20 text-violet-300',
}

const TIER_MRR: Record<string, number> = {
  starter: 0, lite: 29, pro: 79, enterprise: 499,
}

export default function SuperAdminBillingPage() {
  const [orgs, setOrgs] = useState<OrgQuotaHealth[]>([])
  const [cgptUsers, setCgptUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'orgs' | 'individuals'>('individuals')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const load = async () => {
      try {
        // Individual ChurchGPT subscribers
        const { data: users, error: uErr } = await supabase
          .from('churchgpt_users')
          .select('*')
          .order('created_at', { ascending: false })
        if (uErr) throw uErr
        setCgptUsers(users ?? [])

        // Org-level quota health
        const { data: orgData, error: oErr } = await supabase
          .from('v_churchgpt_org_quota_health')
          .select('*')
          .order('quota_pct_used', { ascending: false })
        if (!oErr) setOrgs(orgData ?? [])
      } catch (err: any) {
        setError(err.message ?? 'Failed to load billing data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 text-red-400 bg-red-900/20 border border-red-800/30 rounded-xl p-4">
        <AlertTriangle className="w-5 h-5 shrink-0" />
        <p className="text-sm">{error}</p>
      </div>
    )
  }

  const indivMRR = cgptUsers
    .filter(u => u.subscription_status === 'active' || u.subscription_status === 'trialing')
    .reduce((s: number, u: any) => s + (TIER_MRR[u.subscription_tier] ?? 0), 0)

  const orgMRR = orgs
    .filter(o => o.plan_name && o.plan_name !== 'starter')
    .reduce((s, o) => s + (TIER_MRR[o.plan_name] ?? 0), 0)

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Subscriptions & Billing</h1>
        <p className="text-slate-400 text-sm mt-1">ChurchGPT revenue across all subscriber types</p>
      </div>

      {/* MRR summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Individual subscribers', value: cgptUsers.length, icon: <Users className="w-4 h-4" /> },
          { label: 'Org subscribers', value: orgs.length, icon: <Users className="w-4 h-4" /> },
          { label: 'Individual MRR (est.)', value: `$${indivMRR.toLocaleString()}`, icon: <DollarSign className="w-4 h-4" /> },
          { label: 'Org MRR (est.)', value: `$${orgMRR.toLocaleString()}`, icon: <TrendingUp className="w-4 h-4" /> },
        ].map(s => (
          <div key={s.label} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-3">{s.icon}{s.label}</div>
            <div className="text-2xl font-bold text-white">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 border-b border-slate-800">
        {(['individuals', 'orgs'] as const).map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize ${
              activeTab === t
                ? 'border-indigo-400 text-indigo-300'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            {t === 'individuals' ? `Individual Subscribers (${cgptUsers.length})` : `Church Orgs (${orgs.length})`}
          </button>
        ))}
      </div>

      {/* Individual ChurchGPT subscribers */}
      {activeTab === 'individuals' && (
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/50">
                {['User', 'Plan', 'Status', 'Usage', 'MRR', 'Joined'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {cgptUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500 text-sm">No individual subscribers yet.</td>
                </tr>
              ) : cgptUsers.map(u => {
                const quotaPct = u.quota_limit === -1 ? 0 : Math.min(100, (u.quota_used / u.quota_limit) * 100)
                const isActive = u.subscription_status === 'active' || u.subscription_status === 'trialing'
                return (
                  <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-200">{u.display_name ?? u.email.split('@')[0]}</div>
                      <div className="text-xs text-slate-500">{u.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${PLAN_COLOR[u.subscription_tier] ?? PLAN_COLOR.starter}`}>
                        {u.subscription_tier}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs ${isActive ? 'text-green-400' : 'text-slate-500'}`}>
                        {isActive ? '● ' : '○ '}{u.subscription_status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-slate-400 mb-1">
                        {u.quota_used} / {u.quota_limit === -1 ? '∞' : u.quota_limit}
                      </div>
                      <div className="h-1.5 bg-slate-700 rounded-full w-24 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${quotaPct > 85 ? 'bg-red-500' : 'bg-indigo-400'}`}
                          style={{ width: `${quotaPct}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-300 font-medium">
                      {isActive ? `$${TIER_MRR[u.subscription_tier] ?? 0}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Church org subscribers */}
      {activeTab === 'orgs' && (
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl overflow-hidden">
          {orgs.length === 0 ? (
            <div className="py-10 text-center text-slate-500 text-sm">No org-level ChurchGPT subscriptions yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/50">
                  {['Church', 'Plan', 'Usage', 'Cost (USD)', 'Renews', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {orgs.map(org => {
                  const pct = Math.min(org.quota_pct_used ?? 0, 100)
                  const isAtRisk = pct >= 80
                  return (
                    <tr key={org.org_id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-200">{org.org_name}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${PLAN_COLOR[org.plan_name] ?? PLAN_COLOR.starter}`}>
                          {org.plan_name ?? 'starter'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {isAtRisk && <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                          <div>
                            <div className="text-xs text-slate-400">{(org.messages_used ?? 0).toLocaleString()} / {(org.monthly_limit ?? 0).toLocaleString()}</div>
                            <div className="h-1.5 bg-slate-700 rounded-full w-20 overflow-hidden mt-1">
                              <div
                                className={`h-full rounded-full ${pct >= 100 ? 'bg-red-500' : isAtRisk ? 'bg-amber-400' : 'bg-indigo-400'}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-300">${(org.cost_usd ?? 0).toFixed(4)}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {org.renews_at ? new Date(org.renews_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/super-admin/tenants?highlight=${org.org_id}`}
                          className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300"
                        >
                          View <ArrowUpRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
