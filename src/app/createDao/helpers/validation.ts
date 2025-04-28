import { DaoFormData } from "./types";

export const validateStep = (step: number, formData: DaoFormData): boolean => {
  switch (step) {
    case 0: // SelectTypeOfDaoStep
      // Ensure name is present, daoType is 'coin', and coinType is defined and not empty
      return formData.daoType === 'coin' && !!formData.coinType;


    default:
      return false;
  }
};