'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Server, Lock, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { connectImapAccount, type ImapConnectionData } from '@/app/actions/email-account-actions';

interface ImapSetupModalProps {
  isOpen: boolean;
  orgId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const PRESETS: Record<string, Partial<ImapConnectionData>> = {
  icloud: {
    imap_host: 'imap.mail.me.com', imap_port: 993, imap_use_ssl: true,
    smtp_host: 'smtp.mail.me.com', smtp_port: 587, smtp_use_tls: true,
  },
  yahoo: {
    imap_host: 'imap.mail.yahoo.com', imap_port: 993, imap_use_ssl: true,
    smtp_host: 'smtp.mail.yahoo.com', smtp_port: 587, smtp_use_tls: true,
  },
  fastmail: {
    imap_host: 'imap.fastmail.com', imap_port: 993, imap_use_ssl: true,
    smtp_host: 'smtp.fastmail.com', smtp_port: 587, smtp_use_tls: true,
  },
  custom: {},
};

const PRESET_LABELS: Record<string, string> = {
  icloud: 'Apple iCloud',
  yahoo: 'Yahoo Mail',
  fastmail: 'Fastmail',
  custom: 'Custom Server',
};

export function ImapSetupModal({ isOpen, orgId, onClose, onSuccess }: ImapSetupModalProps) {
  const [preset, setPreset] = useState('custom');
  const [form, setForm] = useState<Omit<ImapConnectionData, 'org_id'>>({
    email_address: '',
    display_name: '',
    imap_host: '',
    imap_port: 993,
    imap_username: '',
    imap_password: '',
    imap_use_ssl: true,
    smtp_host: '',
    smtp_port: 587,
    smtp_username: '',
    smtp_password: '',
    smtp_use_tls: true,
  });
  const [saving, setSaving] = useState(false);

  const applyPreset = (key: string) => {
    setPreset(key);
    const p = PRESETS[key];
    setForm(f => ({ ...f, ...p }));
  };

  const set = (key: keyof typeof form, value: any) => setForm(f => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const result = await connectImapAccount({ ...form, org_id: orgId });
      if (result.success) {
        toast.success('IMAP account connected successfully');
        onSuccess();
        onClose();
      } else {
        toast.error(result.error ?? 'Failed to connect account');
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.97 }}
            className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
              <div>
                <h2 className="text-sm font-black text-foreground uppercase tracking-widest">Add IMAP Account</h2>
                <p className="text-[10px] text-muted-foreground mt-0.5">Connect any email account using IMAP</p>
              </div>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors"><X className="w-4 h-4" /></button>
            </div>

            <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 space-y-5">
              {/* Preset selector */}
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 block">Provider Preset</label>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(PRESET_LABELS).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => applyPreset(key)}
                      className={`px-2 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                        preset === key ? 'bg-violet-600 text-white' : 'bg-white/5 text-muted-foreground hover:bg-white/10'
                      }`}
                    >{label}</button>
                  ))}
                </div>
              </div>

              {/* Account info */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">Account</label>
                <input
                  required
                  type="email"
                  placeholder="Email Address"
                  value={form.email_address}
                  onChange={e => { set('email_address', e.target.value); set('imap_username', e.target.value); set('smtp_username', e.target.value); }}
                  className="w-full h-10 bg-white/5 border border-border rounded-xl px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-violet-500/50"
                />
                <input
                  placeholder="Display Name (optional)"
                  value={form.display_name}
                  onChange={e => set('display_name', e.target.value)}
                  className="w-full h-10 bg-white/5 border border-border rounded-xl px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-violet-500/50"
                />
              </div>

              {/* IMAP */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                  <Server className="w-3 h-3" /> IMAP (Incoming)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    required
                    placeholder="imap.example.com"
                    value={form.imap_host}
                    onChange={e => set('imap_host', e.target.value)}
                    className="col-span-2 h-10 bg-white/5 border border-border rounded-xl px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-violet-500/50"
                  />
                  <input
                    required
                    type="number"
                    placeholder="993"
                    value={form.imap_port}
                    onChange={e => set('imap_port', parseInt(e.target.value))}
                    className="h-10 bg-white/5 border border-border rounded-xl px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-violet-500/50"
                  />
                </div>
                <input
                  required
                  placeholder="IMAP Username"
                  value={form.imap_username}
                  onChange={e => set('imap_username', e.target.value)}
                  className="w-full h-10 bg-white/5 border border-border rounded-xl px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-violet-500/50"
                />
                <input
                  required
                  type="password"
                  placeholder="IMAP Password / App Password"
                  value={form.imap_password}
                  onChange={e => set('imap_password', e.target.value)}
                  className="w-full h-10 bg-white/5 border border-border rounded-xl px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-violet-500/50"
                />
                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                  <input type="checkbox" checked={form.imap_use_ssl} onChange={e => set('imap_use_ssl', e.target.checked)} className="rounded" />
                  Use SSL/TLS
                </label>
              </div>

              {/* SMTP */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                  <Lock className="w-3 h-3" /> SMTP (Outgoing)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    required
                    placeholder="smtp.example.com"
                    value={form.smtp_host}
                    onChange={e => set('smtp_host', e.target.value)}
                    className="col-span-2 h-10 bg-white/5 border border-border rounded-xl px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-violet-500/50"
                  />
                  <input
                    required
                    type="number"
                    placeholder="587"
                    value={form.smtp_port}
                    onChange={e => set('smtp_port', parseInt(e.target.value))}
                    className="h-10 bg-white/5 border border-border rounded-xl px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-violet-500/50"
                  />
                </div>
                <input
                  required
                  placeholder="SMTP Username"
                  value={form.smtp_username}
                  onChange={e => set('smtp_username', e.target.value)}
                  className="w-full h-10 bg-white/5 border border-border rounded-xl px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-violet-500/50"
                />
                <input
                  required
                  type="password"
                  placeholder="SMTP Password / App Password"
                  value={form.smtp_password}
                  onChange={e => set('smtp_password', e.target.value)}
                  className="w-full h-10 bg-white/5 border border-border rounded-xl px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-violet-500/50"
                />
                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                  <input type="checkbox" checked={form.smtp_use_tls} onChange={e => set('smtp_use_tls', e.target.checked)} className="rounded" />
                  Use STARTTLS
                </label>
              </div>

              <p className="text-[10px] text-muted-foreground bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                Use an <strong>App Password</strong> for Gmail/Yahoo/iCloud — not your main password. Enable 2FA first then generate an app-specific password in your account security settings.
              </p>
            </form>

            <div className="px-6 py-4 border-t border-border shrink-0 flex gap-3">
              <button onClick={onClose} className="flex-1 h-10 rounded-xl border border-border text-sm font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSubmit as any}
                disabled={saving}
                className="flex-1 h-10 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Connecting...</> : 'Connect Account'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
