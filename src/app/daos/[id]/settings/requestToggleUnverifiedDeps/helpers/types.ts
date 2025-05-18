export interface ToggleUnverifiedFormData {
    proposalName: string;
    proposalDescription: string;
    executionDate: Date | null;
    expirationDate: Date | null;
    allowUnverifiedDeps: boolean;
  }
  
  export interface StepProps {
    formData: ToggleUnverifiedFormData;
    updateFormData: (data: Partial<ToggleUnverifiedFormData>) => void;
  }
  