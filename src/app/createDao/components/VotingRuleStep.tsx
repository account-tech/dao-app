import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { StepProps } from "../helpers/types";

export const VotingRuleStep: React.FC<StepProps> = ({ formData, updateFormData }) => {
  const handleVotingRuleChange = (value: string) => {
    updateFormData({ votingRule: value === "quadratic" ? 1 : 0 });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Label>Select Voting Rule Type</Label>
        <RadioGroup
          value={formData.votingRule === 1 ? "quadratic" : "linear"}
          onValueChange={handleVotingRuleChange}
          className="flex flex-col space-y-4"
        >
          <div className="flex items-start space-x-3">
            <RadioGroupItem value="linear" id="linear" className="mt-1" />
            <div>
              <Label htmlFor="linear" className="font-medium">Linear Voting</Label>
              <p className="text-sm text-gray-500">
                Voting power is directly proportional to the number of tokens held.
                If you have 100 tokens, you get 100 votes.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <RadioGroupItem value="quadratic" id="quadratic" className="mt-1" />
            <div>
              <Label htmlFor="quadratic" className="font-medium">Quadratic Voting</Label>
              <p className="text-sm text-gray-500">
                Voting power is the square root of tokens held.
                If you have 100 tokens, you get 10 votes.
                This helps prevent large token holders from having too much influence.
              </p>
            </div>
          </div>
        </RadioGroup>
      </div>
    </div>
  );
}; 