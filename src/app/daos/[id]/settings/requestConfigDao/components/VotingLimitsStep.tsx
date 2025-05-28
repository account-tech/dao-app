import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StepProps } from "../helpers/types";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { InfoIcon, AlertCircle } from "lucide-react";
import { useOriginalDaoConfig } from "../context/DaoConfigContext";
import { cn } from "@/lib/utils";

export const VotingLimitsStep: React.FC<StepProps> = ({ formData, updateFormData }) => {
  const originalConfig = useOriginalDaoConfig();
  const decimals = formData.coinDecimals || 9;

  // Validation checks
  const isMaxVotingPowerTooLow = formData.maxVotingPower < formData.authVotingPower;
  const isMinimumVotesTooHigh = formData.minimumVotes > formData.maxVotingPower;
  
  // Helper function to format display values
  const getDisplayValue = (value: bigint) => {
    return (Number(value) / Math.pow(10, decimals)).toString();
  };

  const handleMaxVotingPowerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Convert user input to raw value with decimals
    const rawValue = BigInt(Math.floor(Math.max(0, parseFloat(value) || 0) * Math.pow(10, decimals)));
    updateFormData({ maxVotingPower: rawValue });
  };

  const handleMinimumVotesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Convert user input to raw value with decimals
    const rawValue = BigInt(Math.floor(Math.max(0, parseFloat(value) || 0) * Math.pow(10, decimals)));
    updateFormData({ minimumVotes: rawValue });
  };

  // Calculate percentage changes for warnings
  const calculatePercentageChange = (newValue: bigint, originalValue: bigint) => {
    const original = Number(originalValue) / Math.pow(10, decimals);
    const new_value = Number(newValue) / Math.pow(10, decimals);
    if (original === 0) return new_value > 0 ? 100 : 0;
    return ((new_value - original) / original) * 100;
  };

  const maxVotingPowerChange = calculatePercentageChange(formData.maxVotingPower, originalConfig.maxVotingPower);
  const minimumVotesChange = calculatePercentageChange(formData.minimumVotes, originalConfig.minimumVotes);

  // Format display values
  const displayOriginalMaxPower = getDisplayValue(originalConfig.maxVotingPower);
  const displayCurrentMaxPower = getDisplayValue(formData.maxVotingPower);
  const displayOriginalMinVotes = getDisplayValue(originalConfig.minimumVotes);
  const displayCurrentMinVotes = getDisplayValue(formData.minimumVotes);

  return (
    <div className="space-y-8">
      {/* Max Voting Power Section */}
      <div className="space-y-6">
        {/* Current Max Voting Power Display */}
        <div className="space-y-2">
          <Label>Current Maximum Voting Power</Label>
          <div className="p-4 bg-gray-50 rounded-lg border">
            <code className="text-sm">
              {displayOriginalMaxPower}
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
            value={displayCurrentMaxPower}
            onChange={handleMaxVotingPowerChange}
            className={cn(
              "font-mono",
              isMaxVotingPowerTooLow && "border-red-500 focus:border-red-500 focus:ring-red-500"
            )}
          />
          
          {/* Validation Error Alert for Max Voting Power */}
          {isMaxVotingPowerTooLow && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertTitle className="text-red-800">Invalid Maximum Voting Power</AlertTitle>
              <AlertDescription className="text-red-700">
                Maximum voting power ({getDisplayValue(formData.maxVotingPower)}) cannot be lower than the minimum voting power required to create proposals ({getDisplayValue(formData.authVotingPower)}).
              </AlertDescription>
            </Alert>
          )}
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
              {displayOriginalMinVotes}
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
            value={displayCurrentMinVotes}
            onChange={handleMinimumVotesChange}
            className={cn(
              "font-mono",
              isMinimumVotesTooHigh && "border-red-500 focus:border-red-500 focus:ring-red-500"
            )}
          />
          
          {/* Validation Error Alert for Minimum Votes */}
          {isMinimumVotesTooHigh && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertTitle className="text-red-800">Invalid Minimum Votes</AlertTitle>
              <AlertDescription className="text-red-700">
                Minimum votes required ({getDisplayValue(formData.minimumVotes)}) cannot be higher than the maximum voting power ({getDisplayValue(formData.maxVotingPower)}).
              </AlertDescription>
            </Alert>
          )}
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
              <p className="font-medium">Maximum Voting Power ({displayCurrentMaxPower}):</p>
              <ul className="list-disc pl-4 mt-1 space-y-1 text-sm">
                <li>Caps individual voting power to prevent dominance</li>
                <li>Helps maintain decentralized decision-making</li>
                <li>Consider your token distribution when setting this limit</li>
                <li>Must be at least {getDisplayValue(formData.authVotingPower)} (minimum power to create proposals)</li>
              </ul>
            </div>
            <div className="mt-4">
              <p className="font-medium">Minimum Votes Required ({displayCurrentMinVotes}):</p>
              <ul className="list-disc pl-4 mt-1 space-y-1 text-sm">
                <li>Ensures sufficient participation in proposals</li>
                <li>Prevents decisions with low engagement</li>
                <li>Should reflect your active voter base size</li>
                <li>Cannot exceed the maximum voting power ({getDisplayValue(formData.maxVotingPower)})</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}; 