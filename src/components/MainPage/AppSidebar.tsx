"use client"

import * as React from "react"
import { useMediaQuery } from "react-responsive"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { useCurrentAccount } from "@mysten/dapp-kit"
import { useDaoClient } from "@/hooks/useDaoClient"
import { DaoMetadata } from "@account.tech/dao"
import { Search } from "lucide-react"
import Link from "next/link"
import { DaoCard } from "./DaoCard"
import { SkeletonLoader } from "./SkeletonLoader"
import { useDaoStore } from "@/store/useDaoStore"
import { UnconnectedView } from "./UnconnectedView"
import { cn } from "@/lib/utils"

export function AppSidebar() {
  const isMobile = useMediaQuery({ maxWidth: 640 })
  const isTablet = useMediaQuery({ minWidth: 641, maxWidth: 768 })
  const currentAccount = useCurrentAccount()
  const { getUserDaos, getAllDaos } = useDaoClient()
  const [userDaos, setUserDaos] = React.useState<DaoMetadata[]>([])
  const [allDaos, setAllDaos] = React.useState<DaoMetadata[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")
  const refreshTrigger = useDaoStore(state => state.refreshTrigger)

  const getCardWidth = () => {
    if (isMobile) return "100%"
    if (isTablet) return "49%"
    return "265px"
  }

  React.useEffect(() => {
    const fetchData = async () => {
      if (!currentAccount?.address) return
      
      try {
        setLoading(true)
        const [userDaosData, allDaosData] = await Promise.all([
          getUserDaos(currentAccount.address),
          getAllDaos(currentAccount.address)
        ])
        
        setUserDaos(userDaosData)
        setAllDaos(allDaosData)
      } catch (error) {
        console.error("Error fetching DAOs:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [currentAccount?.address, refreshTrigger])

  if (!currentAccount?.address) {
    return <UnconnectedView />
  }

  if (loading) {
    return <SkeletonLoader />
  }

  const filteredUserDaos = userDaos.filter(dao => 
    dao.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const exploreDaos = allDaos.filter(dao => 
    !userDaos.some(userDao => userDao.id === dao.id)
  )

  return (
    <SidebarProvider>
      <Sidebar side="left">
        <SidebarContent className="flex flex-col items-center h-full">
          <SidebarHeader className="pt-24 w-full">
            <h2 className="text-2xl font-bold px-2 text-center">Discover</h2>
          </SidebarHeader>
          <div className={cn(
            "flex-1 w-full overflow-y-auto min-h-0",
            "[&::-webkit-scrollbar]:w-2",
            "[&::-webkit-scrollbar]:hidden"
          )}>
            <div className="space-y-4 px-2 flex flex-col items-center py-4">
              {exploreDaos.slice(0, 6).map((dao) => (
                <DaoCard key={dao.id} dao={dao} />
              ))}
            </div>
          </div>
          <SidebarFooter className="w-full mt-auto pt-4">
            <Link 
              href="/daos"
              className="mx-2 text-pink-500 hover:text-pink-600 flex items-center gap-2 justify-center py-2 border border-pink-500 rounded-lg w-[265px]"
            >
              Explore all DAOs
              <span>→</span>
            </Link>
          </SidebarFooter>
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
      <SidebarInset className="bg-gray-50 pt-16">
        <div className="px-4 md:px-8 lg:px-12 py-8">
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">Manage</h1>
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
            
            <p className="text-sm text-gray-500 mb-4">
              {filteredUserDaos.length} results
            </p>

            {/* DAOs Row */}
            <div className="flex flex-wrap gap-2">
              {filteredUserDaos.map((dao) => (
                <DaoCard 
                  key={dao.id} 
                  dao={dao} 
                  isFollowed={true} 
                  width={getCardWidth()}
                />
              ))}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
} 