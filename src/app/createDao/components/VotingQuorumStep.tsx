import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { StepProps } from "../helpers/types";

export const VotingQuorumStep: React.FC<StepProps> = ({ formData, updateFormData }) => {
  // Convert the SDK number to a percentage (0-100)
  const getCurrentPercentage = (value: bigint): number => {
    return Number(value) / 10000000; // Convert from 1e9 scale to percentage
  };

  // Convert percentage back to SDK number
  const getSDKValue = (percentage: number): bigint => {
    return BigInt(Math.floor(percentage * 10000000)); // Convert percentage to 1e9 scale
  };

  const handleQuorumChange = (value: number[]) => {
    updateFormData({ votingQuorum: getSDKValue(value[0]) });
  };

  const currentPercentage = getCurrentPercentage(formData.votingQuorum);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Label>Required Approval Threshold</Label>
        <div className="space-y-6">
          <Slider
            defaultValue={[currentPercentage]}
            max={100}
            min={0}
            step={1}
            onValueChange={handleQuorumChange}
          />
          <div className="text-center">
            <span className="text-2xl font-bold">{currentPercentage}%</span>
            <p className="text-sm text-gray-500 mt-2">
              For a proposal to pass, at least {currentPercentage}% of all votes must be "Yes" votes.<br/>
              For example, if a proposal receives 100 votes total, at least {currentPercentage} of them must be "Yes" votes for the proposal to pass.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}; 