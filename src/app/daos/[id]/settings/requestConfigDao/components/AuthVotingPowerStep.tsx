import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StepProps } from "../helpers/types";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

export const AuthVotingPowerStep: React.FC<StepProps> = ({ formData, updateFormData }) => {
  const handleVotingPowerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Convert to BigInt and ensure it's not negative
    const bigIntValue = BigInt(Math.max(0, parseInt(value) || 0));
    updateFormData({ authVotingPower: bigIntValue });
  };

  return (
    <div className="space-y-6">
      {/* Current Value Display */}
      <div className="space-y-2">
        <Label>Current Authentication Voting Power</Label>
        <div className="p-4 bg-gray-50 rounded-lg border">
          <code className="text-sm">
            {formData.authVotingPower.toString()}
          </code>
        </div>
      </div>

      {/* New Value Input */}
      <div className="space-y-2">
        <Label htmlFor="authVotingPower">New Authentication Voting Power</Label>
        <Input
          id="authVotingPower"
          type="number"
          min="0"
          placeholder="Enter new minimum voting power..."
          value={formData.authVotingPower.toString()}
          onChange={handleVotingPowerChange}
          className="font-mono"
        />
      </div>

      {/* Information Alert */}
      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>Authentication Voting Power Rules</AlertTitle>
        <AlertDescription className="mt-2 space-y-2">
          <p>The authentication voting power determines who can participate in key DAO actions:</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>Creating proposals</li>
            <li>Requesting configuration changes</li>
            <li>Other administrative actions</li>
          </ul>
          <p className="mt-2">This value is interpreted differently based on your voting rule:</p>
          <ul className="list-disc pl-4 space-y-1">
            <li><strong>Linear Rule:</strong> If you have 25 tokens, you have 25 voting power (1:1 ratio)</li>
            <li><strong>Quadratic Rule:</strong> If you have 25 tokens, you have 5 voting power (square root)</li>
          </ul>
          <p className="mt-2 text-yellow-600">
            Note: Setting this too high might restrict participation, while setting it too low might compromise security.
          </p>
        </AlertDescription>
      </Alert>

      {/* Warning if value is changed */}
      {formData.authVotingPower.toString() !== formData.authVotingPower.toString() && (
        <Alert variant="default" className="bg-yellow-50 text-yellow-900 border-yellow-200">
          <InfoIcon className="h-4 w-4 text-yellow-600" />
          <AlertDescription>
            Changing the authentication voting power will affect who can participate in key DAO actions.
            Make sure the new value aligns with your DAO's governance goals.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}; 