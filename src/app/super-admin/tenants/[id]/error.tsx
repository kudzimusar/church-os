'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Ghost, ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function TenantError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Tenant Details Load Error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center p-8 h-[80vh] text-center">
      <div className="mb-6 rounded-full bg-zinc-900 p-8 ring-1 ring-white/10">
        <Ghost className="h-16 w-16 text-zinc-500" />
      </div>
      <h2 className="mb-2 text-2xl font-bold tracking-tight text-white font-manrope">
        Tenant Missing or Inaccessible
      </h2>
      <p className="mb-8 max-w-sm text-zinc-400">
        We couldn't load the details for this organization. It may have been deleted, or you may need to re-verify your Super Admin permissions.
      </p>
      
      <div className="flex gap-4">
        <Link href="/super-admin/tenants">
          <Button variant="outline" className="border-white/10 bg-white/5 text-white font-manrope">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Registry
          </Button>
        </Link>
        <Button
          onClick={() => reset()}
          className="bg-zinc-100 text-zinc-900 hover:bg-white font-manrope"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry Load
        </Button>
      </div>
    </div>
  );
}
