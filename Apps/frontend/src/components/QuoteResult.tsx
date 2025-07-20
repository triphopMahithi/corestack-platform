import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Calendar, Share2, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateQuotePDF } from '@/utils/pdfGenerator';

interface Promotion {
  id: string;
  name: string;
  description: string;
  type: 'general' | 'package-specific' | 'category';
  discountPercentage: number;
  packageId?: string;
  categoryId?: string;
}

interface CartEntry {
  id: string;
  packageName: string;
  startAge: number;
  endAge: number;
  premium: {
    finalPremium: number | null | undefined;
    annual: number;
  };
  dateAdded?: string;
}

interface QuoteResultProps {
  formData: {
    gender: string;
    currentAge: string;
    coverageAge: string;
    paymentFrequency: string;
    plans: string[];
  };
  premium: {
    monthly: number;
    quarterly: number;
    semiAnnual: number;
    annual: number;
    total: number;
  };
  selectedPlans: Array<{
    basePremium: number;
  }>;
  cartItems: CartEntry[];
  selectedPromotion: Promotion | null;
}

const QuoteResult: React.FC<QuoteResultProps> = ({
  formData,
  premium,
  selectedPlans,
  cartItems,
  selectedPromotion,
}) => {
  const { toast } = useToast();
  const genderText = formData.gender === 'male' ? 'ชาย' : 'หญิง';

  const generatePDF = async () => {
    toast({ title: 'กำลังสร้าง PDF', description: 'กรุณารอสักครู่...' });
    try {
      await generateQuotePDF('quote-content', 'insurance-quote');
      toast({ title: 'ดาวน์โหลดสำเร็จ', description: 'ใบเสนอราคาถูกบันทึกแล้ว' });
    } catch (error) {
      toast({ title: 'เกิดข้อผิดพลาด', description: 'ไม่สามารถสร้าง PDF ได้', variant: 'destructive' });
    }
  };

  const shareQuote = () => {
    if (navigator.share) {
      navigator.share({
        title: 'ใบเสนอราคาประกันภัย',
        text: `เบี้ยประกันรวม ${premium.annual.toLocaleString()} บาทต่อปี`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: 'คัดลอกลิงก์แล้ว', description: 'สามารถแชร์ลิงก์นี้ได้' });
    }
  };

  // ฟังก์ชันคำนวณส่วนลดตามโปรโมชั่น
  const calculateDiscount = (item: CartEntry, promotion: Promotion | null): number => {
    if (!promotion) return 0;
    const premiumValue = item.premium.finalPremium ?? 0;

    // โปรโมชั่นเฉพาะแพ็คเกจที่ตรงกับไอดีแพ็คเกจ
    if (promotion.type === 'package-specific' && promotion.packageId === item.id) {
      return premiumValue * (promotion.discountPercentage / 100);
    }
    // โปรโมชั่นทั่วไปลดได้ทุกแพ็คเกจ
    if (promotion.type === 'general') {
      return premiumValue * (promotion.discountPercentage / 100);
    }
    // โปรโมชั่นหมวดหมู่ (category) - ถ้าต้องการให้ลดตาม categoryId ให้ใส่เงื่อนไขเพิ่มเติมที่นี่

    return 0;
  };

  // รวมเบี้ยประกันแผนที่เลือก (basePremium)
// รวมเบี้ยประกันแผนที่เลือก (basePremium)
const totalPlanPremium = selectedPlans.reduce(
  (sum, plan) => sum + (plan?.basePremium ?? 0),
  0
);

// รวมเบี้ยประกันในตะกร้า หลังหักส่วนลดตามโปรโมชั่น
const totalCartPremium = cartItems.reduce((sum, item) => {
  const finalPremium = item?.premium?.finalPremium ?? item?.premium?.annual ?? 0;
  const discount = calculateDiscount(item, selectedPromotion);
  return sum + (finalPremium - discount);
}, 0);

// ยอดรวมสุทธิหลังหักส่วนลด
const discountedTotal = totalPlanPremium + totalCartPremium;

  // รวมส่วนลดทั้งหมด (เพื่อแสดงใน UI)
  const totalDiscount = cartItems.reduce((sum, item) => sum + calculateDiscount(item, selectedPromotion), 0);

  return (
    <div className="space-y-6 px-4 md:px-0">
      <div id="quote-content" className="bg-background">
        <Card className="shadow-xl border-2 border-brand-green/20 overflow-hidden">
          <div className="bg-gradient-to-r from-brand-green via-brand-green to-brand-green-dark p-6 text-white">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm">
                  <Building2 className="w-8 h-8 text-brand-green" />
                </div>
                <h2 className="text-2xl font-bold text-brand-green bg-white/90 px-3 py-1 rounded-lg">
                  ANAN IP CO., LTD.
                </h2>
              </div>
              <div className="text-right text-sm text-brand-green">
                <div>วันที่ออกใบเสนอราคา</div>
                <div className="text-right font-semibold text-brand-green">
                  {new Date().toLocaleDateString('th-TH')}
                </div>
              </div>
            </div>
          </div>

          <CardHeader className="bg-gradient-to-r from-brand-green-light to-brand-gold-light border-b border-brand-green/10">
            <CardTitle className="flex items-center gap-3 text-xl text-brand-green">
              <Calendar className="w-6 h-6" />
              ใบเสนอราคาเบี้ยประกัน
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            <div className="bg-brand-green/10 p-6 rounded-xl border border-brand-green/20">
              <h4 className="font-bold text-brand-green mb-4 text-lg flex items-center gap-2">
                <div className="w-1 h-6 bg-brand-green rounded-full"></div>
                ข้อมูลผู้เอาประกัน
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: 'เพศ:', value: genderText },
                  { label: 'อายุปัจจุบัน:', value: `${formData.currentAge} ปี` },
                  { label: 'ความคุ้มครองถึงอายุ:', value: `${formData.coverageAge} ปี` },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="bg-brand-green/10 text-brand-green p-4 rounded-lg shadow-sm border border-brand-green/20 text-center md:text-left transition-shadow hover:shadow-md"
                  >
                    <span className="text-sm font-semibold text-brand-gold">{item.label}</span>
                    <div className="text-xl font-bold mt-1">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {cartItems.length > 0 && (
              <div className="bg-brand-green/10 p-6 rounded-xl border border-brand-gold/20">
                <h4 className="font-bold text-brand-green mb-4 text-lg flex items-center gap-2">
                  <div className="w-1 h-6 bg-brand-gold rounded-full"></div>
                  แพ็กเกจเสริมที่เลือก
                </h4>
                <div className="space-y-3">
                  {cartItems.map((pkg, index) => {
                    const discount = calculateDiscount(pkg, selectedPromotion);
                    const finalPrice = (pkg.premium.finalPremium ?? 0) - discount;

                    return (
                      <div
                        key={index}
                        className="bg-brand-green/5 p-4 rounded-lg border border-brand-green/20 shadow-sm text-brand-green hover:shadow-md transition-all"
                      >
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                          <div>
                            <div className="font-bold text-lg">{pkg.packageName}</div>
                            <div className="text-sm text-brand-green/70 mt-1">
                              ช่วงอายุ: {pkg.startAge} - {pkg.endAge} ปี
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-brand-green font-bold text-lg">
                              ฿{premium.annual.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} บาท
                            </div>
                            {discount > 0 && (
                              <div className="text-green-600 text-sm">ส่วนลด: -{discount.toFixed(2)}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* แสดงส่วนลดรวมและยอดรวมสุทธิ */}
            {selectedPromotion && totalDiscount > 0 && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-300 text-green-800 font-semibold text-center">
                ใช้โปรโมชั่น: {selectedPromotion.name} ลดไปทั้งหมด ฿{totalDiscount.toFixed(2)}
              </div>
            )}

            <div className="bg-brand-green/5 p-8 rounded-lg border-2 border-brand-green/30 shadow-sm text-center">
              <h4 className="font-bold text-brand-green mb-6 text-xl border-b border-brand-green/20 pb-4">
                เบี้ยประกันรวมทั้งหมด
              </h4>
              <div className="text-sm text-brand-green/70 mb-2 font-medium">เบี้ยประกันรายปี</div>
              <div className="text-4xl font-bold text-brand-green mb-2">฿{discountedTotal.toLocaleString()}</div>
              <div className="text-sm text-brand-green/60">บาทต่อปี</div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col md:flex-row gap-4 mt-6">
          <Button
            onClick={generatePDF}
            className="w-full md:w-1/2 from-brand-green to-brand-green-dark hover:from-brand-green-dark hover:to-brand-green text-white h-14 text-lg font-medium shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            size="lg"
          >
            <Download className="w-5 h-5 mr-2" /> ดาวน์โหลด PDF
          </Button>
          <Button
            onClick={shareQuote}
            variant="outline"
            className="w-full md:w-1/2 border-2 border-brand-gold text-brand-gold hover:bg-gradient-to-r hover:from-brand-gold hover:to-brand-gold-dark hover:text-white h-14 text-lg font-medium shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            size="lg"
          >
            <Share2 className="w-5 h-5 mr-2" /> แชร์ใบเสนอราคา
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QuoteResult;
