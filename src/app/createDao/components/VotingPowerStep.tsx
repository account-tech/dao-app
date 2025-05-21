import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StepProps } from "../helpers/types";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";
import { useEffect, useState } from "react";

export const VotingPowerStep: React.FC<StepProps> = ({ formData, updateFormData }) => {
  const [displayValue, setDisplayValue] = useState("0");

  useEffect(() => {
    // When formData.authVotingPower changes, update display value
    // We need to account for the decimals when displaying
    if (formData.coinDecimals !== undefined) {
      const divisor = BigInt(10) ** BigInt(formData.coinDecimals);
      const displayNum = formData.authVotingPower / divisor;
      setDisplayValue(displayNum.toString());
    }
  }, [formData.authVotingPower, formData.coinDecimals]);

  const handleVotingPowerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numValue = Math.max(0, parseInt(value) || 0);
    setDisplayValue(numValue.toString());

    // Convert to actual value with decimals
    if (formData.coinDecimals !== undefined) {
      const multiplier = BigInt(10) ** BigInt(formData.coinDecimals);
      const actualValue = BigInt(numValue) * multiplier;
      updateFormData({ authVotingPower: actualValue });
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="authVotingPower">Authentication Voting Power</Label>
        <Input
          id="authVotingPower"
          type="number"
          min="0"
          placeholder="Enter minimum voting power..."
          value={displayValue}
          onChange={handleVotingPowerChange}
        />
        <Alert>
          <InfoIcon />
          <AlertTitle>Voting Power Rules</AlertTitle>
          <AlertDescription className="mt-2 space-y-2">
            <p>The authentication voting power determines who can participate in the key DAO actions. This value depends on the voting rule you choose:</p>
            <ul className="list-disc pl-4 space-y-1">
              <li><strong>Linear Rule:</strong> If you have 25 tokens, you have 25 voting power (1:1 ratio)</li>
              <li><strong>Quadratic Rule:</strong> If you have 25 tokens, you have 5 voting power (square root)</li>
            </ul>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}; 