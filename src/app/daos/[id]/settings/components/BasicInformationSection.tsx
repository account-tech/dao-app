import { DaoMetadata } from "@account.tech/dao";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Pencil } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useDaoClient } from "@/hooks/useDaoClient";
import { Transaction } from "@mysten/sui/transactions";
import { toast } from "sonner";
import { useCurrentAccount, useSuiClient, useSignTransaction } from "@mysten/dapp-kit";
import { handleTxResult, signAndExecute } from "@/utils/tx/Tx";
import { useDaoStore } from "@/store/useDaoStore";

interface BasicInformationSectionProps {
  dao: DaoMetadata;
  hasAuthPower: boolean;
  authVotingPower: string;
  userAddr: string;
  daoId: string;
}

interface EditableMetadata {
  name: string;
  description: string;
  image: string;
  twitter: string;
  telegram: string;
  discord: string;
  github: string;
  website: string;
}

const formatUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `https://${url}`;
};

export function BasicInformationSection({ 
  dao, 
  hasAuthPower, 
  authVotingPower,
  userAddr,
  daoId
}: BasicInformationSectionProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedData, setEditedData] = useState<EditableMetadata>({
    name: dao.name,
    description: dao.description,
    image: dao.image || '',
    twitter: dao.twitter || '',
    telegram: dao.telegram || '',
    discord: dao.discord || '',
    github: dao.github || '',
    website: dao.website || ''
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { modifyMetadata } = useDaoClient();
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const signTransaction = useSignTransaction();
  const { refreshClient } = useDaoStore();

  useEffect(() => {
    // Check if any field has changed
    const hasAnyChange = Object.keys(editedData).some(
      (key) => editedData[key as keyof EditableMetadata] !== (dao[key as keyof EditableMetadata] || '')
    );
    setHasChanges(hasAnyChange);
  }, [editedData, dao]);

  const handleInputChange = (field: keyof EditableMetadata, value: string) => {
    setEditedData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!currentAccount) {
      toast.error("No account connected");
      return;
    }

    setIsLoading(true);
    try {
      const tx = new Transaction();
      await modifyMetadata(
        tx,
        currentAccount.address,
        daoId,
        editedData.name,
        editedData.description,
        editedData.image,
        editedData.twitter,
        editedData.telegram,
        editedData.discord,
        editedData.github,
        editedData.website
      );

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
      setIsEditMode(false);
    } catch (error) {
      console.error("Error updating DAO metadata:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update DAO metadata");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 relative">
      <div className="absolute right-6 top-6">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`${!hasAuthPower ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-100'}`}
                  onClick={() => hasAuthPower && setIsEditMode(!isEditMode)}
                  disabled={!hasAuthPower}
                >
                  <Pencil className={`h-4 w-4 ${isEditMode ? 'text-teal-600' : 'text-gray-400'}`} />
                </Button>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {hasAuthPower 
                ? (isEditMode ? 'Disable edit mode' : 'Enable edit mode')
                : `You need ${authVotingPower} voting power to edit DAO metadata. Stake more tokens to gain editing rights.`}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <h2 className="text-xl font-semibold mb-6 text-gray-900 text-center">DAO Metadata</h2>
      <div className="space-y-6">
        {/* DAO Image */}
        <div className="flex justify-center">
          <div className="relative overflow-hidden border-4 border-white shadow-lg bg-white w-20 h-20 rounded-2xl">
            {(isEditMode ? editedData.image : dao.image) && 
             ((isEditMode ? editedData.image : dao.image)?.startsWith('/') || 
              (isEditMode ? editedData.image : dao.image)?.startsWith('http')) ? (
              <img
                src={isEditMode ? editedData.image : dao.image}
                alt={`${isEditMode ? editedData.name : dao.name} logo`}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                <span className="text-2xl">🏛️</span>
              </div>
            )}
          </div>
        </div>

        {/* Basic Info */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              DAO Name
            </label>
            <input
              type="text"
              value={isEditMode ? editedData.name : dao.name}
              onChange={(e) => isEditMode && handleInputChange('name', e.target.value)}
              disabled={!isEditMode}
              className="w-full px-3 py-2 border rounded-lg bg-gray-50 disabled:opacity-75"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={isEditMode ? editedData.description : dao.description}
              onChange={(e) => isEditMode && handleInputChange('description', e.target.value)}
              disabled={!isEditMode}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg bg-gray-50 disabled:opacity-75"
            />
          </div>
          {isEditMode && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image URL
              </label>
              <input
                type="text"
                value={editedData.image}
                onChange={(e) => handleInputChange('image', e.target.value)}
                placeholder="Enter image URL"
                className="w-full px-3 py-2 border rounded-lg bg-white"
              />
            </div>
          )}
        </div>

        {/* Social Links */}
        <div className="space-y-4 pt-4 border-t">
          <label className="block text-sm font-medium text-gray-700">
            Social Links
          </label>
          <div className="grid grid-cols-1 gap-4">
            {[
              { key: 'twitter', icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
              )},
              { key: 'discord', icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M13.545 2.907a13.2 13.2 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.2 12.2 0 0 0-3.658 0 8 8 0 0 0-.412-.833.05.05 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.04.04 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032q.003.022.021.037a13.3 13.3 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019q.463-.63.818-1.329a.05.05 0 0 0-.01-.059l-.018-.011a9 9 0 0 1-1.248-.595.05.05 0 0 1-.02-.066l.015-.019q.127-.095.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.05.05 0 0 1 .053.007q.121.1.248.195a.05.05 0 0 1-.004.085 8 8 0 0 1-1.249.594.05.05 0 0 0-.03.03.05.05 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.2 13.2 0 0 0 4.001-2.02.05.05 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.03.03 0 0 0-.02-.019m-8.198 7.307c-.789 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612m5.316 0c-.788 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612"/>
                </svg>
              )},
              { key: 'telegram', icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13"/><path d="M22 2L15 22L11 13L2 9L22 2z"/></svg>
              )},
              { key: 'github', icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
              )},
              { key: 'website', icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
              )}
            ].map(({ key, icon }) => (
              <div key={key} className="flex gap-2 items-center">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button 
                        className={`p-2 rounded-full transition-colors ${
                          (isEditMode ? editedData[key as keyof EditableMetadata] : dao[key as keyof DaoMetadata]) 
                            ? 'hover:bg-gray-100 text-gray-700' 
                            : 'text-gray-300'
                        }`}
                        onClick={() => {
                          const url = isEditMode 
                            ? editedData[key as keyof EditableMetadata] 
                            : dao[key as keyof DaoMetadata];
                          url && window.open(formatUrl(url), '_blank');
                        }}
                        disabled={!isEditMode && !dao[key as keyof DaoMetadata]}
                      >
                        {icon}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {(isEditMode ? editedData[key as keyof EditableMetadata] : dao[key as keyof DaoMetadata]) 
                        ? key.charAt(0).toUpperCase() + key.slice(1)
                        : `${key.charAt(0).toUpperCase() + key.slice(1)} not set`}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <input
                  type="text"
                  value={isEditMode ? editedData[key as keyof EditableMetadata] : (dao[key as keyof DaoMetadata] || '')}
                  onChange={(e) => isEditMode && handleInputChange(key as keyof EditableMetadata, e.target.value)}
                  disabled={!isEditMode}
                  placeholder={`Enter ${key} URL`}
                  className="flex-1 px-3 py-2 border rounded-lg bg-gray-50 disabled:opacity-75"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Save Button */}
        {isEditMode && (
          <div className="pt-6 border-t">
            <Button
              className="w-full bg-teal-600 hover:bg-teal-700"
              disabled={!hasChanges || isLoading}
              onClick={handleSave}
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
} 