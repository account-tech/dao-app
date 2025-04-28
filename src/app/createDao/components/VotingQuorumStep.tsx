import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { StepProps } from "../helpers/types";

export const VotingQuorumStep: React.FC<StepProps> = ({ formData, updateFormData }) => {
  const handleQuorumChange = (value: number[]) => {
    // Convert percentage to actual voting power (e.g., 50% of maxVotingPower)
    const quorumValue = BigInt(Math.floor((value[0] / 100) * Number(formData.maxVotingPower)));
    updateFormData({ votingQuorum: quorumValue });
  };

  // Convert current quorum to percentage
  const currentPercentage = Math.floor(
    (Number(formData.votingQuorum) / Number(formData.maxVotingPower)) * 100
  );

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Label>Voting Quorum Percentage</Label>
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
              This is the minimum percentage of total voting power that must participate
              for a proposal to be valid. Current value: {formData.votingQuorum.toString()} 
              of {formData.maxVotingPower.toString()} total voting power.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}; 