export interface DependencyConfigFormData {
    proposalName: string;
    proposalDescription: string;
    votingStartDate: Date | null;
    votingEndDate: Date | null;
    executionDate: Date | null;
    expirationDate: Date | null;
    selectedDeps: string[];  // Array of dependency addresses
    currentDeps: string[];
    removedDeps: string[];
}

export interface StepProps {
    formData: DependencyConfigFormData;
    updateFormData: (data: Partial<DependencyConfigFormData>) => void;
}

export interface DependencyMember {
    address: string;
    name?: string;
    status?: 'pending-add' | 'pending-remove' | 'active';  // Status for UI display
} 