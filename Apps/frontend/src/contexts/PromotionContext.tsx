import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Promotion } from '@/lib/types';

interface PromotionContextType {
  selectedPromotion: Promotion | null;
  setSelectedPromotion: (promo: Promotion | null) => void;
  availablePromotions: Promotion[];
  setAvailablePromotions: (promos: Promotion[]) => void;
}

const PromotionContext = createContext<PromotionContextType | undefined>(undefined);

export const PromotionProvider = ({ children }: { children: ReactNode }) => {
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
  const [availablePromotions, setAvailablePromotions] = useState<Promotion[]>([]);

  return (
    <PromotionContext.Provider
      value={{ selectedPromotion, setSelectedPromotion, availablePromotions, setAvailablePromotions }}
    >
      {children}
    </PromotionContext.Provider>
  );
};

export const usePromotion = () => {
  const context = useContext(PromotionContext);
  if (!context) throw new Error('usePromotion must be used within PromotionProvider');
  return context;
};
