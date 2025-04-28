import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StepProps } from "../helpers/types";

export const VotingPowerStep: React.FC<StepProps> = ({ formData, updateFormData }) => {
  const handleVotingPowerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Convert to BigInt and ensure it's not negative
    const bigIntValue = BigInt(Math.max(0, parseInt(value) || 0));
    updateFormData({ authVotingPower: bigIntValue });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="authVotingPower">Minimum Voting Power</Label>
        <Input
          id="authVotingPower"
          type="number"
          min="0"
          placeholder="Enter minimum voting power..."
          value={formData.authVotingPower.toString()}
          onChange={handleVotingPowerChange}
        />
        <p className="text-sm text-gray-500">
          This is the minimum amount of voting power required to participate in the DAO.
        </p>
      </div>
    </div>
  );
}; 