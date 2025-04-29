import { useEffect, useState } from "react";
import { DaoMetadata } from "@account.tech/dao";
import { useDaoClient } from "@/hooks/useDaoClient";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { DaoCard } from "@/components/MainPage/DaoCard";
import { Search } from "lucide-react";
import { DaosFilter } from "./DaosFilter";

type FilterType = 'all' | 'followed' | 'not-followed';

export function DaosView() {
  const currentAccount = useCurrentAccount();
  const { getUserDaos, getAllDaos } = useDaoClient();
  const [userDaos, setUserDaos] = useState<DaoMetadata[]>([]);
  const [allDaos, setAllDaos] = useState<DaoMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

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
  }, [currentAccount?.address]);

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
      <div className="flex justify-center items-center min-h-screen pt-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
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
    <div className="max-w-7xl mx-auto px-2 sm:px-4 py-8 pt-32">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-6">Explore DAOs</h1>
        
        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center mb-8">
          {/* Search Bar */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search DAOs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          </div>

          {/* Filters */}
          <DaosFilter
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            followedCount={userDaos.length}
            totalCount={allDaos.length}
          />
        </div>

        {/* Results Count */}
        <p className="text-sm text-gray-500 mb-6">
          {filteredDaos.length} {filteredDaos.length === 1 ? 'result' : 'results'}
        </p>

        {/* DAOs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 justify-items-center">
          {filteredDaos.map((dao) => (
            <DaoCard 
              key={dao.id} 
              dao={dao} 
              isFollowed={isFollowedDao(dao)}
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