import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StepProps } from "../helpers/types";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { InfoIcon, AlertCircle } from "lucide-react";
import { useOriginalDaoConfig } from "../context/DaoConfigContext";
import { formatBigInt } from "@/utils/GlobalHelpers";
import { cn } from "@/lib/utils";

export const AuthVotingPowerStep: React.FC<StepProps> = ({ formData, updateFormData }) => {
  const originalConfig = useOriginalDaoConfig();

  const handleVotingPowerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Convert to BigInt and ensure it's not negative
    const bigIntValue = BigInt(Math.max(0, parseInt(value) || 0));
    updateFormData({ authVotingPower: bigIntValue });
  };

  // Calculate the difference percentage for warning messages
  const calculatePercentageChange = () => {
    const original = Number(originalConfig.authVotingPower);
    const new_value = Number(formData.authVotingPower);
    if (original === 0) return new_value > 0 ? 100 : 0;
    return ((new_value - original) / original) * 100;
  };

  const percentageChange = calculatePercentageChange();
  const isIncreased = formData.authVotingPower > originalConfig.authVotingPower;
  const isChanged = formData.authVotingPower !== originalConfig.authVotingPower;

  return (
    <div className="space-y-6">
      {/* Current Value Display */}
      <div className="space-y-2">
        <Label>Current Authentication Voting Power</Label>
        <div className="p-4 bg-gray-50 rounded-lg border">
          <code className="text-sm">
            {formatBigInt(originalConfig.authVotingPower)}
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
        </AlertDescription>
      </Alert>

      {/* Contextual Warning based on change */}
      {isChanged && (
        <Alert 
          variant="default" 
          className={cn(
            "border",
            isIncreased 
              ? "bg-yellow-50 text-yellow-900 border-yellow-200" 
              : "bg-red-50 text-red-900 border-red-200"
          )}
        >
          <AlertCircle className={cn(
            "h-4 w-4",
            isIncreased ? "text-yellow-600" : "text-red-600"
          )} />
          <AlertDescription>
            {isIncreased ? (
              <>
                <p className="font-semibold">Increasing voting power by {Math.abs(percentageChange).toFixed(1)}%</p>
                <p className="mt-1">This will make it harder for members to participate in governance. 
                Ensure this aligns with your DAO's inclusivity goals.</p>
              </>
            ) : (
              <>
                <p className="font-semibold">Decreasing voting power by {Math.abs(percentageChange).toFixed(1)}%</p>
                <p className="mt-1">This will make it easier for members to participate in governance. 
                Consider security implications of lowering the threshold.</p>
              </>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}; 