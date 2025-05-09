import { Skeleton } from "@/components/ui/skeleton";

export default function UserDataSkeleton() {
  return (
    <div className="p-4 rounded-lg bg-white shadow">
      <div className="space-y-4">
        {/* Voting Power Section */}
        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-gray-600">Voting Power</span>
              <Skeleton className="h-4 w-4 rounded-full" />
            </div>
            <div className="flex items-baseline gap-2">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-4 w-12" />
            </div>
          </div>

          {/* Progress Bar */}
          <div className="relative h-2 w-full bg-gray-100 rounded-full overflow-hidden">
            <Skeleton className="h-full w-1/3" />
          </div>

          {/* Alert */}
          <div className="mt-4">
            <Skeleton className="h-16 w-full rounded-lg" />
          </div>
        </div>

        {/* Staking Information */}
        <div className="mt-6 space-y-4">
          {/* Main Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex flex-col gap-1">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-24" />
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex flex-col gap-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-24" />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 flex-1" />
          </div>

          {/* Claim Button */}
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
  );
}
