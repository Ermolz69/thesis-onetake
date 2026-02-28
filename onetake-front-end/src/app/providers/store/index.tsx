import { ReactNode } from 'react';

export interface StoreProviderProps {
  children: ReactNode;
}

export const StoreProvider = ({ children }: StoreProviderProps) => {
  return <>{children}</>;
};
