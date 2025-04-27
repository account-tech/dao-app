import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StepProps } from "../helpers/types";

export const SelectTypeOfDaoStep: React.FC<StepProps> = ({ formData, updateFormData }) => {
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFormData({ teamName: e.target.value });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="teamName">Team Name</Label>
        <Input
          id="teamName"
          placeholder="Enter your team name"
          value={formData.teamName}
          onChange={handleNameChange}
        />
      </div>
    </div>
  );
};