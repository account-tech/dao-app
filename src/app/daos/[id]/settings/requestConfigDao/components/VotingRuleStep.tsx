import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { StepProps } from "../helpers/types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useOriginalDaoConfig } from "../context/DaoConfigContext";
import { cn } from "@/lib/utils";

export const VotingRuleStep: React.FC<StepProps> = ({ formData, updateFormData }) => {
  const originalConfig = useOriginalDaoConfig();

  const handleVotingRuleChange = (value: string) => {
    updateFormData({ votingRule: value === "quadratic" ? 1 : 0 });
  };

  const isChanged = formData.votingRule !== originalConfig.votingRule;
  const isQuadratic = formData.votingRule === 1;
  const wasQuadratic = originalConfig.votingRule === 1;

  return (
    <div className="space-y-6">
      {/* Current Value Display */}
      <div className="space-y-2">
        <Label>Current Voting Rule</Label>
        <div className="p-4 bg-gray-50 rounded-lg border">
          <code className="text-sm">
            {originalConfig.votingRule === 1 ? "Quadratic Voting" : "Linear Voting"}
          </code>
        </div>
      </div>

      <div className="space-y-4">
        <Label>Select New Voting Rule</Label>
        <RadioGroup
          value={formData.votingRule === 1 ? "quadratic" : "linear"}
          onValueChange={handleVotingRuleChange}
          className="flex flex-col space-y-4"
        >
          <div className={cn(
            "flex items-start space-x-3 p-4 rounded-lg",
            !isQuadratic && "bg-gray-50/50"
          )}>
            <RadioGroupItem value="linear" id="linear" className="mt-1" />
            <div>
              <Label htmlFor="linear" className="font-medium">Linear Voting</Label>
              <p className="text-sm text-gray-500">
                Voting power is directly proportional to the number of tokens held.
                If you have 100 tokens, you get 100 votes.
              </p>
              {!isQuadratic && !wasQuadratic && (
                <p className="text-xs text-teal-600 mt-1">(Current DAO Config)</p>
              )}
            </div>
          </div>

          <div className={cn(
            "flex items-start space-x-3 p-4 rounded-lg",
            isQuadratic && "bg-gray-50/50"
          )}>
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
              {isQuadratic && wasQuadratic && (
                <p className="text-xs text-teal-600 mt-1">(Current DAO Config)</p>
              )}
            </div>
          </div>
        </RadioGroup>
      </div>

      {/* Warning when voting rule is changed */}
      {isChanged && (
        <Alert 
          variant="default" 
          className={cn(
            "border",
            isQuadratic 
              ? "bg-blue-50 text-blue-900 border-blue-200" 
              : "bg-yellow-50 text-yellow-900 border-yellow-200"
          )}
        >
          <AlertCircle className={cn(
            "h-4 w-4",
            isQuadratic ? "text-blue-600" : "text-yellow-600"
          )} />
          <AlertDescription>
            {isQuadratic ? (
              <>
                <p className="font-semibold">Switching to Quadratic Voting</p>
                <p className="mt-1">
                  This change will make voting power more equitable by reducing the influence of large token holders.
                  For example, a member with 100 tokens will now have 10 voting power instead of 100.
                </p>
              </>
            ) : (
              <>
                <p className="font-semibold">Switching to Linear Voting</p>
                <p className="mt-1">
                  This change will make voting power directly proportional to token holdings.
                  Large token holders will have more influence in governance decisions.
                </p>
              </>
            )}
            <p className="mt-2 text-sm font-medium">
              Note: This change will affect all future proposals and may significantly impact your DAO's governance dynamics.
            </p>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}; 