export interface DaoFormData {
    teamName: string;
    members: string[];
    threshold: number;
  }
  
  export interface StepProps {
    formData: DaoFormData;
    updateFormData: (updates: Partial<DaoFormData>) => void;
  }