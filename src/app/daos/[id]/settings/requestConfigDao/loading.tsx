import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto w-full py-16">
      {/* Steps Progress */}
      <div className="relative mb-8">
        <div className="flex justify-between">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex flex-col items-center relative z-10">
              <Skeleton className="w-10 h-10 rounded-full bg-gray-200" />
              <Skeleton className="w-24 h-4 mt-2 bg-gray-200" />
            </div>
          ))}
        </div>
        <div className="absolute top-5 left-[5%] right-[5%] h-[2px] bg-gray-200 -z-0" />
      </div>

      {/* Title and Description */}
      <div className="mt-8 text-center space-y-2 mb-8">
        <Skeleton className="h-8 w-64 mx-auto bg-gray-200" />
        <Skeleton className="h-4 w-96 mx-auto bg-gray-200" />
      </div>

      {/* Main Content Card */}
      <Card className="min-h-[400px]">
        <CardHeader>
          <Skeleton className="h-6 w-48 bg-gray-200" />
          <Skeleton className="h-4 w-72 mt-2 bg-gray-200" />
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Dependencies Section */}
          <div className="space-y-4">
            <Skeleton className="h-6 w-32 bg-gray-200" />
            {[1, 2, 3].map((dep) => (
              <div key={dep} className="flex justify-between items-center p-3 rounded-lg border border-gray-100">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-36 bg-gray-200" />
                  <Skeleton className="h-4 w-64 bg-gray-200" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-16 bg-gray-200" />
                  <Skeleton className="h-6 w-6 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>

          {/* Search Section */}
          <div className="mt-6">
            <Skeleton className="h-10 w-full bg-gray-200 rounded-lg" />
            <div className="mt-4 space-y-3">
              {[1, 2].map((result) => (
                <div key={result} className="flex items-center justify-between p-3 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded bg-gray-200" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-32 bg-gray-200" />
                      <Skeleton className="h-3 w-48 bg-gray-200" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-20 bg-gray-200" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
