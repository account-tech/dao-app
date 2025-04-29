import { useEffect, useState } from "react";
import { DaoMetadata } from "@account.tech/dao";
import { useDaoClient } from "@/hooks/useDaoClient";
import { DaoCard } from "./DaoCard";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { Search } from "lucide-react";
import Link from "next/link";

export function MainContent() {
  const currentAccount = useCurrentAccount();
  const { getUserDaos, getAllDaos } = useDaoClient();
  const [userDaos, setUserDaos] = useState<DaoMetadata[]>([]);
  const [allDaos, setAllDaos] = useState<DaoMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      if (!currentAccount?.address) return;
      
      try {
        setLoading(true);
        const [userDaosData, allDaosData] = await Promise.all([
          getUserDaos(currentAccount.address),
          getAllDaos(currentAccount.address)
        ]);
        
        setUserDaos(userDaosData);
        setAllDaos(allDaosData);
      } catch (error) {
        console.error("Error fetching DAOs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentAccount?.address, getUserDaos, getAllDaos]);

  if (!currentAccount?.address) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen pt-12">
        <h1 className="text-3xl font-bold mb-4">Welcome to DAO Dapp</h1>
        <p className="text-gray-600 mb-8">Connect your wallet to get started</p>
        <button className="bg-blue-500 text-white px-6 py-2 rounded-full hover:bg-blue-600 transition-colors">
          Connect Wallet
        </button>
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

  const filteredUserDaos = userDaos.filter(dao => 
    dao.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get all DAOs that aren't in userDaos for the Explore section
  const exploreDaos = allDaos.filter(dao => 
    !userDaos.some(userDao => userDao.id === dao.id)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 pt-32">
      <div className="flex gap-8">
        {/* Main Content - Left Side */}
        <div className="flex-1">
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">Discover</h1>
              <Link 
                href="/createDao" 
                className="bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600 transition-colors"
              >
                + New DAO
              </Link>
            </div>
            <h2 className="text-xl mb-4">Your DAOs</h2>
            
            {/* Search Bar */}
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Search a DAO..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            </div>
            
            <p className="text-sm text-gray-500 mb-6">
              {filteredUserDaos.length} results
            </p>

            {/* DAOs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredUserDaos.map((dao) => (
                <DaoCard key={dao.id} dao={dao} isFollowed={true} />
              ))}
            </div>
          </div>
        </div>

        {/* Explore Section - Right Side */}
        <div className="w-80">
          <h2 className="text-xl font-semibold mb-6">Explore</h2>
          <div className="space-y-4">
            {exploreDaos.slice(0, 5).map((dao) => (
              <DaoCard key={dao.id} dao={dao} />
            ))}
          </div>
          <Link 
            href="/daos"
            className="mt-6 text-pink-500 hover:text-pink-600 flex items-center gap-2 w-full justify-center py-2 border border-pink-500 rounded-lg"
          >
            Explore all DAOs
            <span>→</span>
          </Link>
        </div>
      </div>
    </div>
  );
} 