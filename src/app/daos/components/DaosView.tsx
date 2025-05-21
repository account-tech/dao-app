import { useEffect, useState } from "react";
import { useMediaQuery } from "react-responsive";
import { DaoMetadata } from "@account.tech/dao";
import { useDaoClient } from "@/hooks/useDaoClient";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { DaoCard } from "@/components/MainPage/DaoCard";
import { Search } from "lucide-react";
import { DaosFilter } from "./DaosFilter";
import { useDaoStore } from "@/store/useDaoStore";
import { Skeleton } from "@/components/ui/skeleton";

type FilterType = 'all' | 'followed' | 'not-followed';

function DaoCardSkeleton() {
  return (
    <div className="bg-white rounded-lg p-4 border w-full sm:w-[48%] md:w-[265px] h-62 space-y-4">
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

function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      {/* Search and Filters Skeleton */}
      <div className="flex flex-col md:flex-row gap-4">
        <Skeleton className="h-10 w-full md:flex-1" /> {/* Search bar */}
        <div className="flex gap-2">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-20" />
        </div>
      </div>
      <div className="flex flex-col md:flex-row gap-1">
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20" />
        </div>
      </div>
      {/* Cards Grid Skeleton */}
      <div className="flex flex-wrap gap-4">
        {Array(6).fill(0).map((_, i) => (
          <DaoCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

export function DaosView() {
  const isMobile = useMediaQuery({ maxWidth: 640 }) // sm breakpoint
  const isTablet = useMediaQuery({ minWidth: 641, maxWidth: 768 }) // between sm and md
  const currentAccount = useCurrentAccount();
  const { getUserDaos, getAllDaos } = useDaoClient();
  const [userDaos, setUserDaos] = useState<DaoMetadata[]>([]);
  const [allDaos, setAllDaos] = useState<DaoMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const refreshCounter = useDaoStore(state => state.refreshCounter)

  const getCardWidth = () => {
    if (isMobile) return "100%"
    if (isTablet) return "49%"
    return "265px"
  }

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      if (!currentAccount?.address) {
        if (mounted) setLoading(false);
        return;
      }
      
      try {
        if (mounted) setLoading(true);
        const [userDaosData, allDaosData] = await Promise.all([
          getUserDaos(currentAccount.address),
          getAllDaos(currentAccount.address)
        ]);
        
        if (mounted) {
          setUserDaos(userDaosData);
          setAllDaos(allDaosData);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching DAOs:", error);
        if (mounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, [currentAccount?.address, refreshCounter]);

  if (!currentAccount?.address) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen pt-12">
        <h1 className="text-3xl font-bold mb-4">Welcome to DAO Dapp</h1>
        <p className="text-gray-600 mb-8">Connect your wallet to explore DAOs</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 pt-32">
        <h1 className="text-3xl font-bold mb-6">Explore DAOs</h1>
        <LoadingSkeleton />
      </div>
    );
  }

  const isFollowedDao = (dao: DaoMetadata) => 
    userDaos.some(userDao => userDao.id === dao.id);

  const filteredDaos = allDaos
    .filter(dao => {
      const matchesSearch = dao.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      switch (activeFilter) {
        case 'followed':
          return matchesSearch && isFollowedDao(dao);
        case 'not-followed':
          return matchesSearch && !isFollowedDao(dao);
        default:
          return matchesSearch;
      }
    });

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 pt-32">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-6">Explore DAOs</h1>
        
        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          {/* Search Bar */}
          <div className="relative w-full md:flex-1">
            <input
              type="text"
              placeholder="Search DAOs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 md:py-2 border rounded-lg"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          </div>

          {/* Filters */}
          <div className="self-start">
            <DaosFilter
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              followedCount={userDaos.length}
              totalCount={allDaos.length}
            />
          </div>
        </div>

        {/* Results Count */}
        <p className="text-sm text-gray-500 mb-6">
          {filteredDaos.length} {filteredDaos.length === 1 ? 'result' : 'results'}
        </p>

        {/* DAOs Flex Container */}
        <div className="flex flex-wrap gap-2">
          {filteredDaos.map((dao) => (
            <DaoCard 
              key={dao.id} 
              dao={dao} 
              isFollowed={isFollowedDao(dao)}
              width={getCardWidth()}
            />
          ))}
        </div>

        {/* No Results */}
        {filteredDaos.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No DAOs found matching your criteria</p>
          </div>
        )}
      </div>
    </div>
  );
} 