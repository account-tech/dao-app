import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useDaoClient } from "@/hooks/useDaoClient";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Search } from "lucide-react";
import { Dep } from "@account.tech/core";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AddDependencyStepProps {
  formData: {
    selectedDeps: string[];
    removedDeps: string[];
    currentDeps: string[];
  };
  updateFormData: (data: Partial<{
    selectedDeps: string[];
    removedDeps: string[];
    currentDeps: string[];
  }>) => void;
  currentDeps: Dep[];
}

export const AddDependencyStep: React.FC<AddDependencyStepProps> = ({
  formData,
  updateFormData,
  currentDeps: initialDeps,
}) => {
  const params = useParams();
  const daoId = params.id as string;
  const [searchQuery, setSearchQuery] = useState("");
  const [unverifiedDeps, setUnverifiedDeps] = useState<Dep[]>([]);
  const [verifiedDeps, setVerifiedDeps] = useState<Dep[]>([]);
  const [daoDeps, setDaoDeps] = useState<Dep[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unverifiedDepsAllowed, setUnverifiedDepsAllowed] = useState(false);
  const [externalPackage, setExternalPackage] = useState({
    name: "",
    version: "",
    addr: ""
  });

  const currentAccount = useCurrentAccount();
  const { getUnverifiedDeps, getVerifiedDeps, getDaoDeps, getunverifiedDepsAllowedBool } = useDaoClient();

  useEffect(() => {
    const fetchDependencies = async () => {
      if (!currentAccount?.address || !daoId) {
        setIsLoading(false);
        return;
      }

      try {
        const [unverified, verified, dao, depsAllowed] = await Promise.all([
          getUnverifiedDeps(currentAccount.address, daoId),
          getVerifiedDeps(currentAccount.address, daoId),
          getDaoDeps(currentAccount.address, daoId),
          getunverifiedDepsAllowedBool(currentAccount.address, daoId)
        ]);

        setUnverifiedDeps(unverified);
        setVerifiedDeps(verified);
        setDaoDeps(dao);
        setUnverifiedDepsAllowed(depsAllowed);

        // Initialize currentDeps if not already set
        // The order is crucial: verified deps first (maintaining DAO order), then unverified deps
        if (!formData.currentDeps.length) {
          const verifiedDepStrings = verified.map(dep => `${dep.name}:${dep.addr}:${dep.version}`);
          const unverifiedDepStrings = unverified.map(dep => `${dep.name}:${dep.addr}:${dep.version}`);
          const allCurrentDeps = [...verifiedDepStrings, ...unverifiedDepStrings];
          
          updateFormData({
            currentDeps: allCurrentDeps,
            selectedDeps: allCurrentDeps, // Start with all current deps selected
            removedDeps: []
          });
        }
      } catch (error) {
        console.error('Error fetching dependencies:', error);
        toast.error("Error fetching dependencies", {
          description: error instanceof Error ? error.message : "Unknown error occurred"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDependencies();
  }, [currentAccount?.address, daoId]);

  const handleDependencyToggle = (dep: Dep | { name: string; addr: string; version: string }) => {
    const depString = `${dep.name}:${dep.addr}:${dep.version}`;
    
    // Check if this is a verified dependency - if so, don't allow changes
    const isVerifiedDep = verifiedDeps.some(vDep => 
      `${vDep.name}:${vDep.addr}:${vDep.version}` === depString
    );
    
    if (isVerifiedDep) {
      toast.error("Cannot modify verified dependency", {
        description: "Verified dependencies are immutable and cannot be changed."
      });
      return;
    }
    
    const isCurrentDep = formData.currentDeps.includes(depString);
    const isSelected = formData.selectedDeps.includes(depString);
    
    let newSelectedDeps = [...formData.selectedDeps];
    let newRemovedDeps = [...formData.removedDeps];

    if (isCurrentDep) {
      // Handling existing dependency
      if (isSelected) {
        // Remove from selected and add to removed
        newSelectedDeps = newSelectedDeps.filter(d => d !== depString);
        newRemovedDeps.push(depString);
      } else {
        // Add back to selected and remove from removed
        newSelectedDeps.push(depString);
        newRemovedDeps = newRemovedDeps.filter(d => d !== depString);
      }
    } else {
      // Handling new dependency
      if (isSelected) {
        // Simply remove from selected deps if it's a new dependency
        newSelectedDeps = newSelectedDeps.filter(d => d !== depString);
      } else {
        // Add to selected deps if it's a new dependency
        newSelectedDeps.push(depString);
      }
    }
    
    updateFormData({
      selectedDeps: newSelectedDeps,
      removedDeps: newRemovedDeps
    });
  };

  const filteredUnverifiedDeps = unverifiedDeps.filter(dep =>
    dep.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dep.addr.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getDependencyStatus = (dep: { name: string; addr: string; version: string | number }) => {
    const depString = `${dep.name}:${dep.addr}:${dep.version}`;
    
    // Check if this is a verified dependency
    const isVerifiedDep = verifiedDeps.some(vDep => 
      `${vDep.name}:${vDep.addr}:${vDep.version}` === depString
    );
    
    if (isVerifiedDep) return 'verified';
    
    const isInstalled = formData.currentDeps.includes(depString);
    const isSelected = formData.selectedDeps.includes(depString);
    const isRemoved = formData.removedDeps.includes(depString);

    if (isInstalled && isRemoved) return 'marked-for-removal';
    if (isInstalled) return 'installed';
    if (!isInstalled && isSelected) return 'new';
    return 'available';
  };

  const handleAddExternalPackage = () => {
    if (!externalPackage.name || !externalPackage.version || !externalPackage.addr) {
      toast.error("Missing fields", {
        description: "Please fill in all fields"
      });
      return;
    }

    const depString = `${externalPackage.name}:${externalPackage.addr}:${externalPackage.version}`;
    
    // Add to selected deps if not already there
    if (!formData.selectedDeps.includes(depString)) {
      updateFormData({
        selectedDeps: [...formData.selectedDeps, depString]
      });
    }

    // Reset form
    setExternalPackage({
      name: "",
      version: "",
      addr: ""
    });

    toast.success("Package added", {
      description: "The package has been added to your selection"
    });
  };

  const allExternalPackages = [...new Set([
    ...formData.currentDeps.filter(dep => {
      const isUnverified = !unverifiedDeps.some(v => 
        `${v.name}:${v.addr}:${v.version}` === dep
      );
      const isVerified = !verifiedDeps.some(v => 
        `${v.name}:${v.addr}:${v.version}` === dep
      );
      return isUnverified && isVerified; // Only include if it's neither unverified nor verified (i.e., external)
    }),
    ...formData.selectedDeps.filter(dep => {
      const isUnverified = !unverifiedDeps.some(v => 
        `${v.name}:${v.addr}:${v.version}` === dep
      );
      const isVerified = !verifiedDeps.some(v => 
        `${v.name}:${v.addr}:${v.version}` === dep
      );
      return isUnverified && isVerified; // Only include if it's neither unverified nor verified (i.e., external)
    })
  ])];

  if (!unverifiedDepsAllowed) {
    return (
      <div className="space-y-6">
        <h2 className="text-lg font-medium">Unverified Dependencies</h2>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Unverified dependencies are currently disabled. You need to enable unverified dependencies in the settings first.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium">Manage Unverified Dependencies</h2>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search unverified dependencies..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Verified Dependencies (Read-only) */}
      <div className="space-y-4">
        <h3 className="font-medium">Core DAO Dependencies (Verified)</h3>
        <p className="text-sm text-gray-600">These dependencies are verified and cannot be modified. They maintain the core functionality of your DAO.</p>
        {isLoading ? (
          <div className="py-4 text-center text-gray-500">Loading verified dependencies...</div>
        ) : verifiedDeps.length === 0 ? (
          <div className="py-4 text-center text-gray-500">No verified dependencies found</div>
        ) : (
          <div className="space-y-4">
            {verifiedDeps.map((dep) => (
              <div
                key={dep.addr}
                className="p-4 rounded-lg border border-blue-200 bg-blue-50"
              >
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 mt-0.5 flex items-center justify-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">
                      {dep.name}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      <div>Version {dep.version}</div>
                      <div className="break-all">{dep.addr}</div>
                    </div>
                    <div className="mt-2 text-xs text-blue-600">
                      Verified • Cannot be modified
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Existing Unverified Dependencies */}
      <div className="space-y-4">
        <h3 className="font-medium">Available Unverified Dependencies</h3>
        {isLoading ? (
          <div className="py-4 text-center text-gray-500">Loading unverified dependencies...</div>
        ) : filteredUnverifiedDeps.length === 0 ? (
          <div className="py-4 text-center text-gray-500">No unverified dependencies found</div>
        ) : (
          <div className="space-y-4">
            {filteredUnverifiedDeps.map((dep) => {
              const status = getDependencyStatus(dep);
              const depString = `${dep.name}:${dep.addr}:${dep.version}`;
              const isSelected = formData.selectedDeps.includes(depString);
              const isVerified = status === 'verified';

              return (
                <div
                  key={dep.addr}
                  className={`p-4 rounded-lg border ${
                    status === 'verified' ? 'border-blue-200 bg-blue-50' :
                    status === 'marked-for-removal' ? 'border-red-200 bg-red-50' :
                    status === 'installed' ? 'border-gray-200 bg-gray-50' :
                    status === 'new' ? 'border-green-200 bg-green-50' :
                    'border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id={dep.addr}
                      checked={isSelected}
                      onCheckedChange={() => handleDependencyToggle(dep)}
                      disabled={isVerified}
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor={dep.addr}
                        className={`text-sm font-medium ${isVerified ? 'cursor-default' : 'cursor-pointer'}`}
                      >
                        {dep.name}
                      </Label>
                      <div className="mt-1 text-xs text-gray-500">
                        <div>Version {dep.version}</div>
                        <div className="break-all">{dep.addr}</div>
                      </div>
                      {status === 'verified' && (
                        <div className="mt-2 text-xs text-blue-600">
                          Verified • Cannot be modified
                        </div>
                      )}
                      {status === 'installed' && !isVerified && (
                        <div className="mt-2 text-xs text-gray-500">
                          Currently installed
                        </div>
                      )}
                      {status === 'marked-for-removal' && (
                        <div className="mt-2 text-xs text-red-500">
                          Marked for removal
                        </div>
                      )}
                      {status === 'new' && (
                        <div className="mt-2 text-xs text-green-500">
                          New dependency
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add External Package Section */}
      <div className="space-y-4">
        <h3 className="font-medium">Add External Package</h3>
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="packageName">Package Name *</Label>
            <Input
              id="packageName"
              placeholder="Enter package name"
              value={externalPackage.name}
              onChange={(e) => setExternalPackage(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="version">Version *</Label>
            <Input
              id="version"
              placeholder="Enter version (e.g. 1.0.0)"
              value={externalPackage.version}
              onChange={(e) => setExternalPackage(prev => ({ ...prev, version: e.target.value }))}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="address">Address *</Label>
            <Input
              id="address"
              placeholder="Enter package address"
              value={externalPackage.addr}
              onChange={(e) => setExternalPackage(prev => ({ ...prev, addr: e.target.value }))}
            />
          </div>

          <Button 
            onClick={handleAddExternalPackage}
            className="mt-2"
          >
            Add Package
          </Button>
        </div>

        {/* Show external packages */}
        {allExternalPackages.length > 0 && (
          <div className="mt-4 space-y-4">
            <h4 className="font-medium">Added External Packages:</h4>
            <div className="space-y-2">
              {allExternalPackages.map(dep => {
                const [name, addr, version] = dep.split(':');
                const status = getDependencyStatus({ name, addr, version });
                const isSelected = formData.selectedDeps.includes(dep);
                const isVerified = status === 'verified';
                
                return (
                  <div key={dep} className={`p-4 rounded-lg border ${
                    status === 'marked-for-removal' ? 'border-red-200 bg-red-50' :
                    status === 'installed' ? 'border-gray-200 bg-gray-50' :
                    status === 'new' ? 'border-green-200 bg-green-50' :
                    status === 'verified' ? 'border-blue-200 bg-blue-50' :
                    'border-gray-200'
                  }`}>
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id={addr}
                        checked={isSelected}
                        onCheckedChange={() => handleDependencyToggle({ 
                          name, 
                          addr, 
                          version: version
                        })}
                        disabled={status === 'verified'}
                      />
                      <div className="flex-1">
                        <Label
                          htmlFor={addr}
                          className={`text-sm font-medium ${status === 'verified' ? 'cursor-default' : 'cursor-pointer'}`}
                        >
                          {name}
                        </Label>
                        <div className="mt-1 text-xs text-gray-500">
                          <div>Version {version}</div>
                          <div className="break-all">{addr}</div>
                        </div>
                        {status === 'verified' && (
                          <div className="mt-2 text-xs text-blue-600">
                            Verified • Cannot be modified
                          </div>
                        )}
                        {status === 'installed' && !isVerified && (
                          <div className="mt-2 text-xs text-gray-500">
                            Currently installed
                          </div>
                        )}
                        {status === 'marked-for-removal' && (
                          <div className="mt-2 text-xs text-red-500">
                            Marked for removal
                          </div>
                        )}
                        {status === 'new' && (
                          <div className="mt-2 text-xs text-green-500">
                            New external package
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 