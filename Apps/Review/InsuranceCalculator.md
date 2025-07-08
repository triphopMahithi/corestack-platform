## Outline

## Problem & Solution
'''
const availablePlans = plansByPackage[stepData.selectedPackage] || [];
        //const availablePlans = getSubPlanOptions(stepData.selectedPackage);
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-brand-green">เลือกแผนความคุ้มครอง</h4>
              <Button variant="outline" size="sm" onClick={goBackStep}>
                ย้อนกลับ
              </Button>
            </div>
            <p className="text-sm text-gray-600">แพ็กเกจที่เลือก: {stepData.selectedPackage}</p>
            <div className="grid gap-3">
              {availablePlans.map((plan) => (
                <Button
                  key={plan}
                  variant="outline"
                  className="h-auto p-4 text-left justify-start"
                  onClick={() => selectPlan(plan)}
                >
                  <Shield className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="text-sm">{plan}</span>
                </Button>
              ))}
            </div>
          </div>
        );
'''

ปัญหาที่พบ : เมื่อเราใช้งาน Multi-step flow ในขั้นตอนที่ 2 จะพบปัญหาราคาของแพ็คเกจไม่ขึ้น 
วิธีการแก้ไข :
    เริ่มต้นจาก
        ```
        const getSubPlanOptions = (packageName: string): any[] => {
        const pkg = packagesData.find(p => p.name === packageName);
        if (!pkg || !pkg.subPackages || !Array.isArray(pkg.subPackages)) return [];
  
            return pkg.subPackages.map((sub: any) => ({
            id: sub.id,
            name: sub.name
        }));
    };
  ```
  หากเราสังเกตจะพบว่าตัว getSubPlanOptions ไม่ได้ return ไม่ถูกต้องเนื่องจากไม่ได้ดึงข้อมูลเกี่ยวกับราคาออกมาเลย ซึ่งอาจจะสอดคล้องกับข้อมูลเก่า เราจะพบว่าไม่สอดของกับข้อมูลใน Database ที่เราได้ใช้ซึ่งทำให้พบปัญหาการไม่แสดงข้อมูล
hardcode.json'''
[
  { id: 'basic', name: 'Basic Plan' },
  { id: 'premium', name: 'Premium Plan' }
]
'''

db_collection.json'''
[
  {
    id: "11-15",
    ageFrom: 11,
    ageTo: 15,
    premium: 21600,
    label: "อายุ 11–15: ฿21,600"
  },
  ...
]
'''
แก้ไขโดยการดึงข้อมูลออกมาให้ครบตามที่เราต้องการ
'''

const getPlanOptionsFromPricing = (packageName: string): { label: string }[] => {
  const pkg = packagesData.find(p => p.name === packageName);
  if (!pkg || !Array.isArray(pkg.pricing)) return [];

  const gender = formData.gender === 'male' ? 'male' : 'female'; // fallback เป็น 'female' ก็ได้

  return pkg.pricing.map((p: any) => {
    const ageLabel = `อายุ ${p.ageFrom} ถึง ${p.ageTo}`;
    const price = p[gender];

    return {
      label: `${ageLabel} : ฿ ${price?.toLocaleString() ?? '-'}`,
    };
  });
};
'''