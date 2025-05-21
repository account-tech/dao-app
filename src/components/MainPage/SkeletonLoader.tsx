import { useMediaQuery } from "react-responsive"
import { Skeleton } from "@/components/ui/skeleton"

function DaoCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={`bg-white rounded-lg p-4 border h-62 space-y-4 ${className}`}>
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
      <div className="flex justify-between items-center">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-8 w-20 rounded-md" />
      </div>
      <div className="flex justify-between pt-16">
        <div className="text-center">
          <Skeleton className="h-5 w-6 mx-auto mb-1" /> {/* Number */}
          <Skeleton className="h-3 w-14" /> {/* "followers" text */}
        </div>
        <div className="text-center">
          <Skeleton className="h-5 w-6 mx-auto mb-1" /> {/* Number */}
          <Skeleton className="h-3 w-14" /> {/* "proposals" text */}
        </div>
        <div className="text-center">
          <Skeleton className="h-5 w-6 mx-auto mb-1" /> {/* Number */}
          <Skeleton className="h-3 w-14" /> {/* "votes" text */}
        </div>
      </div>
    </div>
  )
}

export function SkeletonLoader() {
  return (
    <div className="flex w-full overflow-x-hidden">
      {/* Sidebar Skeleton */}
      <div className="hidden md:flex flex-col items-center w-[265px] pt-24 px-2">
        <h2 className="text-2xl font-bold px-2 text-center mb-6">Discover</h2>
        <div className="space-y-4 w-full flex flex-col items-center ml-8">
          {[...Array(3)].map((_, i) => (
            <DaoCardSkeleton key={i} className="w-[265px]" />
          ))}
        </div>
        <Skeleton className="h-10 w-[265px] mt-4 rounded-lg bg-teal-500/20" /> {/* Explore all button */}
      </div>

      {/* Teal Separator */}
      <div className="hidden md:block w-[4px] bg-teal-200 ml-8" />

      {/* Main Content Skeleton */}
      <div className="flex-1 px-4 md:px-8 lg:px-12 py-8 pt-24 max-w-full">
        <div className="mb-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold px-2 text-center">Manage</h2>
            <Skeleton className="h-10 w-28 bg-teal-500/20" /> {/* New DAO button */}
          </div>

          <Skeleton className="h-7 w-24 mb-4" /> {/* Your DAOs subtitle */}

          {/* Search Bar */}
          <Skeleton className="h-11 w-full mb-4 rounded-lg" />

          {/* Results count */}
          <Skeleton className="h-5 w-20 mb-4" />

          {/* Cards Grid */}
          <div className="flex flex-wrap gap-2">
            {[...Array(6)].map((_, i) => (
              <DaoCardSkeleton key={i} className="w-full sm:w-[49%] md:w-[265px]" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 