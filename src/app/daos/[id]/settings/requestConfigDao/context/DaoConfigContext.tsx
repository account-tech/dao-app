import { createContext, useContext, ReactNode } from 'react';
import { DaoConfigFormData } from '../helpers/types';

interface DaoConfigContextType {
  originalDaoConfig: DaoConfigFormData;
}

const DaoConfigContext = createContext<DaoConfigContextType | undefined>(undefined);

export function DaoConfigProvider({ 
  children, 
  originalConfig 
}: { 
  children: ReactNode;
  originalConfig: DaoConfigFormData;
}) {
  return (
    <DaoConfigContext.Provider value={{ originalDaoConfig: originalConfig }}>
      {children}
    </DaoConfigContext.Provider>
  );
}

export function useOriginalDaoConfig() {
  const context = useContext(DaoConfigContext);
  if (context === undefined) {
    throw new Error('useOriginalDaoConfig must be used within a DaoConfigProvider');
  }
  return context.originalDaoConfig;
} 