import { Button } from '@/components/ui/button';
import { CheckCircle, Save } from 'lucide-react';
import { calculateTieredPremium, getPricingTiersFromPackage } from '@/utils/premiumCalculator';

interface Step3Props {
  selectedPackage: any;
  startAge: number;
  endAge: number;
  gender: 'male' | 'female';
  saved: boolean;
  onSave: () => void;
  goBack: () => void;
}

const Step3 = ({ selectedPackage, startAge, endAge, gender, saved, onSave, goBack }: Step3Props) => {
  
  const tiers = getPricingTiersFromPackage(selectedPackage, gender);
  const premium = calculateTieredPremium(startAge, endAge, tiers);

 return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-brand-green">สรุปผลการค้นหา</h4>
        <Button variant="outline" size="sm" onClick={goBack}>
          ย้อนกลับ
        </Button>
      </div>

      <div className="bg-green-50 border border-green-200 p-4 rounded-lg space-y-2">
        <h5 className="font-semibold text-green-800">เบี้ยประกันที่คำนวณได้</h5>
        <p className="text-sm text-green-700">
          แพ็กเกจที่เลือก: {selectedPackage.name} อายุสัญญาเริ่มต้นตั้งแต่({startAge}ถึง{endAge}ปี)
          </p>
        <p className="text-sm text-green-700">รายปี: ฿{premium.annual.toLocaleString()}</p>
        <p className="text-sm text-green-700">รายเดือน: ฿{premium.monthly.toLocaleString()}</p>
        <p className="text-sm text-green-700">รวมทุกปี: ฿{premium.total.toLocaleString()}</p>
      </div>

      <Button 
        onClick={onSave}
        className="brand-green text-white w-full"
        disabled={saved}
      >
        {saved ? (
          <>
            <CheckCircle className="w-4 h-4 mr-2" />
            บันทึกแล้ว
          </>
        ) : (
          <>
            <Save className="w-4 h-4 mr-2" />
            บันทึกข้อมูล
          </>
        )}
      </Button>
    </div>
  );
};

export default Step3;