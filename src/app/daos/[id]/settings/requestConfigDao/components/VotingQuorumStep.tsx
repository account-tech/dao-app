import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { StepProps } from "../helpers/types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useOriginalDaoConfig } from "../context/DaoConfigContext";
import { cn } from "@/lib/utils";

export const VotingQuorumStep: React.FC<StepProps> = ({ formData, updateFormData }) => {
  const originalConfig = useOriginalDaoConfig();

  // Convert the SDK number to a percentage (0-100)
  const getCurrentPercentage = (value: bigint): number => {
    const percentage = Number(value) / 10000000; // Convert from 1e9 scale to percentage
    return percentage < 1 ? 0 : percentage;
  };

  // Convert percentage back to SDK number
  const getSDKValue = (percentage: number): bigint => {
    return BigInt(Math.floor(percentage * 10000000)); // Convert percentage to 1e9 scale
  };

  const handleQuorumChange = (value: number[]) => {
    updateFormData({ votingQuorum: getSDKValue(value[0]) });
  };

  const currentPercentage = getCurrentPercentage(formData.votingQuorum);
  const originalPercentage = getCurrentPercentage(originalConfig.votingQuorum);
  const percentageChange = currentPercentage - originalPercentage;
  const isChanged = formData.votingQuorum !== originalConfig.votingQuorum;

  // Format percentage for display
  const formatPercentage = (value: number): string => {
    return value < 1 ? "0%" : `${Math.round(value)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Current Value Display */}
      <div className="space-y-2">
        <Label>Current Approval Threshold</Label>
        <div className="p-4 bg-gray-50 rounded-lg border">
          <code className="text-sm">
            {formatPercentage(originalPercentage)}
          </code>
        </div>
      </div>

      <div className="space-y-4">
        <Label>New Approval Threshold</Label>
        <div className="space-y-6">
          <Slider
            value={[currentPercentage]}
            max={100}
            min={0}
            step={1}
            onValueChange={handleQuorumChange}
            className="w-full"
          />
          <div className="text-center">
            <span className="text-2xl font-bold">{formatPercentage(currentPercentage)}</span>
            <p className="text-sm text-gray-500 mt-2">
              For a proposal to pass, at least {formatPercentage(currentPercentage)} of all votes must be "Yes" votes.<br/>
              For example, if a proposal receives 100 votes total, at least {currentPercentage < 1 ? "0" : Math.round(currentPercentage)} of them must be "Yes" votes for the proposal to pass.
            </p>
          </div>
        </div>
      </div>

      {/* Warning when quorum is changed */}
      {isChanged && (
        <Alert 
          variant="default" 
          className={cn(
            "border",
            percentageChange > 0
              ? "bg-blue-50 text-blue-900 border-blue-200"
              : "bg-yellow-50 text-yellow-900 border-yellow-200"
          )}
        >
          <AlertCircle className={cn(
            "h-4 w-4",
            percentageChange > 0 ? "text-blue-600" : "text-yellow-600"
          )} />
          <AlertDescription>
            <p className="font-semibold">
              {percentageChange > 0 ? "Increasing" : "Decreasing"} Approval Threshold by {Math.abs(percentageChange) < 1 ? "less than 1" : Math.abs(percentageChange).toFixed(1)}%
            </p>
            <p className="mt-1">
              {percentageChange > 0 ? (
                <>
                  A higher threshold means proposals will need stronger support to pass.
                  This promotes consensus but may make it harder to implement changes.
                </>
              ) : (
                <>
                  A lower threshold means proposals can pass with less support.
                  This makes changes easier but might reduce consensus requirements.
                </>
              )}
            </p>
            <p className="mt-2 text-sm">
              New threshold: {formatPercentage(currentPercentage)} (was {formatPercentage(originalPercentage)})
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Recommendations based on current value */}
      <Alert 
        variant="default" 
        className={cn(
          "border",
          currentPercentage < 1
            ? "bg-red-50 text-red-900 border-red-200"
            : currentPercentage < 50 
              ? "bg-yellow-50 text-yellow-900 border-yellow-200"
              : currentPercentage > 75 
                ? "bg-yellow-50 text-yellow-900 border-yellow-200" 
                : "bg-green-50 text-green-900 border-green-200"
        )}
      >
        <AlertCircle className={cn(
          "h-4 w-4",
          currentPercentage < 1
            ? "text-red-600"
            : currentPercentage < 50 || currentPercentage > 75 
              ? "text-yellow-600" 
              : "text-green-600"
        )} />
        <AlertDescription>
          {currentPercentage < 1 ? (
            <>
              <p className="font-semibold">Critical: No Approval Threshold</p>
              <p className="mt-1">
                Setting the threshold to 0% means proposals can pass without any support.
                This is extremely risky and not recommended for any DAO.
              </p>
            </>
          ) : currentPercentage < 50 ? (
            <>
              <p className="font-semibold">Low Approval Threshold Warning</p>
              <p className="mt-1">
                A threshold below 50% means proposals can pass without majority support.
                Consider if this aligns with your DAO's governance goals.
              </p>
            </>
          ) : currentPercentage > 75 ? (
            <>
              <p className="font-semibold">High Approval Threshold Warning</p>
              <p className="mt-1">
                A threshold above 75% may make it very difficult to pass proposals.
                Ensure your community can maintain this level of consensus.
              </p>
            </>
          ) : (
            <>
              <p className="font-semibold">Balanced Approval Threshold</p>
              <p className="mt-1">
                This threshold provides a good balance between consensus requirements
                and the ability to implement changes when needed.
              </p>
            </>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
}; 