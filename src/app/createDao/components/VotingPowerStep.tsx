import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StepProps } from "../helpers/types";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

export const VotingPowerStep: React.FC<StepProps> = ({ formData, updateFormData }) => {
  const handleVotingPowerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Convert to BigInt and ensure it's not negative
    const bigIntValue = BigInt(Math.max(0, parseInt(value) || 0));
    updateFormData({ authVotingPower: bigIntValue });
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
          value={formData.authVotingPower.toString()}
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