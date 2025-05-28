import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StepProps } from "../helpers/types";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { InfoIcon, AlertCircle } from "lucide-react";
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

  // Validation checks
  const isMaxVotingPowerTooLow = formData.maxVotingPower < formData.authVotingPower;
  const isMinimumVotesTooHigh = formData.minimumVotes > formData.maxVotingPower;
  
  // Calculate display values for validation messages
  const getDisplayValue = (value: bigint) => {
    if (formData.coinDecimals !== undefined) {
      const divisor = BigInt(10) ** BigInt(formData.coinDecimals);
      return (value / divisor).toString();
    }
    return value.toString();
  };

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
          className={isMaxVotingPowerTooLow ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
        />
        
        {/* Validation Error Alert */}
        {isMaxVotingPowerTooLow && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertTitle className="text-red-800">Invalid Maximum Voting Power</AlertTitle>
            <AlertDescription className="text-red-700">
              Maximum voting power ({getDisplayValue(formData.maxVotingPower)}) cannot be lower than the minimum voting power required to create proposals ({getDisplayValue(formData.authVotingPower)}).
            </AlertDescription>
          </Alert>
        )}
        
        <Alert>
          <InfoIcon />
          <AlertTitle>Maximum Voting Power Limit</AlertTitle>
          <AlertDescription className="mt-2">
            <p>This limit prevents concentration of power by capping the maximum voting power any single address can have.</p>
            <ul className="list-disc pl-4 mt-2 space-y-1">
              <li>Helps maintain decentralization</li>
              <li>Prevents whale dominance in voting</li>
              <li>Must be at least {getDisplayValue(formData.authVotingPower)} (minimum power to create proposals)</li>
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
          className={isMinimumVotesTooHigh ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}
        />
        
        {/* Validation Error Alert */}
        {isMinimumVotesTooHigh && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertTitle className="text-red-800">Invalid Minimum Votes</AlertTitle>
            <AlertDescription className="text-red-700">
              Minimum votes required ({getDisplayValue(formData.minimumVotes)}) cannot be higher than the maximum voting power ({getDisplayValue(formData.maxVotingPower)}).
            </AlertDescription>
          </Alert>
        )}
        
        <Alert>
          <InfoIcon />
          <AlertTitle>Minimum Votes Threshold</AlertTitle>
          <AlertDescription className="mt-2">
            <p>This threshold ensures that proposals have sufficient participation to be considered valid.</p>
            <ul className="list-disc pl-4 mt-2 space-y-1">
              <li>Prevents proposals from passing with too little participation</li>
              <li>Ensures community engagement in decision-making</li>
              <li>Should be set based on your expected active voter base</li>
              <li>Cannot exceed the maximum voting power ({getDisplayValue(formData.maxVotingPower)})</li>
            </ul>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}; 