import { useMediaQuery } from "react-responsive"
import { Skeleton } from "@/components/ui/skeleton"

export function SkeletonLoader() {
  const isMobile = useMediaQuery({ maxWidth: 640 })
  const isTablet = useMediaQuery({ minWidth: 641, maxWidth: 768 })

  const getCardWidth = () => {
    if (isMobile) return "100%"
    if (isTablet) return "49%"
    return "265px"
  }

  const cardWidth = getCardWidth()

  return (
    <div className="flex">
      {/* Sidebar Skeleton */}
      <div className="hidden md:flex flex-col items-center w-[265px] pt-24 px-2">
        <Skeleton className="h-8 w-40 mb-8" /> {/* Explore title */}
        <div className="space-y-4 w-full">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-[200px] w-full rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-10 w-full mt-4 rounded-lg" /> {/* Explore all button */}
      </div>

      {/* Main Content Skeleton */}
      <div className="flex-1 px-4 md:px-8 lg:px-12 py-8 pt-24">
        <div className="mb-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <Skeleton className="h-8 w-32" /> {/* Discover title */}
            <Skeleton className="h-10 w-28" /> {/* New DAO button */}
          </div>

          <Skeleton className="h-7 w-24 mb-4" /> {/* Your DAOs subtitle */}

          {/* Search Bar */}
          <Skeleton className="h-11 w-full mb-4 rounded-lg" />

          {/* Results count */}
          <Skeleton className="h-5 w-20 mb-4" />

          {/* Cards Grid */}
          <div className="flex flex-wrap gap-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{ width: cardWidth }}>
                <Skeleton className="h-[200px] rounded-2xl" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 