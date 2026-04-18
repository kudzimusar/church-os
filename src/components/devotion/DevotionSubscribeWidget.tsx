'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { resolvePublicOrgId } from '@/lib/org-resolver';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, CheckCircle2, Loader2 } from 'lucide-react';

interface DevotionSubscribeWidgetProps {
  orgId?: string;
  source?: string;
  theme?: 'light' | 'dark';
}

export function DevotionSubscribeWidget({ orgId: orgIdProp, source = 'website', theme = 'dark' }: DevotionSubscribeWidgetProps) {
  const [orgId, setOrgId] = useState<string | null>(orgIdProp ?? null);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [lang, setLang] = useState<'en' | 'ja'>('en');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'already' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!orgIdProp) {
      resolvePublicOrgId().then(id => setOrgId(id));
    }
  }, [orgIdProp]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !orgId) return;

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMsg(lang === 'ja' ? '有効なメールアドレスを入力してください' : 'Please enter a valid email address');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setErrorMsg('');

    try {
      // Check if already subscribed
      const { data: existing } = await supabase
        .from('devotion_subscribers')
        .select('id, is_active')
        .eq('org_id', orgId)
        .eq('email', email.toLowerCase().trim())
        .single();

      if (existing) {
        if (existing.is_active) {
          setStatus('already');
          return;
        }
        // Reactivate
        await supabase
          .from('devotion_subscribers')
          .update({ is_active: true, preferred_language: lang, name: name.trim() || null })
          .eq('id', existing.id);
        setStatus('success');
        return;
      }

      // New subscriber
      const { error } = await supabase.from('devotion_subscribers').insert({
        org_id: orgId,
        email: email.toLowerCase().trim(),
        name: name.trim() || null,
        preferred_language: lang,
        source,
        is_active: true,
      });

      if (error) throw error;
      setStatus('success');
    } catch (err: any) {
      setErrorMsg(err.message ?? 'Something went wrong');
      setStatus('error');
    }
  };

  const isDark = theme === 'dark';
  const bg = isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200';
  const inputBg = isDark ? 'bg-white/5 border-white/10 text-white placeholder:text-white/30' : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400';
  const text = isDark ? 'text-white' : 'text-gray-900';
  const muted = isDark ? 'text-white/60' : 'text-gray-500';

  return (
    <div className={`rounded-2xl border p-6 ${bg}`}>
      <AnimatePresence mode="wait">
        {status === 'success' ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-3 py-4 text-center"
          >
            <div className="w-12 h-12 rounded-full bg-emerald-500/15 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            </div>
            <p className={`text-sm font-black ${text}`}>
              {lang === 'ja' ? '登録完了！' : "You're subscribed!"}
            </p>
            <p className={`text-xs ${muted} leading-relaxed`}>
              {lang === 'ja'
                ? '明日の朝6時（東京時間）にデボーションをお届けします。メールをご確認ください。'
                : "You'll receive tomorrow's devotion at 6am Tokyo time. Check your email to confirm."}
            </p>
          </motion.div>
        ) : status === 'already' ? (
          <motion.div key="already" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-4">
            <p className={`text-sm font-bold ${text}`}>
              {lang === 'ja' ? 'すでに登録されています！' : "You're already subscribed!"}
            </p>
          </motion.div>
        ) : (
          <motion.form key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Mail className="w-4 h-4 text-amber-400" />
              <p className={`text-xs font-black uppercase tracking-widest ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                {lang === 'ja' ? '毎日のデボーション' : 'Daily Devotion'}
              </p>
            </div>
            <p className={`text-sm leading-relaxed ${muted}`}>
              {lang === 'ja'
                ? '毎朝6時（東京時間）にデボーションをメールでお届けします。'
                : 'Receive the daily devotion in your inbox every morning at 6am Tokyo time.'}
            </p>

            {/* Language toggle */}
            <div className="flex gap-1 p-0.5 rounded-lg bg-white/5 w-fit">
              {(['en', 'ja'] as const).map(l => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLang(l)}
                  className={`px-3 py-1 rounded-md text-xs font-black transition-all ${lang === l ? 'bg-amber-500 text-black' : `${muted} hover:text-foreground`}`}
                >
                  {l === 'en' ? 'English' : '日本語'}
                </button>
              ))}
            </div>

            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={lang === 'ja' ? 'お名前（任意）' : 'Name (optional)'}
              className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none transition-colors ${inputBg}`}
            />
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder={lang === 'ja' ? 'メールアドレス*' : 'Email address *'}
              className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none transition-colors ${inputBg}`}
            />

            {status === 'error' && (
              <p className="text-xs text-red-400">{errorMsg}</p>
            )}

            <button
              type="submit"
              disabled={status === 'loading' || !email || !orgId}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-500 text-black text-xs font-black uppercase tracking-widest hover:bg-amber-400 transition-colors disabled:opacity-50"
            >
              {status === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {lang === 'ja' ? '登録する' : 'Subscribe Free'}
            </button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
