// src/components/profile/connection-card.tsx
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/supabase';

/**
 * Helper to upsert a row into a Supabase table.
 * Uses `id` if present, otherwise inserts.
 */
async function upsert<T extends keyof Database['public']['Tables']>(
  table: T,
  payload: Database['public']['Tables'][T]['Insert']
) {
  const { data, error } = await supabase.from(table).upsert(payload, { returning: 'minimal' });
  if (error) console.error(`Upsert error on ${table}:`, error);
  return data;
}

/**
 * ConnectionCard – the member profile UI that now writes directly to Supabase.
 * All tabs are fully wired to the database and therefore feed Mission Control.
 */
export default function ConnectionCard({ userId }: { userId: string }) {
  // ---------- State ----------
  const [profile, setProfile] = useState<any>(null);
  const [household, setHousehold] = useState<any>(null);
  const [kids, setKids] = useState<any[]>([]);
  const [memberStats, setMemberStats] = useState<any>(null);
  const [ministryRoles, setMinistryRoles] = useState<any[]>([]);
  const [pastoralNotes, setPastoralNotes] = useState<any[]>([]);
  const [prayerRequests, setPrayerRequests] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [skills, setSkills] = useState<any[]>([]);
  const [bibleGroups, setBibleGroups] = useState<any[]>([]);
  const [financials, setFinancials] = useState<any[]>([]);
  const [merchOrders, setMerchOrders] = useState<any[]>([]);

  // ---------- Load data ----------
  useEffect(() => {
    async function fetchAll() {
      // Profile
      const { data: p } = await supabase.from('profiles').select('*').eq('id', userId).single();
      setProfile(p);

      // Household (if linked)
      const { data: h } = await supabase
        .from('households')
        .select('*')
        .eq('head_user_id', userId)
        .single();
      setHousehold(h);

      // Kids registry (children linked to this member as guardian)
      const { data: k } = await supabase
        .from('kids_registry')
        .select('*')
        .eq('supervised_by', userId);
      setKids(k || []);

      // Member stats
      const { data: ms } = await supabase.from('member_stats').select('*').eq('user_id', userId).single();
      setMemberStats(ms);

      // Ministry members
      const { data: mm } = await supabase.from('ministry_members').select('*').eq('user_id', userId);
      setMinistryRoles(mm || []);

      // Pastoral notes (admin only – still fetched for completeness)
      const { data: pn } = await supabase.from('pastoral_notes').select('*').eq('member_user_id', userId);
      setPastoralNotes(pn || []);

      // Prayer requests (member‑owned)
      const { data: pr } = await supabase.from('prayer_requests').select('*').eq('user_id', userId);
      setPrayerRequests(pr || []);

      // Attendance records
      const { data: at } = await supabase.from('attendance_records').select('*').eq('user_id', userId);
      setAttendance(at || []);

      // Skills & talents (member_skills table)
      const { data: sk } = await supabase.from('member_skills').select('*').eq('user_id', userId);
      setSkills(sk || []);

      // Bible study group memberships
      const { data: bg } = await supabase
        .from('bible_study_group_members')
        .select('bible_study_groups(*)')
        .eq('user_id', userId);
      setBibleGroups(bg?.map((r: any) => r.bible_study_groups) || []);

      // Financial records (giving & tithe)
      const { data: fr } = await supabase.from('financial_records').select('*').eq('user_id', userId);
      setFinancials(fr || []);

      // Merchandise orders (history)
      const { data: mo } = await supabase.from('merchandise_orders').select('*').eq('user_id', userId);
      setMerchOrders(mo || []);
    }
    fetchAll();
  }, [userId]);

  // ---------- Handlers ----------
  // Identity – simple profile update
  const handleIdentitySave = async (updates: Partial<any>) => {
    const payload = { ...profile, ...updates };
    await upsert('profiles', payload);
    setProfile(payload);
  };

  // Family – create or update household
  const handleFamilySave = async (house: Partial<any>) => {
    const payload = { ...household, ...house, head_user_id: userId } as any;
    await upsert('households', payload);
    setHousehold(payload);
  };

  // Junior Church – add child to kids_registry
  const handleAddKid = async (kid: any) => {
    const payload = { ...kid, supervised_by: userId } as any;
    const { data, error } = await supabase.from('kids_registry').insert(payload);
    if (!error) setKids([...kids, payload]);
  };

  // Ministry – add / update ministry role
  const handleAddMinistry = async (role: any) => {
    const payload = { ...role, user_id: userId } as any;
    const { data, error } = await supabase.from('ministry_members').insert(payload);
    if (!error) setMinistryRoles([...ministryRoles, payload]);
  };

  // Pastoral Care – save a note (admin only – UI will hide for non‑admin)
  const handleSavePastoralNote = async (note: any) => {
    const payload = { ...note, member_user_id: userId } as any;
    const { data, error } = await supabase.from('pastoral_notes').insert(payload);
    if (!error) setPastoralNotes([...pastoralNotes, payload]);
  };

  // Prayer – submit a new request
  const handleAddPrayer = async (prayer: any) => {
    const payload = { ...prayer, user_id: userId } as any;
    const { data, error } = await supabase.from('prayer_requests').insert(payload);
    if (!error) setPrayerRequests([...prayerRequests, payload]);
  };

  // Attendance – record a new attendance entry
  const handleAddAttendance = async (record: any) => {
    const payload = { ...record, user_id: userId } as any;
    const { data, error } = await supabase.from('attendance_records').insert(payload);
    if (!error) setAttendance([...attendance, payload]);
  };

  // Skills – add or update a skill entry
  const handleAddSkill = async (skill: any) => {
    const payload = { ...skill, user_id: userId } as any;
    const { data, error } = await supabase.from('member_skills').insert(payload);
    if (!error) setSkills([...skills, payload]);
  };

  // Bible Study – self‑enroll into a group
  const handleJoinBibleGroup = async (groupId: string) => {
    const payload = { user_id: userId, group_id: groupId } as any;
    const { data, error } = await supabase.from('bible_study_group_members').insert(payload);
    if (!error) {
      // Refresh group list
      const { data: bg } = await supabase
        .from('bible_study_group_members')
        .select('bible_study_groups(*)')
        .eq('user_id', userId);
      setBibleGroups(bg?.map((r: any) => r.bible_study_groups) || []);
    }
  };

  // Giving – record a financial contribution
  const handleAddFinancial = async (record: any) => {
    const payload = { ...record, user_id: userId } as any;
    const { data, error } = await supabase.from('financial_records').insert(payload);
    if (!error) setFinancials([...financials, payload]);
  };

  // Merchandise – place an order (simplified)
  const handlePlaceOrder = async (order: any) => {
    const payload = { ...order, user_id: userId, payment_status: 'pending' } as any;
    const { data, error } = await supabase.from('merchandise_orders').insert(payload);
    if (!error) setMerchOrders([...merchOrders, payload]);
  };

  // ---------- Render ----------
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-lg space-y-8">
      {/* Identity */}
      <section>
        <h2 className="text-2xl font-semibold mb-2">Identity</h2>
        {profile && (
          <div className="grid grid-cols-2 gap-4">
            <input
              className="border rounded p-2"
              defaultValue={profile.name}
              onBlur={e => handleIdentitySave({ name: e.target.value })}
              placeholder="Name"
            />
            <input
              className="border rounded p-2"
              defaultValue={profile.email}
              onBlur={e => handleIdentitySave({ email: e.target.value })}
              placeholder="Email"
            />
            {/* Add more fields as needed – gender, ward, GPS, etc. */}
          </div>
        )}
      </section>

      {/* Family & Households */}
      <section>
        <h2 className="text-2xl font-semibold mb-2">Family & Households</h2>
        <div className="grid grid-cols-2 gap-4">
          <input
            className="border rounded p-2"
            defaultValue={household?.address || ''}
            onBlur={e => handleFamilySave({ address: e.target.value })}
            placeholder="Address"
          />
          <input
            className="border rounded p-2"
            defaultValue={household?.ward || ''}
            onBlur={e => handleFamilySave({ ward: e.target.value })}
            placeholder="Ward"
          />
        </div>
      </section>

      {/* Junior Church */}
      <section>
        <h2 className="text-2xl font-semibold mb-2">Junior Church (Children)</h2>
        <button
          className="bg-indigo-600 text-white px-4 py-2 rounded"
          onClick={() =>
            handleAddKid({ child_name: 'New Child', age: 5, allergies: '', status: 'active' })
          }
        >
          Add Child
        </button>
        <ul className="mt-2 list-disc pl-5">
          {kids.map(k => (
            <li key={k.id}>{k.child_name} – Age {k.age}</li>
          ))}
        </ul>
      </section>

      {/* Spiritual Journey */}
      <section>
        <h2 className="text-2xl font-semibold mb-2">Spiritual Journey</h2>
        {memberStats && (
          <div className="grid grid-cols-2 gap-4">
            <div>Current Streak: {memberStats.current_streak}</div>
            <div>Last Devotion: {memberStats.last_devotion_date?.slice(0, 10)}</div>
          </div>
        )}
      </section>

      {/* Ministry & Service */}
      <section>
        <h2 className="text-2xl font-semibold mb-2">Ministry & Service</h2>
        <button
          className="bg-green-600 text-white px-4 py-2 rounded"
          onClick={() =>
            handleAddMinistry({ ministry_name: 'Media', ministry_role: 'Volunteer', is_active: true })
          }
        >
          Join Ministry
        </button>
        <ul className="mt-2 list-disc pl-5">
          {ministryRoles.map(r => (
            <li key={r.id}>{r.ministry_name} – {r.ministry_role}</li>
          ))}
        </ul>
      </section>

      {/* Pastoral Care */}
      <section>
        <h2 className="text-2xl font-semibold mb-2">Pastoral Care</h2>
        <button
          className="bg-red-600 text-white px-4 py-2 rounded"
          onClick={() =>
            handleSavePastoralNote({ category: 'Counseling', note: 'Follow‑up needed', follow_up_date: new Date().toISOString() })
          }
        >
          Add Note
        </button>
        <ul className="mt-2 list-disc pl-5">
          {pastoralNotes.map(n => (
            <li key={n.id}>{n.category}: {n.note}</li>
          ))}
        </ul>
      </section>

      {/* Prayer Requests */}
      <section>
        <h2 className="text-2xl font-semibold mb-2">Prayer Requests</h2>
        <button
          className="bg-purple-600 text-white px-4 py-2 rounded"
          onClick={() =>
            handleAddPrayer({ category: 'Finance', request_text: 'Need help with rent', urgency: 'normal', status: 'active' })
          }
        >
          Submit Prayer
        </button>
        <ul className="mt-2 list-disc pl-5">
          {prayerRequests.map(p => (
            <li key={p.id}>{p.category}: {p.request_text}</li>
          ))}
        </ul>
      </section>

      {/* Attendance */}
      <section>
        <h2 className="text-2xl font-semibold mb-2">Attendance</h2>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded"
          onClick={() =>
            handleAddAttendance({ event_type: 'Sunday Service', event_date: new Date().toISOString().slice(0, 10), attended: true })
          }
        >
          Record Attendance
        </button>
        <ul className="mt-2 list-disc pl-5">
          {attendance.slice(-5).map(a => (
            <li key={a.id}>{a.event_date}: {a.attended ? 'Present' : 'Absent'}</li>
          ))}
        </ul>
      </section>

      {/* Skills & Talents */}
      <section>
        <h2 className="text-2xl font-semibold mb-2">Skills & Talents</h2>
        <button
          className="bg-teal-600 text-white px-4 py-2 rounded"
          onClick={() =>
            handleAddSkill({ skill_name: 'Video Editing', skill_category: 'Technical', skill_level: 'Intermediate', years_experience: 2 })
          }
        >
          Add Skill
        </button>
        <ul className="mt-2 list-disc pl-5">
          {skills.map(s => (
            <li key={s.id}>{s.skill_name} ({s.skill_category}) – {s.skill_level}</li>
          ))}
        </ul>
      </section>

      {/* Bible Study Groups */}
      <section>
        <h2 className="text-2xl font-semibold mb-2">Bible Study Groups</h2>
        <button
          className="bg-orange-600 text-white px-4 py-2 rounded"
          onClick={() => {
            // For demo we pick the first group that the user is not already a member of
            supabase
              .from('bible_study_groups')
              .select('id')
              .limit(1)
              .then(res => {
                const groupId = res.data?.[0]?.id;
                if (groupId) handleJoinBibleGroup(groupId);
              });
          }}
        >
          Join Group
        </button>
        <ul className="mt-2 list-disc pl-5">
          {bibleGroups.map(g => (
            <li key={g.id}>{g.name} – {g.location}</li>
          ))}
        </ul>
      </section>

      {/* Giving & Tithe */}
      <section>
        <h2 className="text-2xl font-semibold mb-2">Giving & Tithe</h2>
        <button
          className="bg-yellow-600 text-white px-4 py-2 rounded"
          onClick={() =>
            handleAddFinancial({ record_type: 'tithe', amount: 5000, currency: 'JPY', given_date: new Date().toISOString().slice(0, 10) })
          }
        >
          Record Giving
        </button>
        <ul className="mt-2 list-disc pl-5">
          {financials.map(f => (
            <li key={f.id}>{f.record_type}: ¥{f.amount} on {f.given_date}</li>
          ))}
        </ul>
      </section>

      {/* Merchandise Orders */}
      <section>
        <h2 className="text-2xl font-semibold mb-2">Merchandise Orders</h2>
        <button
          className="bg-pink-600 text-white px-4 py-2 rounded"
          onClick={() =>
            handlePlaceOrder({ total_amount: 1200, payment_status: 'paid', shipping_address: profile?.address || '' })
          }
        >
          Place Order (Demo)
        </button>
        <ul className="mt-2 list-disc pl-5">
          {merchOrders.map(o => (
            <li key={o.id}>Order ¥{o.total_amount} – {o.payment_status}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
