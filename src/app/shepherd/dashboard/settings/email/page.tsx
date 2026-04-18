'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AdminAuth } from '@/lib/admin-auth';
import { CheckCircle2, XCircle, ChevronDown, ChevronUp, Loader2, Save } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

const ADDRESS_FIELDS: { key: string; label: string }[] = [
  { key: 'noreply_address', label: 'No-Reply' },
  { key: 'pastor_address', label: 'Pastor' },
  { key: 'connect_address', label: 'Connect (Inquiries)' },
  { key: 'give_address', label: 'Giving' },
  { key: 'events_address', label: 'Events' },
  { key: 'ministry_address', label: 'Ministry' },
  { key: 'admin_address', label: 'Admin' },
  { key: 'support_address', label: 'Support' },
];

export default function EmailSettingsPage() {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDns, setShowDns] = useState(false);
  const [senderName, setSenderName] = useState('');
  const [pastorName, setPastorName] = useState('');
  const [customDomain, setCustomDomain] = useState('');

  useEffect(() => {
    (async () => {
      const session = await AdminAuth.getSession();
      if (!session?.org_id) return;

      const { data } = await supabase
        .from('church_email_config')
        .select('*')
        .eq('org_id', session.org_id)
        .single();

      if (data) {
        setConfig(data);
        setSenderName(data.sender_display_name ?? '');
        setPastorName(data.pastor_display_name ?? '');
        setCustomDomain(data.custom_domain ?? '');
      }
      setLoading(false);
    })();
  }, []);

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    const { error } = await supabase
      .from('church_email_config')
      .update({
        sender_display_name: senderName,
        pastor_display_name: pastorName,
        custom_domain: customDomain || null,
      })
      .eq('id', config.id);

    setSaving(false);
    if (error) toast.error('Save failed: ' + error.message);
    else { toast.success('Email settings saved'); setConfig((c: any) => ({ ...c, sender_display_name: senderName, pastor_display_name: pastorName, custom_domain: customDomain })); }
  };

  const handleVerifyDomain = async () => {
    if (!config || !customDomain) return;
    setSaving(true);
    const { error } = await supabase
      .from('church_email_config')
      .update({ custom_domain: customDomain, setup_status: 'dns_added' })
      .eq('id', config.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success('Custom domain saved. Brevo will verify DNS shortly.');
  };

  if (loading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-violet-400" /></div>;
  }

  if (!config) {
    return <p className="text-sm text-muted-foreground p-6">No email configuration found for your organization.</p>;
  }

  const dnsStatus = [
    { key: 'dns_dkim_verified', label: 'DKIM' },
    { key: 'dns_spf_verified', label: 'SPF' },
    { key: 'dns_mx_verified', label: 'MX (Inbound)' },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-black uppercase tracking-tight">Email Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure your church's branded email addresses</p>
      </div>

      {/* Your email addresses */}
      <Card className="border border-white/10 bg-white/5">
        <CardContent className="p-5 space-y-4">
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Your Email Addresses</p>
          <div className="space-y-2">
            {ADDRESS_FIELDS.map(({ key, label }) => (
              config[key] ? (
                <div key={key} className="flex items-center justify-between gap-4 py-2 border-b border-white/5 last:border-0">
                  <span className="text-xs font-bold text-muted-foreground w-28 shrink-0">{label}</span>
                  <span className="text-sm text-foreground font-mono truncate">{config[key]}</span>
                </div>
              ) : null
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Domain status */}
      <Card className="border border-white/10 bg-white/5">
        <CardContent className="p-5 space-y-4">
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Domain Status</p>
          <div className="space-y-3">
            {dnsStatus.map(({ key, label }) => {
              const verified = config[key] ?? false;
              return (
                <div key={key} className="flex items-center gap-3">
                  {verified
                    ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    : <XCircle className="w-4 h-4 text-red-400/60 shrink-0" />}
                  <span className="text-sm text-foreground">{label}</span>
                  <span className={`text-xs font-bold ml-auto ${verified ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                    {verified ? 'Verified' : 'Pending'}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* DNS setup guide (collapsible) */}
      <Card className="border border-white/10 bg-white/5 overflow-hidden">
        <button
          onClick={() => setShowDns(v => !v)}
          className="w-full flex items-center justify-between px-5 py-4 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
        >
          DNS Setup Guide
          {showDns ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {showDns && (
          <div className="px-5 pb-5 space-y-3 text-xs text-muted-foreground">
            <p className="text-foreground/80 leading-relaxed">Add these DNS records at your domain provider to enable authenticated sending:</p>
            {[
              { type: 'TXT', name: `jkc.churchos-ai.website`, value: 'v=spf1 include:spf.brevo.com ~all', desc: 'SPF — authorize Brevo to send on your behalf' },
              { type: 'TXT', name: `brevo._domainkey.jkc.churchos-ai.website`, value: '(provided by Brevo after adding your sender domain)', desc: 'DKIM — cryptographic signing' },
              { type: 'TXT', name: `_dmarc.jkc.churchos-ai.website`, value: 'v=DMARC1; p=quarantine; rua=mailto:dmarc@churchos-ai.website', desc: 'DMARC — policy enforcement' },
              { type: 'MX', name: `reply.jkc.churchos-ai.website`, value: 'inbound.brevo.com  (priority 10)', desc: 'Inbound reply routing' },
            ].map(record => (
              <div key={record.type + record.name} className="p-3 rounded-lg bg-white/3 border border-white/5 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black px-2 py-0.5 rounded bg-violet-500/20 text-violet-400">{record.type}</span>
                  <span className="font-mono text-xs text-foreground/70 break-all">{record.name}</span>
                </div>
                <p className="font-mono text-[10px] text-foreground/50 break-all">{record.value}</p>
                <p className="text-[10px] text-muted-foreground italic">{record.desc}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Editable fields */}
      <Card className="border border-white/10 bg-white/5">
        <CardContent className="p-5 space-y-5">
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Display Names</p>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">Sender Display Name</label>
              <input
                value={senderName}
                onChange={e => setSenderName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-foreground focus:outline-none focus:border-violet-500/50"
                placeholder="e.g. Japan Kingdom Church"
              />
              <p className="text-[10px] text-muted-foreground">Appears as the "from" name in all church emails</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground">Pastor Display Name</label>
              <input
                value={pastorName}
                onChange={e => setPastorName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-foreground focus:outline-none focus:border-violet-500/50"
                placeholder="e.g. Pastor Joseph"
              />
              <p className="text-[10px] text-muted-foreground">Used in pastoral messages and AI-drafted emails</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Custom domain */}
      <Card className="border border-white/10 bg-white/5">
        <CardContent className="p-5 space-y-4">
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Custom Domain (Optional)</p>
          <div className="flex gap-2">
            <input
              value={customDomain}
              onChange={e => setCustomDomain(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-foreground focus:outline-none focus:border-violet-500/50"
              placeholder="e.g. mail.yourchurch.org"
            />
            <button
              onClick={handleVerifyDomain}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl border border-white/10 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-foreground hover:border-white/20 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground">After adding DNS records, Brevo will verify the domain automatically.</p>
        </CardContent>
      </Card>

      {/* Send limits */}
      <Card className="border border-white/10 bg-white/5">
        <CardContent className="p-5 space-y-3">
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Send Limits</p>
          <div className="flex gap-8">
            <div>
              <p className="text-lg font-black text-foreground">{(config.daily_send_limit ?? 0).toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Daily limit</p>
            </div>
            <div>
              <p className="text-lg font-black text-foreground">{(config.monthly_send_limit ?? 0).toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Monthly limit</p>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground">To increase limits, contact Church OS support.</p>
        </CardContent>
      </Card>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 text-white text-xs font-black uppercase tracking-widest hover:bg-violet-700 transition-colors disabled:opacity-50"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Save Settings
      </button>
    </div>
  );
}
