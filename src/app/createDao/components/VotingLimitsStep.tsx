import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StepProps } from "../helpers/types";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";
import { useEffect, useState } from "react";

export const VotingLimitsStep: React.FC<StepProps> = ({ formData, updateFormData }) => {
  const [displayMaxVotingPower, setDisplayMaxVotingPower] = useState("0");
  const [displayMinimumVotes, setDisplayMinimumVotes] = useState("0");

  useEffect(() => {
    // When formData changes, update display values
    if (formData.coinDecimals !== undefined) {
      const divisor = BigInt(10) ** BigInt(formData.coinDecimals);
      const maxVotingDisplay = formData.maxVotingPower / divisor;
      const minVotesDisplay = formData.minimumVotes / divisor;
      setDisplayMaxVotingPower(maxVotingDisplay.toString());
      setDisplayMinimumVotes(minVotesDisplay.toString());
    }
  }, [formData.maxVotingPower, formData.minimumVotes, formData.coinDecimals]);

  const handleMaxVotingPowerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numValue = Math.max(0, parseInt(value) || 0);
    setDisplayMaxVotingPower(numValue.toString());

    // Convert to actual value with decimals
    if (formData.coinDecimals !== undefined) {
      const multiplier = BigInt(10) ** BigInt(formData.coinDecimals);
      const actualValue = BigInt(numValue) * multiplier;
      updateFormData({ maxVotingPower: actualValue });
    }
  };

  const handleMinimumVotesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numValue = Math.max(0, parseInt(value) || 0);
    setDisplayMinimumVotes(numValue.toString());

    // Convert to actual value with decimals
    if (formData.coinDecimals !== undefined) {
      const multiplier = BigInt(10) ** BigInt(formData.coinDecimals);
      const actualValue = BigInt(numValue) * multiplier;
      updateFormData({ minimumVotes: actualValue });
    }
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
          value={displayMaxVotingPower}
          onChange={handleMaxVotingPowerChange}
        />
        <Alert>
          <InfoIcon />
          <AlertTitle>Maximum Voting Power Limit</AlertTitle>
          <AlertDescription className="mt-2">
            <p>This limit prevents concentration of power by capping the maximum voting power any single address can have.</p>
            <ul className="list-disc pl-4 mt-2 space-y-1">
              <li>Helps maintain decentralization</li>
              <li>Prevents whale dominance in voting</li>
            </ul>
          </AlertDescription>
        </Alert>
      </div>

      <div className="space-y-2">
        <Label htmlFor="minimumVotes">Minimum Votes Required</Label>
        <Input
          id="minimumVotes"
          type="number"
          min="0"
          placeholder="Enter minimum votes required..."
          value={displayMinimumVotes}
          onChange={handleMinimumVotesChange}
        />
        <Alert>
          <InfoIcon />
          <AlertTitle>Minimum Votes Threshold</AlertTitle>
          <AlertDescription className="mt-2">
            <p>This threshold ensures that proposals have sufficient participation to be considered valid.</p>
            <ul className="list-disc pl-4 mt-2 space-y-1">
              <li>Prevents proposals from passing with too little participation</li>
              <li>Ensures community engagement in decision-making</li>
              <li>Should be set based on your expected active voter base</li>
            </ul>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}; 