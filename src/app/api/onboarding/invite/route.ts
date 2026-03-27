import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { email, churchName, invitedBy } = await request.json();
    console.log('Invite API: processing request for', email);
    
    // Use service role client to bypass all RLS (Server-side only)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    
    console.log('Invite API: supabase admin client created');
    
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const inviteLink = `${siteUrl}/onboarding?invited=true&church=${encodeURIComponent(churchName || '')}`;
    
    // Log invitation for analytics
    const { error: insertErr } = await supabase.from('onboarding_invitations').insert({
      email,
      church_name: churchName,
      invited_by: invitedBy,
      invited_at: new Date().toISOString(),
      status: 'pending'
    });
    
    if (insertErr) {
      console.error('Insert error:', insertErr);
      return NextResponse.json({ error: insertErr.message }, { status: 400 });
    }
    
    // Send invitation via Brevo
    try {
      console.log('Invite API: sending email via Brevo to', email);
      const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': process.env.BREVO_API_KEY!
        },
        body: JSON.stringify({
          sender: { name: 'Church OS', email: 'no-reply@churchos.ai' },
          to: [{ email }],
          subject: `Join ${churchName || 'the New Sanctuary'} on Church OS`,
          htmlContent: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background: #0c0e12; color: white; border-radius: 20px;">
              <h1 style="color: #72eff5; font-size: 24px; text-transform: uppercase; letter-spacing: 2px;">You're Invited</h1>
              <p style="color: #aaabb0; line-height: 1.6;">You have been invited to start the premium onboarding process for <strong>${churchName || 'your church'}</strong> on Church OS.</p>
              <div style="margin: 40px 0;">
                <a href="${inviteLink}" style="background: linear-gradient(to right, #72eff5, #1fb1b7); color: #002829; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; text-transform: uppercase; font-size: 14px; letter-spacing: 1px;">Start Onboarding</a>
              </div>
              <p style="color: #666; font-size: 12px;">This invitation is active for 48 hours.</p>
            </div>
          `
        })
      });
      
      const brevoData = await brevoResponse.json();
      if (!brevoResponse.ok) {
        throw new Error(brevoData.message || 'Brevo API error');
      }
      
    } catch (emailErr) {
      console.error('Email sending failed:', emailErr);
      // We still return success as the DB record was created, but log the email error
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Invitation logged and email sent via Brevo.' 
    });
    
  } catch (error) {
    console.error('Invite API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
