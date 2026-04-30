'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

const TIER_COLORS: Record<string, string> = {
  starter:    '#6b7280',
  lite:       '#D4AF37',
  pro:        '#3b82f6',
  enterprise: '#8b5cf6',
}

const TIER_MRR: Record<string, number> = {
  starter: 0, lite: 29, pro: 79, enterprise: 499,
}

type CGPTUser = {
  id: string
  user_id: string
  email: string
  display_name: string | null
  subscription_tier: string
  subscription_status: string
  quota_used: number
  quota_limit: number
  stripe_subscription_id: string | null
  period_ends_at: string | null
  created_at: string
  source: string
}

export default function CorporateDashboard() {
  const router = useRouter()
  const [users, setUsers] = useState<CGPTUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tierFilter, setTierFilter] = useState('all')

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/corporate/login'); return }

      // Only super admins can access this dashboard
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!profile || !['super_admin', 'admin'].includes(profile.role ?? '')) {
        router.push('/corporate/login')
        return
      }

      const { data } = await supabase
        .from('churchgpt_users')
        .select('*')
        .order('created_at', { ascending: false })

      setUsers(data ?? [])
      setLoading(false)
    }
    init()
  }, [])

  const filtered = users.filter(u => {
    const matchTier = tierFilter === 'all' || u.subscription_tier === tierFilter
    const matchSearch = !search
      || u.email.toLowerCase().includes(search.toLowerCase())
      || (u.display_name ?? '').toLowerCase().includes(search.toLowerCase())
    return matchTier && matchSearch
  })

  const totalMRR = users.reduce((sum, u) =>
    u.subscription_status === 'active' || u.subscription_status === 'trialing'
      ? sum + (TIER_MRR[u.subscription_tier] ?? 0)
      : sum
  , 0)

  const tierCount = (tier: string) => users.filter(u => u.subscription_tier === tier).length

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0a0f1e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#D4AF37', fontFamily: 'serif', fontSize: 18 }}>Loading…</div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0f1e', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '16px 32px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ fontFamily: 'Georgia, serif', fontSize: 20, color: '#D4AF37', fontWeight: 700 }}>Church OS</span>
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>Corporate</span>
        <span style={{ color: 'rgba(255,255,255,0.15)' }}>›</span>
        <span style={{ color: '#e2e8f0', fontSize: 13 }}>ChurchGPT Clients</span>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 32 }}>
          {[
            { label: 'Total subscribers', value: users.length, color: '#e2e8f0' },
            { label: 'MRR (est.)', value: `$${totalMRR.toLocaleString()}`, color: '#D4AF37' },
            { label: 'Starter (free)', value: tierCount('starter'), color: TIER_COLORS.starter },
            { label: 'Lite ($29)', value: tierCount('lite'), color: TIER_COLORS.lite },
            { label: 'Pro ($79)', value: tierCount('pro'), color: TIER_COLORS.pro },
            { label: 'Enterprise', value: tierCount('enterprise'), color: TIER_COLORS.enterprise },
          ].map(s => (
            <div key={s.label} style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12, padding: '16px 20px',
            }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: 26, fontWeight: 700, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <input
            placeholder="Search by email or name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 8, padding: '8px 14px', color: '#e2e8f0', fontSize: 13, width: 260,
              outline: 'none',
            }}
          />
          {['all', 'starter', 'lite', 'pro', 'enterprise'].map(t => (
            <button
              key={t}
              onClick={() => setTierFilter(t)}
              style={{
                padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                border: `1px solid ${tierFilter === t ? (TIER_COLORS[t] ?? '#D4AF37') : 'rgba(255,255,255,0.12)'}`,
                background: tierFilter === t ? `${TIER_COLORS[t] ?? '#D4AF37'}22` : 'transparent',
                color: tierFilter === t ? (TIER_COLORS[t] ?? '#D4AF37') : 'rgba(255,255,255,0.5)',
                cursor: 'pointer', textTransform: 'capitalize',
              }}
            >
              {t === 'all' ? 'All tiers' : t}
            </button>
          ))}
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'rgba(255,255,255,0.3)', alignSelf: 'center' }}>
            {filtered.length} of {users.length} shown
          </span>
        </div>

        {/* Table */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                {['User', 'Plan', 'Status', 'Usage', 'MRR', 'Joined', 'Stripe'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px 16px', textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>
                    No ChurchGPT subscribers yet.
                  </td>
                </tr>
              ) : filtered.map(u => {
                const quotaDisplay = u.quota_limit === -1
                  ? `${u.quota_used} / ∞`
                  : `${u.quota_used} / ${u.quota_limit}`
                const quotaPct = u.quota_limit === -1 ? 0 : Math.min(100, (u.quota_used / u.quota_limit) * 100)
                const tierColor = TIER_COLORS[u.subscription_tier] ?? '#6b7280'
                const isActive = u.subscription_status === 'active' || u.subscription_status === 'trialing'

                return (
                  <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    {/* User */}
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>
                        {u.display_name ?? u.email.split('@')[0]}
                      </div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{u.email}</div>
                    </td>

                    {/* Plan */}
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        display: 'inline-block', padding: '3px 10px', borderRadius: 20,
                        fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em',
                        background: `${tierColor}22`, color: tierColor,
                        border: `1px solid ${tierColor}44`,
                      }}>
                        {u.subscription_tier}
                      </span>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: 12, color: isActive ? '#4ade80' : 'rgba(255,255,255,0.3)' }}>
                        {isActive ? '● ' : '○ '}{u.subscription_status}
                      </span>
                    </td>

                    {/* Usage */}
                    <td style={{ padding: '12px 16px', minWidth: 120 }}>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>{quotaDisplay}</div>
                      <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${quotaPct}%`, background: quotaPct > 85 ? '#f87171' : tierColor, borderRadius: 2 }} />
                      </div>
                    </td>

                    {/* MRR */}
                    <td style={{ padding: '12px 16px', fontSize: 13, color: isActive ? '#D4AF37' : 'rgba(255,255,255,0.2)' }}>
                      {isActive ? `$${TIER_MRR[u.subscription_tier] ?? 0}` : '—'}
                    </td>

                    {/* Joined */}
                    <td style={{ padding: '12px 16px', fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                      {new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>

                    {/* Stripe */}
                    <td style={{ padding: '12px 16px' }}>
                      {u.stripe_subscription_id ? (
                        <span style={{ fontSize: 10, fontFamily: 'monospace', color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: 4 }}>
                          {u.stripe_subscription_id.slice(0, 14)}…
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 20 }}>
          Church OS Corporate · ChurchGPT Client Registry · {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
