import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StepProps } from "../helpers/types";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { InfoIcon, AlertCircle } from "lucide-react";
import { useOriginalDaoConfig } from "../context/DaoConfigContext";
import { cn } from "@/lib/utils";
import { formatBigInt } from "@/utils/GlobalHelpers";

export const VotingLimitsStep: React.FC<StepProps> = ({ formData, updateFormData }) => {
  const originalConfig = useOriginalDaoConfig();

  const handleMaxVotingPowerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const bigIntValue = BigInt(Math.max(0, parseInt(value) || 0));
    updateFormData({ maxVotingPower: bigIntValue });
  };

  const handleMinimumVotesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const bigIntValue = BigInt(Math.max(0, parseInt(value) || 0));
    updateFormData({ minimumVotes: bigIntValue });
  };

  // Calculate percentage changes for warnings
  const calculatePercentageChange = (newValue: bigint, originalValue: bigint) => {
    const original = Number(originalValue);
    const new_value = Number(newValue);
    if (original === 0) return new_value > 0 ? 100 : 0;
    return ((new_value - original) / original) * 100;
  };

  const maxVotingPowerChange = calculatePercentageChange(formData.maxVotingPower, originalConfig.maxVotingPower);
  const minimumVotesChange = calculatePercentageChange(formData.minimumVotes, originalConfig.minimumVotes);

  return (
    <div className="space-y-8">
      {/* Max Voting Power Section */}
      <div className="space-y-6">
        {/* Current Max Voting Power Display */}
        <div className="space-y-2">
          <Label>Current Maximum Voting Power</Label>
          <div className="p-4 bg-gray-50 rounded-lg border">
            <code className="text-sm">
              {formatBigInt(originalConfig.maxVotingPower)}
            </code>
          </div>
        </div>

        {/* New Max Voting Power Input */}
        <div className="space-y-2">
          <Label htmlFor="maxVotingPower">New Maximum Voting Power</Label>
          <Input
            id="maxVotingPower"
            type="number"
            min="0"
            placeholder="Enter new maximum voting power..."
            value={formData.maxVotingPower.toString()}
            onChange={handleMaxVotingPowerChange}
            className="font-mono"
          />
        </div>

        {/* Warning if max voting power is changed */}
        {formData.maxVotingPower !== originalConfig.maxVotingPower && (
          <Alert 
            variant="default" 
            className={cn(
              "border",
              maxVotingPowerChange > 0
                ? "bg-yellow-50 text-yellow-900 border-yellow-200"
                : "bg-blue-50 text-blue-900 border-blue-200"
            )}
          >
            <AlertCircle className={cn(
              "h-4 w-4",
              maxVotingPowerChange > 0 ? "text-yellow-600" : "text-blue-600"
            )} />
            <AlertDescription>
              <p className="font-semibold">
                {maxVotingPowerChange > 0 ? "Increasing" : "Decreasing"} Maximum Voting Power by {Math.abs(maxVotingPowerChange).toFixed(1)}%
              </p>
              <p className="mt-1">
                {maxVotingPowerChange > 0
                  ? "This will allow members to have more influence in voting, potentially leading to more concentrated power."
                  : "This will limit individual voting power more strictly, promoting more distributed decision-making."}
              </p>
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Minimum Votes Section */}
      <div className="space-y-6">
        {/* Current Minimum Votes Display */}
        <div className="space-y-2">
          <Label>Current Minimum Votes Required</Label>
          <div className="p-4 bg-gray-50 rounded-lg border">
            <code className="text-sm">
              {formatBigInt(originalConfig.minimumVotes)}
            </code>
          </div>
        </div>

        {/* New Minimum Votes Input */}
        <div className="space-y-2">
          <Label htmlFor="minimumVotes">New Minimum Votes Required</Label>
          <Input
            id="minimumVotes"
            type="number"
            min="0"
            placeholder="Enter new minimum votes required..."
            value={formData.minimumVotes.toString()}
            onChange={handleMinimumVotesChange}
            className="font-mono"
          />
        </div>

        {/* Warning if minimum votes is changed */}
        {formData.minimumVotes !== originalConfig.minimumVotes && (
          <Alert 
            variant="default" 
            className={cn(
              "border",
              minimumVotesChange > 0
                ? "bg-blue-50 text-blue-900 border-blue-200"
                : "bg-yellow-50 text-yellow-900 border-yellow-200"
            )}
          >
            <AlertCircle className={cn(
              "h-4 w-4",
              minimumVotesChange > 0 ? "text-blue-600" : "text-yellow-600"
            )} />
            <AlertDescription>
              <p className="font-semibold">
                {minimumVotesChange > 0 ? "Increasing" : "Decreasing"} Minimum Votes by {Math.abs(minimumVotesChange).toFixed(1)}%
              </p>
              <p className="mt-1">
                {minimumVotesChange > 0
                  ? "This will require more participation for proposals to be valid, ensuring broader community engagement but potentially making it harder to pass proposals."
                  : "This will make it easier for proposals to reach the minimum threshold, but might reduce the requirement for broad community participation."}
              </p>
            </AlertDescription>
          </Alert>
        )}

        {/* Information Alert */}
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertTitle>About Voting Limits</AlertTitle>
          <AlertDescription className="mt-2 space-y-2">
            <div>
              <p className="font-medium">Maximum Voting Power:</p>
              <ul className="list-disc pl-4 mt-1 space-y-1 text-sm">
                <li>Caps individual voting power to prevent dominance</li>
                <li>Helps maintain decentralized decision-making</li>
                <li>Consider your token distribution when setting this limit</li>
              </ul>
            </div>
            <div className="mt-4">
              <p className="font-medium">Minimum Votes Required:</p>
              <ul className="list-disc pl-4 mt-1 space-y-1 text-sm">
                <li>Ensures sufficient participation in proposals</li>
                <li>Prevents decisions with low engagement</li>
                <li>Should reflect your active voter base size</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}; 