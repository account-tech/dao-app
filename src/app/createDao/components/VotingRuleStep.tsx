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
          <div className="flex items-start space-x-3 p-4 rounded-lg bg-gray-50/50">
            <RadioGroupItem value="linear" id="linear" className="mt-1" />
            <div>
              <Label htmlFor="linear" className="font-medium">Linear Voting</Label>
              <p className="text-sm text-gray-500">
                Voting power is directly proportional to the number of tokens held.
                If you have 100 tokens, you get 100 votes.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-4 rounded-lg">
            <RadioGroupItem 
              value="quadratic" 
              id="quadratic" 
              className="mt-1"
              disabled={true}
            />
            <div>
              <div className="flex items-center gap-2">
                <Label htmlFor="quadratic" className="font-medium">Quadratic Voting</Label>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Coming Soon</span>
              </div>
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