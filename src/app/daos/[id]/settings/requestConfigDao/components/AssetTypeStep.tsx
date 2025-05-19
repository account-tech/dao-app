'use client';

import { useEffect } from "react";
import { useSuiClient } from "@mysten/dapp-kit";
import { Label } from "@/components/ui/label";
import { getMultipleCoinDecimals, getSimplifiedAssetType } from "@/utils/GlobalHelpers";
import { StepProps } from "../helpers/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";
import { useOriginalDaoConfig } from "../context/DaoConfigContext";

interface CoinOption {
  type: string;
  balance: string;
  decimals?: number;
  displayBalance?: string;
}

const trimAddress = (address: string, length: number = 10) => {
  if (address.length <= length * 2) return address;
  return `${address.slice(0, length)}...${address.slice(-length)}`;
};

export const AssetTypeStep: React.FC<StepProps> = ({ formData, updateFormData }) => {
  const originalConfig = useOriginalDaoConfig();
  const suiClient = useSuiClient();

  useEffect(() => {
    const initializeDecimals = async () => {
      try {
        // Get decimals for the original asset type
        const originalAssetType = getSimplifiedAssetType(originalConfig.assetType);
        const decimalsMap = await getMultipleCoinDecimals([originalAssetType], suiClient);
        const decimals = decimalsMap.get(originalAssetType) || 9;
        
        // Set the asset type and its decimals
        updateFormData({ 
          assetType: originalConfig.assetType,
          coinDecimals: decimals 
        });
      } catch (error) {
        console.error('Error fetching coin decimals:', error);
      }
    };

    initializeDecimals();
  }, [suiClient]);

  return (
    <div className="space-y-6">
      {/* Asset Type Display */}
      <div className="space-y-2">
        <Label>Asset Type</Label>
        <div className="p-4 bg-gray-50 rounded-lg border">
          <code className="text-sm break-all">
            {trimAddress(originalConfig.assetType, 20)}
          </code>
        </div>
      </div>

      {/* Information Alert */}
      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>Asset Type Information</AlertTitle>
        <AlertDescription className="mt-2">
          The asset type cannot be changed for now, coming soon.
        </AlertDescription>
      </Alert>
    </div>
  );
}; 