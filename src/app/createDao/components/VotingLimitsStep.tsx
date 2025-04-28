import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StepProps } from "../helpers/types";

export const VotingLimitsStep: React.FC<StepProps> = ({ formData, updateFormData }) => {
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

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="maxVotingPower">Maximum Voting Power</Label>
        <Input
          id="maxVotingPower"
          type="number"
          min="0"
          placeholder="Enter maximum voting power..."
          value={formData.maxVotingPower.toString()}
          onChange={handleMaxVotingPowerChange}
        />
        <p className="text-sm text-gray-500">
          This is the maximum amount of voting power that can be accumulated by a single address.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="minimumVotes">Minimum Votes Required</Label>
        <Input
          id="minimumVotes"
          type="number"
          min="0"
          placeholder="Enter minimum votes required..."
          value={formData.minimumVotes.toString()}
          onChange={handleMinimumVotesChange}
        />
        <p className="text-sm text-gray-500">
          This is the minimum number of votes required for a proposal to be considered valid.
        </p>
      </div>
    </div>
  );
}; 