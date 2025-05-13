export interface DaoConfigFormData {
    proposalName: string;
    proposalDescription: string;
    executionDate: Date | null;
    expirationDate: Date | null;
}

export interface StepProps {
    formData: DaoConfigFormData;
    updateFormData: (data: Partial<DaoConfigFormData>) => void;
}
