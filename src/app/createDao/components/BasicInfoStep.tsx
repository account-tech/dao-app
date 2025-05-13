import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StepProps } from "../helpers/types";

export const BasicInfoStep: React.FC<StepProps> = ({ formData, updateFormData }) => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name" className="flex items-center gap-1">
          DAO Name
          <span className="text-red-500">*</span>
          <span className="text-xs text-gray-500 ml-1">(required)</span>
        </Label>
        <Input
          id="name"
          placeholder="Enter DAO name..."
          value={formData.name}
          onChange={(e) => updateFormData({ name: e.target.value })}
          required
          className={!formData.name ? "border-red-200 focus:border-red-500" : ""}
        />
        {!formData.name && (
          <p className="text-sm text-red-500 mt-1">DAO name is required</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Describe your DAO..."
          value={formData.description}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateFormData({ description: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="image">Image URL</Label>
        <Input
          id="image"
          placeholder="Enter image URL..."
          value={formData.image}
          onChange={(e) => updateFormData({ image: e.target.value })}
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Social Networks</h3>
        
        <div className="space-y-2">
          <Label htmlFor="twitter">Twitter</Label>
          <Input
            id="twitter"
            placeholder="Twitter URL..."
            value={formData.twitter}
            onChange={(e) => updateFormData({ twitter: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="telegram">Telegram</Label>
          <Input
            id="telegram"
            placeholder="Telegram URL..."
            value={formData.telegram}
            onChange={(e) => updateFormData({ telegram: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="discord">Discord</Label>
          <Input
            id="discord"
            placeholder="Discord URL..."
            value={formData.discord}
            onChange={(e) => updateFormData({ discord: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="github">GitHub</Label>
          <Input
            id="github"
            placeholder="GitHub URL..."
            value={formData.github}
            onChange={(e) => updateFormData({ github: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            placeholder="Website URL..."
            value={formData.website}
            onChange={(e) => updateFormData({ website: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}; 