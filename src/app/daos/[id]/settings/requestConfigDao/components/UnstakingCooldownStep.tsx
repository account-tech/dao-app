import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { StepProps } from "../helpers/types";
import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon, AlertCircle } from "lucide-react";
import { useOriginalDaoConfig } from "../context/DaoConfigContext";
import { cn } from "@/lib/utils";

// Constants for time conversion
const MILLISECONDS_PER_DAY = BigInt(24 * 60 * 60 * 1000);
const MILLISECONDS_PER_HOUR = BigInt(60 * 60 * 1000);
const MILLISECONDS_PER_MINUTE = BigInt(60 * 1000);

const formatDuration = (milliseconds: bigint): string => {
  const totalMinutes = Number(milliseconds) / Number(MILLISECONDS_PER_MINUTE);
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = Math.floor(totalMinutes % 60);
  
  const parts: string[] = [];
  
  if (days > 0) {
    parts.push(`${days} day${days !== 1 ? 's' : ''}`);
  }
  
  if (hours > 0 || days > 0) {
    parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
  }
  
  // Always include minutes
  parts.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
  
  return parts.join(', ');
};

export const UnstakingCooldownStep: React.FC<StepProps> = ({ formData, updateFormData }) => {
  const originalConfig = useOriginalDaoConfig();
  const [hasCooldown, setHasCooldown] = useState(formData.unstakingCooldown > BigInt(0));
  const [inputValue, setInputValue] = useState(() => {
    // Initialize input value from formData
    return (Number(formData.unstakingCooldown) / Number(MILLISECONDS_PER_DAY)).toString();
  });

  const handleCooldownChange = (value: string) => {
    const hasCD = value === "yes";
    setHasCooldown(hasCD);
    if (!hasCD) {
      updateFormData({ unstakingCooldown: BigInt(0) });
      setInputValue("0");
    }
  };

  const handleDaysChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    if (value && !isNaN(parseFloat(value))) {
      const days = parseFloat(value);
      const cooldownInMilliseconds = BigInt(Math.floor(Math.max(0, days) * 24 * 60 * 60 * 1000));
      updateFormData({ unstakingCooldown: cooldownInMilliseconds });
    } else {
      updateFormData({ unstakingCooldown: BigInt(0) });
    }
  };

  // Calculate the difference in days for warning messages
  const calculateDaysDifference = () => {
    const original = Number(originalConfig.unstakingCooldown) / Number(MILLISECONDS_PER_DAY);
    const new_value = Number(formData.unstakingCooldown) / Number(MILLISECONDS_PER_DAY);
    return new_value - original;
  };

  const daysDifference = calculateDaysDifference();
  const isIncreased = formData.unstakingCooldown > originalConfig.unstakingCooldown;
  const isChanged = formData.unstakingCooldown !== originalConfig.unstakingCooldown;
  const isRemoved = originalConfig.unstakingCooldown > BigInt(0) && formData.unstakingCooldown === BigInt(0);

  return (
    <div className="space-y-6">
      {/* Current Value Display */}
      <div className="space-y-2">
        <Label>Current Unstaking Cooldown</Label>
        <div className="p-4 bg-gray-50 rounded-lg border">
          <code className="text-sm">
            {formatDuration(originalConfig.unstakingCooldown)}
          </code>
        </div>
      </div>

      <div className="space-y-4">
        <Label>Do you want to modify the unstaking cooldown period?</Label>
        <RadioGroup
          value={hasCooldown ? "yes" : "no"}
          onValueChange={handleCooldownChange}
          className="flex flex-col space-y-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="yes" id="yes" />
            <Label htmlFor="yes">Yes, set a new cooldown period</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="no" id="no" />
            <Label htmlFor="no">No, remove cooldown period</Label>
          </div>
        </RadioGroup>
      </div>

      {hasCooldown && (
        <div className="space-y-2">
          <Label htmlFor="cooldownDays">New Cooldown Period</Label>
          <Input
            id="cooldownDays"
            type="number"
            min="0"
            step="0.01"
            placeholder="Enter number of days..."
            value={inputValue}
            onChange={handleDaysChange}
            className="font-mono"
          />
          {formData.unstakingCooldown > BigInt(0) && !isNaN(parseFloat(inputValue)) && (
            <p className="text-sm text-gray-500">
              New cooldown period will be: {formatDuration(formData.unstakingCooldown)}
            </p>
          )}
          <p className="text-sm text-gray-500">
            You can use decimal values (e.g., 0.5 for 12 hours, 0.042 for 1 hour, 0.021 for 30 minutes).
          </p>
        </div>
      )}

      {/* Contextual Warning based on change */}
      {isChanged && (
        <Alert 
          variant="default" 
          className={cn(
            "border",
            isRemoved 
              ? "bg-red-50 text-red-900 border-red-200"
              : isIncreased 
                ? "bg-yellow-50 text-yellow-900 border-yellow-200" 
                : "bg-blue-50 text-blue-900 border-blue-200"
          )}
        >
          <AlertCircle className={cn(
            "h-4 w-4",
            isRemoved 
              ? "text-red-600"
              : isIncreased 
                ? "text-yellow-600" 
                : "text-blue-600"
          )} />
          <AlertDescription>
            {isRemoved ? (
              <>
                <p className="font-semibold">Removing Cooldown Period</p>
                <p className="mt-1">
                  Removing the cooldown period will allow immediate withdrawals after unstaking.
                  This increases liquidity but may lead to more volatile token movements.
                </p>
              </>
            ) : isIncreased ? (
              <>
                <p className="font-semibold">
                  Increasing cooldown by {Math.abs(daysDifference).toFixed(2)} days
                </p>
                <p className="mt-1">
                  A longer cooldown period will make users wait {formatDuration(formData.unstakingCooldown - originalConfig.unstakingCooldown)} more
                  before withdrawing their assets. This improves DAO stability but reduces liquidity.
                </p>
              </>
            ) : (
              <>
                <p className="font-semibold">
                  Decreasing cooldown by {Math.abs(daysDifference).toFixed(2)} days
                </p>
                <p className="mt-1">
                  A shorter cooldown period will allow users to withdraw {formatDuration(originalConfig.unstakingCooldown - formData.unstakingCooldown)} sooner
                  after unstaking. This improves liquidity but might affect DAO stability.
                </p>
              </>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}; 