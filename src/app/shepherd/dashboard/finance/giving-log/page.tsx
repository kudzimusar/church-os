"use client";
import { supabase } from "@/lib/supabase";

import { useState, useEffect } from 'react';

import { toast } from 'sonner';
import { Plus, DollarSign, Calendar, User, FileText, Loader2, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

type GivingRecord = {
  id: string;
  amount: number;
  currency: string;
  record_type: string;
  notes: string;
  given_date: string;
};

const ORG_ID = 'fa547adf-f820-412f-9458-d6bade11517d';

export default function GivingLogPage() {
  const [records, setRecords] = useState<GivingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [donorName, setDonorName] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('JPY');
  const [type, setType] = useState('tithe');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const fetchRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('financial_records')
        .select('*')
        .eq('org_id', ORG_ID)
        .order('given_date', { ascending: false })
        .limit(20);

      if (error) throw error;
      setRecords(data || []);
    } catch (error: any) {
      toast.error('Failed to fetch donations');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!donorName || !amount) {
      toast.error('Donor name and amount are required');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('financial_records').insert({
        user_id: null,
        amount: Number(amount),
        currency,
        record_type: type,
        notes: `${paymentMethod.toUpperCase()}: ${donorName}. ${notes}`,
        org_id: ORG_ID,
        given_date: date
      });

      if (error) throw error;

      toast.success('Donation logged to finance dashboard.');
      setDonorName('');
      setAmount('');
      setNotes('');
      fetchRecords();
    } catch (error: any) {
      toast.error(error.message || 'Failed to log donation');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 p-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-xl font-black">Donation Log</h1>
        <p className="text-[11px] text-muted-foreground uppercase tracking-widest">
          Record offline donations — cash, transfers, and manual gifts
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 items-start">
        {/* Left: Form */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)]">
              <Plus className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-black uppercase tracking-widest">Log a Donation</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted-foreground tracking-widest uppercase ml-1">Donor Name *</label>
              <input 
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                placeholder="Full Name"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[var(--primary)] outline-none transition-colors"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground tracking-widest uppercase ml-1">Amount *</label>
                <input 
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[var(--primary)] outline-none transition-colors"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground tracking-widest uppercase ml-1">Currency</label>
                <select 
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[var(--primary)] outline-none transition-colors appearance-none"
                >
                  <option value="JPY">JPY (¥)</option>
                  <option value="USD">USD ($)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground tracking-widest uppercase ml-1">Type</label>
                <select 
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[var(--primary)] outline-none transition-colors appearance-none"
                >
                  <option value="tithe">Tithe</option>
                  <option value="offering">Offering</option>
                  <option value="love_offering">Love Offering</option>
                  <option value="building_fund">Building Fund</option>
                  <option value="outreach">Outreach</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground tracking-widest uppercase ml-1">Payment Method</label>
                <select 
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[var(--primary)] outline-none transition-colors appearance-none"
                >
                  <option value="cash">Cash</option>
                  <option value="zelle">Zelle</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cash_app">Cash App</option>
                  <option value="paypal">PayPal</option>
                  <option value="wire">Wire</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted-foreground tracking-widest uppercase ml-1">Date</label>
              <input 
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[var(--primary)] outline-none transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-muted-foreground tracking-widest uppercase ml-1">Notes (Optional)</label>
              <textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional details..."
                rows={3}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[var(--primary)] outline-none transition-colors resize-none"
              />
            </div>

            <button 
              disabled={submitting}
              className="w-full bg-[var(--primary)] text-white font-black py-4 rounded-xl text-xs tracking-[0.2em] shadow-lg shadow-[var(--primary)]/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 mt-6"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'LOG DONATION'}
            </button>
          </form>
        </div>

        {/* Right: List */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <DollarSign className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-black uppercase tracking-widest">Recent Donations</h2>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="py-20 text-center animate-pulse text-white/20 font-black text-xs tracking-widest">LOADING...</div>
            ) : records.length === 0 ? (
              <div className="py-20 text-center text-white/20 font-black text-xs tracking-widest uppercase">No records found</div>
            ) : (
              records.map((record) => (
                <div key={record.id} className="bg-black/40 border border-white/5 p-4 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-black text-white">
                        {record.currency === 'JPY' ? '¥' : '$'}{record.amount.toLocaleString()}
                      </span>
                      <span className="bg-white/10 text-[8px] font-black px-2 py-0.5 rounded tracking-widest uppercase">
                        {record.record_type}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-tighter flex items-center gap-1">
                      <Calendar className="w-2.5 h-2.5" /> {format(new Date(record.given_date), 'MMM dd, yyyy')}
                    </span>
                  </div>
                  <div className="flex gap-2 items-start">
                    <FileText className="w-3 h-3 text-white/20 mt-1 flex-shrink-0" />
                    <p className="text-[11px] text-white/50 leading-relaxed italic truncate">
                      {record.notes}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
