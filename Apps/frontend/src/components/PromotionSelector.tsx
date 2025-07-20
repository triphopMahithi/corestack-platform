import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { usePromotion} from '@/contexts/PromotionContext';
import type { CartEntry,Promotion } from '@/lib/types';
import axios from 'axios';

const PromotionSelector = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const { selectedPromotion, setSelectedPromotion } = usePromotion();

  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        const response = await axios.get('http://localhost:8080/api/promotions');
        console.log('Fetched promotions:', response.data);

        if (Array.isArray(response.data)) {
          const mappedPromos = response.data.map((promo: any) => ({
            id: promo.ID || promo.id || promo._id || '',
            name: promo.Name || promo.name || '',
            description: promo.Description || promo.description || '',
            type:
              promo.Type === 'package'
                ? 'package-specific'
                : promo.Type === 'general'
                ? 'general'
                : promo.Type === 'category'
                ? 'category'
                : 'general',
            discountPercentage: promo.DiscountPercentage || promo.discountPercentage || 0,
            packageId: promo.PackageId || promo.packageId,
            categoryId: promo.CategoryId || promo.categoryId,
          }));
          setPromotions(mappedPromos);
        } else {
          console.error('Expected array but got:', response.data);
          setPromotions([]);
        }
      } catch (error) {
        console.error('Failed to fetch promotions:', error);
        setPromotions([]);
      }
    };
    fetchPromotions();
  }, []);

  // ป้องกันกรณี promotions ไม่ใช่ array
  const safePromotions = Array.isArray(promotions) ? promotions : [];

  // แบ่งหมวดหมู่โปรโมชั่น
  const groupedPromotions = {
    general: safePromotions.filter((p) => p.type === 'general'),
    packageSpecific: safePromotions.filter((p) => p.type === 'package-specific'),
    category: safePromotions.filter((p) => p.type === 'category'),
  };

  // ฟังก์ชัน render รายการโปรโมชั่น พร้อมไอคอนและปุ่มเลือก
  const renderPromoList = (label: string, icon: string, promos: Promotion[]) => (
    <div className="mb-4">
      <div className="font-semibold mb-2 text-lg flex items-center gap-2">
        <span>{icon}</span>
        <span>{label}</span>
      </div>
      {promos.length === 0 ? (
        <p className="text-gray-500 italic">ไม่มีโปรโมชั่น</p>
      ) : (
        promos.map((promo) => (
          <Button
            key={promo.id}
            variant={selectedPromotion?.id === promo.id ? 'secondary' : 'outline'}
            onClick={() => setSelectedPromotion(promo)}
            className="w-full mb-2 text-left flex justify-between items-center"
          >
            <span>
              {promo.name} - ลด {promo.discountPercentage}%
            </span>
            {selectedPromotion?.id === promo.id && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </Button>
        ))
      )}
    </div>
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <span>🎟️</span>
          {selectedPromotion ? `ใช้โปรโมชั่น: ${selectedPromotion.name}` : 'เลือกโปรโมชั่น'}
          {selectedPromotion && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>เลือกโปรโมชั่น</DialogTitle>
        </DialogHeader>

        {renderPromoList('โปรโมชั่นทั่วไป', '', groupedPromotions.general)}
        {renderPromoList('โปรโมชั่นเฉพาะแพ็คเกจ', '', groupedPromotions.packageSpecific)}
        {renderPromoList('โปรโมชั่นเฉพาะสัญญา', '', groupedPromotions.category)}

        <DialogFooter>
          <Button onClick={() => setSelectedPromotion(null)} variant="ghost" className="w-full">
            ล้างโปรโมชั่น
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PromotionSelector;
