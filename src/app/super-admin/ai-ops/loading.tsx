import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function AIOpsLoading() {
  return (
    <div className="space-y-8 p-8">
      <div>
        <Skeleton className="h-10 w-64 bg-white/5" />
        <Skeleton className="mt-2 h-4 w-96 bg-white/5" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-white/10 bg-white/5 backdrop-blur-xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24 bg-white/10" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 bg-white/10" />
              <Skeleton className="mt-2 h-3 w-32 bg-white/10" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 border-white/10 bg-white/5 backdrop-blur-xl">
          <CardHeader>
            <Skeleton className="h-6 w-48 bg-white/10" />
          </CardHeader>
          <CardContent className="h-[350px]">
            <Skeleton className="h-full w-full bg-white/5" />
          </CardContent>
        </Card>
        <Card className="col-span-3 border-white/10 bg-white/5 backdrop-blur-xl">
          <CardHeader>
            <Skeleton className="h-6 w-32 bg-white/10" />
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center">
                  <Skeleton className="h-9 w-9 rounded-full bg-white/10" />
                  <div className="ml-4 space-y-1">
                    <Skeleton className="h-4 w-32 bg-white/10" />
                    <Skeleton className="h-3 w-24 bg-white/10" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
