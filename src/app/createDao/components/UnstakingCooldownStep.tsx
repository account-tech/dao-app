import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { StepProps } from "../helpers/types";
import { useState } from "react";

// Constants for time conversion
const MILLISECONDS_PER_DAY = BigInt(24 * 60 * 60 * 1000); // 86,400,000 milliseconds in a day
const MILLISECONDS_PER_HOUR = BigInt(60 * 60 * 1000); // 3,600,000 milliseconds in an hour
const MILLISECONDS_PER_MINUTE = BigInt(60 * 1000); // 60,000 milliseconds in a minute

/**
 * Formats a duration in milliseconds to a human-readable string, always including minutes
 * @param milliseconds Duration in milliseconds
 * @returns Formatted string like "2 days, 12 hours, 30 minutes" or "12 hours, 0 minutes"
 */
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
    setInputValue(value); // Update the input value directly

    // Only update the formData if we have a valid number
    if (value && !isNaN(parseFloat(value))) {
      const days = parseFloat(value);
      const cooldownInMilliseconds = BigInt(Math.floor(Math.max(0, days) * 24 * 60 * 60 * 1000));
      updateFormData({ unstakingCooldown: cooldownInMilliseconds });
    } else {
      updateFormData({ unstakingCooldown: BigInt(0) });
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Label>Do you want to set an unstaking cooldown period?</Label>
        <RadioGroup
          value={hasCooldown ? "yes" : "no"}
          onValueChange={handleCooldownChange}
          className="flex flex-col space-y-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="yes" id="yes" />
            <Label htmlFor="yes">Yes</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="no" id="no" />
            <Label htmlFor="no">No</Label>
          </div>
        </RadioGroup>
      </div>

      {hasCooldown && (
        <div className="space-y-2">
          <Label htmlFor="cooldownDays">Cooldown Period</Label>
          <Input
            id="cooldownDays"
            type="number"
            min="0"
            step="0.01"
            placeholder="Enter number of days..."
            value={inputValue}
            onChange={handleDaysChange}
          />
          {formData.unstakingCooldown > BigInt(0) && !isNaN(parseFloat(inputValue)) && (
            <p className="text-sm text-gray-500">
              Cooldown period: {formatDuration(formData.unstakingCooldown)}
            </p>
          )}
          <p className="text-sm text-gray-500">
            Users will need to wait this duration after unstaking before they can withdraw their assets.
            You can use decimal values (e.g., 0.5 for 12 hours, 0.042 for 1 hour, 0.021 for 30 minutes).
          </p>
        </div>
      )}
    </div>
  );
}; 