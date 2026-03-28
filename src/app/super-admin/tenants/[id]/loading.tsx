import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function TenantDetailLoading() {
  return (
    <div className="flex flex-col gap-6 p-8">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full bg-white/10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64 bg-white/10" />
            <Skeleton className="h-4 w-40 bg-white/10" />
          </div>
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-32 bg-white/10 rounded-md" />
          <Skeleton className="h-10 w-32 bg-white/10 rounded-md" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Main Info Card */}
          <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
            <CardHeader>
              <Skeleton className="h-6 w-48 bg-white/10" />
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24 bg-white/10" />
                  <Skeleton className="h-6 w-full bg-white/10" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Activity / Engagement Card */}
          <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
            <CardHeader>
              <Skeleton className="h-6 w-32 bg-white/10" />
            </CardHeader>
            <CardContent className="h-[200px]">
              <Skeleton className="h-full w-full bg-white/5" />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Status & Plan Sidebar Cards */}
          <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
            <CardHeader>
              <Skeleton className="h-6 w-24 bg-white/10" />
            </CardHeader>
            <CardContent className="space-y-4">
               <Skeleton className="h-12 w-full bg-white/10" />
               <Skeleton className="h-12 w-full bg-white/10" />
            </CardContent>
          </Card>
          
          <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
            <CardHeader>
              <Skeleton className="h-6 w-32 bg-white/10" />
            </CardHeader>
            <CardContent>
               <Skeleton className="h-24 w-full bg-white/10" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
