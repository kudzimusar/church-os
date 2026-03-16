
import { supabaseAdmin } from './supabase-admin';

export interface PulseData {
  totalMembers: number;
  newSeekers: number;
  weeklyAttendance: number;
  onlineReach: number;
  retentionRate: number;
  trends: {
    members: number;
    seekers: number;
    attendance: number;
    reach: number;
    retention: number;
  };
}

export interface FinanceSummary {
  monthlyIncome: number;
  incomeTrend: number;
  budgetPerformance: number;
  topMinistry: string;
}

export interface MinistryHealth {
  name: string;
  score: number;
  status: string;
  color: string;
}

export interface CareAlert {
  id: string;
  name: string;
  issue: string;
  urgency: 'High' | 'Moderate' | 'Low';
  action: string;
}

export interface CorrespondenceSummary {
  memberMessages: number;
  websiteInquiries: number;
  adminDirect: number;
  externalGmail: number;
}

export async function getPastorDashboardData() {
  const orgId = process.env.NEXT_PUBLIC_ORG_ID || ''; // Should ideally come from session but let's assume default for now

  // 1. Fetch Pulse Data
  const { count: totalMembers } = await supabaseAdmin
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('membership_status', 'member');

  const { count: newSeekers } = await supabaseAdmin
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('membership_status', 'visitor')
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  const { data: attendanceData } = await supabaseAdmin
    .from('attendance_records')
    .select('attended')
    .gte('event_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  const { data: churchHealth } = await supabaseAdmin
    .from('church_health_metrics')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // 2. Fetch Finance Data
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data: currentMonthIncome } = await supabaseAdmin
    .from('financial_records')
    .select('amount')
    .gte('given_date', startOfMonth.toISOString().split('T')[0]);

  const totalMonthlyIncome = currentMonthIncome?.reduce((sum, rec) => sum + Number(rec.amount), 0) || 0;

  // 3. Fetch Ministry Health
  const { data: ministryStats } = await supabaseAdmin
    .from('ministry_analytics')
    .select('ministry_id, health_score, ministries(name, color)')
    .eq('period_type', 'weekly')
    .order('period_start', { ascending: false })
    .limit(10);

  const ministriesHealth: MinistryHealth[] = (ministryStats || []).map(stat => ({
    name: (stat.ministries as any)?.name || 'Unknown',
    score: stat.health_score || 0,
    status: stat.health_score > 80 ? 'Strong' : stat.health_score > 50 ? 'Stable' : 'Needs Support',
    color: (stat.ministries as any)?.color || 'text-violet-500'
  }));

  // 4. Fetch Care Alerts
  const { data: alerts } = await supabaseAdmin
    .from('member_alerts')
    .select('id, alert_type, severity, profiles(name)')
    .eq('is_resolved', false)
    .limit(5);

  const careAlerts: CareAlert[] = (alerts || []).map(alert => ({
    id: alert.id,
    name: (alert.profiles as any)?.name || 'Anonymous',
    issue: alert.alert_type,
    urgency: alert.severity === 'critical' ? 'High' : 'Moderate',
    action: alert.severity === 'critical' ? 'Immediate Call' : 'Review Case'
  }));

  // 5. Fetch Correspondence
  const { count: websiteInquiries } = await supabaseAdmin
    .from('public_inquiries')
    .select('*', { count: 'exact', head: true });

  return {
    pulse: {
      totalMembers: totalMembers || 0,
      newSeekers: newSeekers || 0,
      weeklyAttendance: attendanceData?.filter(a => a.attended).length || 0,
      onlineReach: 2400, // Placeholder
      retentionRate: churchHealth?.engagement_index || 94,
      trends: {
        members: 12,
        seekers: 8,
        attendance: -2,
        reach: 15,
        retention: 1
      }
    },
    finance: {
      monthlyIncome: totalMonthlyIncome,
      incomeTrend: 14,
      budgetPerformance: 102,
      topMinistry: "Men's Dept" // Placeholder
    },
    ministriesHealth: ministriesHealth.length > 0 ? ministriesHealth : [
      { name: "Children's Ministry", score: 98, status: "Strong", color: "text-emerald-500" },
      { name: "Evangelism Team", score: 65, status: "Needs Support", color: "text-amber-500" },
    ],
    careAlerts: careAlerts.length > 0 ? careAlerts : [
      { name: "John Smith", issue: "Missing 4 Weeks", urgency: "High", action: "Immediate Call" },
    ],
    correspondence: {
      memberMessages: 8,
      websiteInquiries: websiteInquiries || 0,
      adminDirect: 12,
      externalGmail: 4
    }
  };
}
