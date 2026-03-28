import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="p-8 space-y-8 animate-pulse">
      <div className="flex justify-between items-center mb-8">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64 bg-slate-800" />
          <Skeleton className="h-4 w-48 bg-slate-800" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-32 bg-slate-800 rounded-xl" />
          <Skeleton className="h-10 w-40 bg-slate-800 rounded-xl" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="bg-slate-900/40 border-slate-800/50 rounded-2xl">
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24 bg-slate-800" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32 bg-slate-800 mb-2" />
              <Skeleton className="h-3 w-40 bg-slate-800" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="bg-slate-900/40 border-slate-800/50 rounded-2xl h-[400px]">
            <CardHeader>
              <Skeleton className="h-6 w-48 bg-slate-800" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-full w-full bg-slate-800/50 rounded-xl" />
            </CardContent>
          </Card>
        </div>
        <div>
          <Card className="bg-slate-900/40 border-slate-800/50 rounded-2xl h-[400px]">
            <CardHeader>
              <Skeleton className="h-6 w-32 bg-slate-800" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-10 w-10 bg-slate-800 rounded-xl" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-full bg-slate-800" />
                    <Skeleton className="h-3 w-2/3 bg-slate-800" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
