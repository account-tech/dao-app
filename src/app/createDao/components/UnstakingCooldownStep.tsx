import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { StepProps } from "../helpers/types";
import { useState } from "react";

// Constants for time conversion
const MILLISECONDS_PER_DAY = BigInt(24 * 60 * 60 * 1000); // 86,400,000 milliseconds in a day

export const UnstakingCooldownStep: React.FC<StepProps> = ({ formData, updateFormData }) => {
  const [hasCooldown, setHasCooldown] = useState(formData.unstakingCooldown > BigInt(0));

  const handleCooldownChange = (value: string) => {
    const hasCD = value === "yes";
    setHasCooldown(hasCD);
    if (!hasCD) {
      updateFormData({ unstakingCooldown: BigInt(0) });
    }
  };

  const handleDaysChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const days = parseInt(e.target.value) || 0;
    // Convert days to milliseconds
    const cooldownInMilliseconds = BigInt(Math.max(0, days)) * MILLISECONDS_PER_DAY;
    updateFormData({ unstakingCooldown: cooldownInMilliseconds });
  };

  // Convert milliseconds back to days for display
  const currentDays = Number(formData.unstakingCooldown) / Number(MILLISECONDS_PER_DAY);

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
          <Label htmlFor="cooldownDays">Cooldown Period (in days)</Label>
          <Input
            id="cooldownDays"
            type="number"
            min="0"
            placeholder="Enter number of days..."
            value={currentDays}
            onChange={handleDaysChange}
          />
          <p className="text-sm text-gray-500">
            Users will need to wait this many days after unstaking before they can withdraw their assets.
          </p>
        </div>
      )}
    </div>
  );
}; 