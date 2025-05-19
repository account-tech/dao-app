import { useState, useEffect } from "react";
import { useDaoClient } from "@/hooks/useDaoClient";
import { useCurrentAccount, useSuiClient, useSignTransaction } from "@mysten/dapp-kit";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Dep } from "@account.tech/core";
import { Transaction } from "@mysten/sui/transactions";
import { signAndExecute, handleTxResult } from "@/utils/tx/Tx";
import { toast } from "sonner";
import { DepStatus } from "@account.tech/dao";
import { useDaoStore } from "@/store/useDaoStore";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface EnhancedDep extends Dep {
  status?: DepStatus;
}

interface DependenciesSectionProps {
  daoId: string;
  hasAuthPower: boolean;
  authVotingPower: string;
  votingPower: string;
}

export function DependenciesSection({ daoId, hasAuthPower, authVotingPower, votingPower }: DependenciesSectionProps) {
  const router = useRouter();
  const [coreDeps, setCoreDeps] = useState<EnhancedDep[]>([]);
  const [externalDeps, setExternalDeps] = useState<EnhancedDep[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [unverifiedDepsAllowed, setUnverifiedDepsAllowed] = useState(false);
  const refreshCounter = useDaoStore(state => state.refreshCounter);
  
  const currentAccount = useCurrentAccount();
  const { getVerifiedDeps, getUnverifiedDeps, getDepsStatus, updateVerifiedDeps } = useDaoClient();
  const { refreshClient } = useDaoStore();
  const suiClient = useSuiClient();
  const signTransaction = useSignTransaction();


  const fetchDependencies = async () => {
    if (!currentAccount?.address || !daoId) {
      setIsLoading(false);
      return;
    }

    try {
      const [verified, unverified, status] = await Promise.all([
        getVerifiedDeps(currentAccount.address, daoId),
        getUnverifiedDeps(currentAccount.address, daoId),
        getDepsStatus(currentAccount.address, daoId)
      ]);

      const enhanceWithStatus = (deps: Dep[]): EnhancedDep[] => {
        return deps.map(dep => ({
          ...dep,
          status: status.find(s => s.currentAddr === dep.addr)
        }));
      };

      setCoreDeps(enhanceWithStatus(verified));
      setExternalDeps(enhanceWithStatus(unverified));
    } catch (error) {
      console.error('Error fetching dependencies:', error);
      toast.error(error instanceof Error ? error.message : "Unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDependencies();
  }, [currentAccount?.address, daoId, refreshCounter]);

  const handleUpgradeAll = async () => {
    if (!currentAccount?.address || !daoId) {
      toast.error("Please connect your wallet");
      return;
    }

    setIsUpgrading(true);
    const tx = new Transaction();

    try {
      await updateVerifiedDeps(currentAccount.address, daoId, tx);

      const result = await signAndExecute({
        suiClient,
        currentAccount,
        tx,
        signTransaction,
        options: { showEffects: true },
        toast,
      });

      handleTxResult(result, toast);
      refreshClient();
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unknown error occurred");
    } finally {
      setIsUpgrading(false);
    }
  };

  const renderDependencyList = (deps: EnhancedDep[]) => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-400"></div>
        </div>
      );
    }

    if (deps.length === 0) {
      return <div className="py-4 text-gray-500">No dependencies found</div>;
    }

    return (
      <div className="space-y-4">
        {deps.map((dep) => {
          const needsUpdate = dep.status && (
            dep.status.currentAddr !== dep.status.latestAddr || 
            dep.status.currentVersion !== dep.status.latestVersion
          );
          
          return (
            <div key={dep.addr} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 py-2 border-b last:border-b-0 border-teal-50">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-medium text-gray-900">{dep.name}</h4>
                </div>
                <p className="text-xs text-gray-500 break-all font-mono">Current: {dep.addr}</p>
                {needsUpdate && dep.status && (
                  <p className="text-xs text-gray-500 break-all font-mono">Latest: {dep.status.latestAddr}</p>
                )}
                <div className="flex gap-2 mt-1">
                  <p className="text-xs text-gray-400">Current v{dep.version}</p>
                  {needsUpdate && dep.status && (
                    <p className="text-xs text-teal-600">→ Latest v{dep.status.latestVersion}</p>
                  )}
                </div>
              </div>
              <Badge 
                variant={needsUpdate ? "destructive" : "default"} 
                className={`text-xs py-1.5 ${needsUpdate ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-teal-100 text-teal-700 hover:bg-teal-200'}`}
              >
                {needsUpdate ? 'Update Available' : 'Up to Date'}
              </Badge>
            </div>
          );
        })}
      </div>
    );
  };

  const hasUpdatesAvailable = coreDeps.some(dep => 
    dep.status && (
      dep.status.currentAddr !== dep.status.latestAddr || 
      dep.status.currentVersion !== dep.status.latestVersion
    )
  );

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Dependencies</h2>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 border-teal-200 text-teal-700 hover:bg-teal-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200"
                  onClick={() => router.push(`/daos/${daoId}/settings/requestDependencyConfig`)}
                  disabled={!hasAuthPower}
                >
                  <span className="text-lg leading-none">+</span> Add
                </Button>
              </span>
            </TooltipTrigger>
            {!hasAuthPower && (
              <TooltipContent className="bg-gray-900 text-white">
                <p>You need at least {authVotingPower.toString()} voting power to add dependencies. Current: {votingPower}</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>
      
      <Tabs defaultValue="core" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-lg">
          <TabsTrigger 
            value="core" 
            className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm"
          >
            Core ({coreDeps.length})
          </TabsTrigger>
          <TabsTrigger 
            value="external"
            className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm"
          >
            External ({externalDeps.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="core" className="mt-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Core Dependencies</h4>
                <p className="text-xs text-gray-500">Verified system dependencies</p>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button 
                        variant="default"
                        size="sm"
                        onClick={handleUpgradeAll}
                        disabled={isUpgrading || !hasUpdatesAvailable || !hasAuthPower}
                        className={`${isUpgrading || !hasUpdatesAvailable || !hasAuthPower ? 'bg-gray-100 text-gray-400' : 'bg-teal-600 hover:bg-teal-700'}`}
                      >
                        {isUpgrading ? 'Upgrading...' : 'Upgrade All'}
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className="bg-gray-900 text-white">
                    {!hasAuthPower ? (
                      <p>You need at least {authVotingPower.toString()} voting power to upgrade dependencies. Current: {votingPower}</p>
                    ) : !hasUpdatesAvailable ? (
                      "All core dependencies are up to date"
                    ) : (
                      "Upgrade all core dependencies to their latest versions"
                    )}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            {renderDependencyList(coreDeps)}
          </div>
        </TabsContent>
        
        <TabsContent value="external" className="mt-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-sm font-medium text-gray-900">External Dependencies</h4>
                <p className="text-xs text-gray-500">Third-party dependencies</p>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <Button
                        variant={unverifiedDepsAllowed ? "destructive" : "default"}
                        size="sm"
                        onClick={() => router.push(`/daos/${daoId}/settings/requestToggleUnverifiedDeps`)}
                        className={`${!hasAuthPower ? 'bg-gray-100 text-gray-400' : unverifiedDepsAllowed ? 'bg-red-600 hover:bg-red-700' : 'bg-teal-600 hover:bg-teal-700'}`}
                        disabled={!hasAuthPower}
                      >
                        {unverifiedDepsAllowed ? 'Disable unverified dependencies' : 'Enable unverified dependencies'}
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {!hasAuthPower && (
                    <TooltipContent className="bg-gray-900 text-white">
                      <p>You need at least {authVotingPower.toString()} voting power to manage unverified dependencies. Current: {votingPower}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            </div>
            {unverifiedDepsAllowed ? (
              renderDependencyList(externalDeps)
            ) : (
              <div className="py-6 text-center bg-gray-50 rounded-lg border border-gray-100">
                <p className="text-gray-500 text-sm">
                  Enable unverified dependencies to view external packages
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {!hasAuthPower && (
        <div className="mt-6">
          <Alert className="bg-yellow-50/50 border-yellow-100">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800 text-sm">
              You need at least {authVotingPower.toString()} voting power to manage dependencies. Current: {votingPower}. Stake more tokens to manage dependencies.
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
} 