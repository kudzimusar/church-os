import React from 'react';
import { MANUAL_CONTENT, ManualRole } from '@/lib/manual-config';
import ManualRoleClient from './ManualRoleClient';

export function generateStaticParams() {
  const roles: ManualRole[] = ['super-admin', 'pastor-hq', 'ministry-leader', 'member'];
  return roles.map((role) => ({
    role: role,
  }));
}

export default async function RoleManualPage({ params }: { params: Promise<{ role: string }> }) {
  const { role } = await params;
  
  return <ManualRoleClient role={role} />;
}
