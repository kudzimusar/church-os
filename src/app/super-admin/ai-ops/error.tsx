'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCcw } from 'lucide-react';

export default function AIOpsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('AI Ops Dashboard Error:', error);
  }, [error]);

  return (
    <div className="flex h-[80vh] flex-col items-center justify-center p-8 text-center">
      <div className="mb-6 rounded-full bg-red-500/10 p-6 ring-1 ring-red-500/20">
        <AlertCircle className="h-12 w-12 text-red-500" />
      </div>
      <h2 className="mb-2 text-2xl font-bold tracking-tight text-white font-manrope">
        Intelligence Interrupted
      </h2>
      <p className="mb-8 max-w-md text-zinc-400">
        We encountered an error while aggregating AI performance metrics. This could be due to a transient database connection issue.
      </p>
      <div className="flex gap-4">
        <Button
          onClick={() => reset()}
          className="bg-zinc-800 text-white hover:bg-zinc-700 font-manrope"
        >
          <RefreshCcw className="mr-2 h-4 w-4" />
          Retry Analysis
        </Button>
        <Button
          variant="ghost"
          onClick={() => window.location.href = '/super-admin'}
          className="text-zinc-500 hover:text-white"
        >
          Return to Dashboard
        </Button>
      </div>
    </div>
  );
}
