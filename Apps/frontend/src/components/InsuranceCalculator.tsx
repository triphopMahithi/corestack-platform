import React, { useState,useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Calculator, RotateCcw, Package, Shield, Search, Save, CheckCircle, ChevronDown, Minus, Plus, Eye, Filter, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import QuoteResult from './QuoteResult';
import { isPackageEligible, filterEligiblePackages, getEligibilityReason } from '@/utils/packageFilters';
import Step1 from '@/components/steps/Step1';
import Step2 from '@/components/steps/Step2';
import Step3 from '@/components/steps/Step3';
import { calculateTieredPremium, getPricingTiersFromPackage } from '@/utils/premiumCalculator';
import { createFormStepHandlers } from '@/utils/formStepHandlers';

interface CalculatorData {
  gender: string;
  currentAge: string;
  coverageAge: string;
  paymentFrequency: string;
  plans: string[];
  packages: string[];
}

interface StepData {
  selectedPackage: string;
  selectedPlan: string;
  searchResults: any;
  savedData: any;
}

interface SubPlan {
  id: string;
  name: string;
  coverage: string;
  monthlyPremium: number;
  annualPremium: number;
  minAge: number;
  maxAge: number;
  genderRestriction?: 'male' | 'female' | null;
}

interface SelectedPackage {
  id: string;
  name: string;
  category: string;
  subPackages?: string[];
  selectedPlans: {
    planId: string;
    planName: string;
    coverage: string;
    units: number;
    monthlyPremium: number;
    annualPremium: number;
  }[];
}

type PricingTier = {
  ageFrom: number;
  ageTo: number;
  price: number;
};

const InsuranceCalculator = () => {

  // ===== State Management =====
  /* รวบรวมสถานะที่เราสามารถเรียกใช้ได้  */
  const [formData, setFormData] = useState<CalculatorData>({
    gender: '',
    currentAge: '',
    coverageAge: '',
    paymentFrequency: 'annual',
    plans: [],
    packages: []
  });
  // การเก็บสถานะข้อมูลที่เรียกใช้มาจาก API
  const [packagesData, setPackagesData] = useState<any[]>([]);
  const [categoriesData, setCategoriesData] = useState<Record<string, string[]>>({});

  const [currentStep, setCurrentStep] = useState<number>(0);
  const [stepData, setStepData] = useState<StepData>({
    selectedPackage: '',
    selectedPlan: '',
    searchResults: null,
    savedData: null
  });

  const [showResult, setShowResult] = useState(false);
  const [calculatedPremium, setCalculatedPremium] = useState<{
    monthly: number;
    quarterly: number;
    semiAnnual: number;
    annual: number;
  } | null>(null);

  // Category selection states
  const [selectedPackages, setSelectedPackages] = useState<SelectedPackage[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [showAllPlans, setShowAllPlans] = useState(false);

  const { toast } = useToast();
  // Loading API 
  /* เชื่อมโยงจาก Frontend-to-Backend โดยใช้ res ไปยัง PORT:8080 (Go lang) backend */
useEffect(() => {
  const fetchData = async () => {
    try {
      // ดึงทั้ง packages และ categories พร้อมกัน
      const [pkgRes, catRes] = await Promise.all([
        fetch('http://localhost:8080/api/packages'),
        fetch('http://localhost:8080/api/categories')
      ]);

      const packages = await pkgRes.json();
      const categories = await catRes.json();

      setPackagesData(packages); // array ของแพ็กเกจ

      // แปลง category array ให้เป็น object: { categoryId: [packageId, ...] }
      const categoryMap: Record<string, string[]> = {};
      categories.forEach((cat: any) => {
        categoryMap[cat.id] = cat.packages;
      });
      setCategoriesData(categoryMap);

    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  fetchData();
}, []);

/*

// Category data
  const categories = {
    additional: {
      id: 'additional',
      name: 'Additional contract',
      packages: [
        'AIA Health Happy Kids',
        'AIA H&S (new standard)',
        'AIA H&S Extra (new standard)',
        'AIA Health Saver',
        'AIA Health Happy',
        'AIA Infinite Care (new standard)',
        'HB',
        'AIA HB Extra'
      ]
    },
    critical: {
      id: 'critical',
      name: 'Critical Illness',
      packages: [
        'AIA Health Cancer',
        'AIA Care for Cancer',
        'AIA CI Plus',
        'AIA CI Top Up',
        'AIA Multi-Pay CI',
        'Lady Care & Lady Care Plus',
        'AIA TPD'
      ]
    },
    accident: {
      id: 'accident',
      name: 'Accident coverage',
      packages: [
        'AIA Total Care',
        'Accident Coverage'
      ]
    }
  };

  */

  // ดึงข้อมูลจาก object
  /* ฟังก์ชันสำหรับการคัดกรองข้อมูล */
  const getEligiblePackages = () => {
  if (!formData.currentAge || !formData.gender) return [];

  const age = parseInt(formData.currentAge);
  const gender = formData.gender;

  return packagesData
    .filter(pkg => {
      const withinAge = age >= pkg.minAge && age <= pkg.maxAge;
      const genderOK = !pkg.genderRestriction || pkg.genderRestriction === gender;
      return withinAge && genderOK;
    })
    .map(pkg => pkg.name);
};

  // Category selection functions
  /* ฟังก์ชันสำหรับการคัดกรองข้อมูล */

  /*
  const getFilteredCategories = () => {
    const validGender = (formData.gender === 'male' || formData.gender === 'female') ? formData.gender : 'male';
    const validAge = formData.currentAge && parseInt(formData.currentAge) > 0 ? parseInt(formData.currentAge) : null;

    const filteredCategories = { ...categories };
    
    Object.keys(filteredCategories).forEach(categoryKey => {
      const category = filteredCategories[categoryKey];
      category.packages = filterEligiblePackages(category.packages, validAge, validGender);
    });

    Object.keys(filteredCategories).forEach(categoryKey => {
      if (filteredCategories[categoryKey].packages.length === 0) {
        delete filteredCategories[categoryKey];
      }
    });

    return filteredCategories;
  };
   */

// getSubPlans ดึงข้อมูลจาก state : packagesData
/*
  const getSubPlans = (packageName: string): SubPlan[] => {
    const currentAge = parseInt(formData.currentAge);
    const gender = formData.gender === 'male' ? 'male' : 'female';

    const pkg = packagesData.find(p => p.name === packageName);
    if (!pkg?.subPackages) return [];

    const result: SubPlan[] = [];

    for (const sub of pkg.subPackages) {
      const match = sub.pricing?.find((p: any) => currentAge >= p.ageFrom && currentAge <= p.ageTo);
      if (!match || match[gender] == null) continue;

      result.push({
        id: `${pkg.id}-${sub.id}`,
        name: sub.name,
        coverage: 'standard',
        monthlyPremium: parseFloat((match[gender] / 12).toFixed(2)),
        annualPremium: parseFloat(match[gender].toFixed(2)),
        minAge: pkg.minAge,
        maxAge: pkg.maxAge,
        genderRestriction: pkg.genderRestriction === '' ? null : pkg.genderRestriction
      });
    }

  return result;
};
*/

const getPlanOptionsFromPricing = (packageName: string): { label: string }[] => {
  const pkg = packagesData.find(p => p.name === packageName);
  if (!pkg || !Array.isArray(pkg.pricing)) return [];

  const currentAge = parseInt(formData.currentAge);
  if (isNaN(currentAge)) return [];

  const gender = formData.gender === 'male' ? 'male' : 'female';

  // ✅ ค้นหาเฉพาะช่วงอายุที่ตรงกับ currentAge
  const matching = pkg.pricing.filter((p: any) => currentAge >= p.ageFrom && currentAge <= p.ageTo);

  return matching.map((p: any) => {
    const ageLabel = `อายุ ${p.ageFrom} ถึง ${p.ageTo}`;
    const price = p[gender];

    return {
      label: `${ageLabel} : ฿ ${price?.toLocaleString() ?? '-'}`,
    };
  });
};

  // Package and Plan
  /* toggle<Package/Plan/PlanUnits> ฟังก์ชันเกี่ยวกับ เพิ่ม/ลด */
  /*
  const toggleCategory = (categoryId: string) => {
    const newExpanded = [...expandedCategories];
    const index = newExpanded.indexOf(categoryId);
    
    if (index > -1) {
      newExpanded.splice(index, 1);
    } else {
      newExpanded.push(categoryId);
    }
    
    setExpandedCategories(newExpanded);
  };
  const togglePackage = (packageName: string, categoryId: string) => {
    const packageId = `${categoryId}-${packageName}`;
    const existing = selectedPackages.find(p => p.id === packageId);
    
    if (existing) {
      setSelectedPackages(selectedPackages.filter(p => p.id !== packageId));
    } else {
      const newPackage: SelectedPackage = {
        id: packageId,
        name: packageName,
        category: categoryId,
        selectedPlans: []
      };
      setSelectedPackages([...selectedPackages, newPackage]);
    }
  };

  const togglePlan = (packageId: string, plan: SubPlan) => {
    setSelectedPackages(selectedPackages.map(pkg => {
      if (pkg.id === packageId) {
        const existingPlanIndex = pkg.selectedPlans.findIndex(p => p.planId === plan.id);
        
        if (existingPlanIndex > -1) {
          return {
            ...pkg,
            selectedPlans: pkg.selectedPlans.filter(p => p.planId !== plan.id)
          };
        } else {
          return {
            ...pkg,
            selectedPlans: [...pkg.selectedPlans, {
              planId: plan.id,
              planName: plan.name,
              coverage: plan.coverage,
              units: 1,
              monthlyPremium: plan.monthlyPremium,
              annualPremium: plan.annualPremium
            }]
          };
        }
      }
      return pkg;
    }));
  };
  const updatePlanUnits = (packageId: string, planId: string, newUnits: number) => {
    if (newUnits < 0) return;
    
    setSelectedPackages(selectedPackages.map(pkg => {
      if (pkg.id === packageId) {
        return {
          ...pkg,
          selectedPlans: pkg.selectedPlans.map(plan => 
          plan.planId === planId ? { ...plan, units: newUnits } : plan
        ).filter(plan => plan.units > 0)
      };
    }
    return pkg;
  }));
};

const getTotalMonthly = () => {
    return selectedPackages.reduce((total, pkg) => {
      return total + pkg.selectedPlans.reduce((pkgTotal, plan) => {
        return pkgTotal + (plan.monthlyPremium * plan.units);
      }, 0);
    }, 0);
  };

  const getTotalAnnual = () => {
    return selectedPackages.reduce((total, pkg) => {
      return total + pkg.selectedPlans.reduce((pkgTotal, plan) => {
        return pkgTotal + (plan.annualPremium * plan.units);
      }, 0);
    }, 0);
  };

  */

  const {
    handlePackageSelection,
    selectPackage,
    selectPlan,
    handleSave,
    resetForm,
    goBackStep
        } = createFormStepHandlers({
    formData,
    setFormData,
    stepData,
    setStepData,
    setCurrentStep,
    setShowResult,
    setCalculatedPremium,
    setSelectedPackages,
    setExpandedCategories,
    setShowAllPlans,
    toast
  });
  /*
  const handlePackageSelection = () => {
    if (!formData.gender || !formData.currentAge) {
      toast({
        title: "ข้อมูลไม่ครบ",
        description: "กรุณากรอกข้อมูลส่วนตัวก่อนเลือกแพ็กเกจ",
        variant: "destructive",
      });
      return;
    }
    setCurrentStep(1);
  };

  const selectPackage = (packageName: string) => {
    setStepData({ ...stepData, selectedPackage: packageName, selectedPlan: '' });
    setCurrentStep(2);
    toast({
      title: "เลือกแพ็กเกจสำเร็จ",
      description: `เลือก ${packageName} แล้ว`,
    });
  };

  const selectPlan = (planName: string) => {
    setStepData({ ...stepData, selectedPlan: planName });
    setCurrentStep(3);
    toast({
      title: "เลือกแผนสำเร็จ",
      description: `เลือก ${planName} แล้ว`,
    });
  };

  const handleSave = () => {
    setFormData({
      ...formData,
      packages: [stepData.selectedPackage],
      plans: [stepData.selectedPlan]
    });
    
    setStepData({ ...stepData, savedData: true });
    setShowResult(true);
    
    toast({
      title: "บันทึกสำเร็จ",
      description: "บันทึกข้อมูลประกันเรียบร้อย",
    });
  };

  const resetForm = () => {
    setFormData({
      gender: '',
      currentAge: '',
      coverageAge: '',
      paymentFrequency: 'annual',
      plans: [],
      packages: []
    });
    setCurrentStep(0);
    setStepData({
      selectedPackage: '',
      selectedPlan: '',
      searchResults: null,
      savedData: null
    });
    setShowResult(false);
    setCalculatedPremium(null);
    setSelectedPackages([]);
    setExpandedCategories([]);
    setShowAllPlans(false);
    
    toast({
      title: "รีเซ็ตฟอร์มเรียบร้อย",
      description: "สามารถกรอกข้อมูลใหม่ได้",
    });
  };

  const goBackStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  */
  // testing calculation (static)

  /*
  const parsePlanLabel = (label: string) => {
    const regex = /อายุ (\d+) ถึง (\d+) : ฿ ([\d,]+)/;
    const match = label.match(regex);

    if (!match) return null;

    const ageFrom = parseInt(match[1]);
    const ageTo = parseInt(match[2]);
    const price = parseInt(match[3].replace(/,/g, ''));

  return { ageFrom, ageTo, price };
};

const calculateTotalByCoverage = (label: string, coverageAge: number) => {
  const parsed = parsePlanLabel(label);
  if (!parsed) return 0;

  const { ageFrom, ageTo, price } = parsed;

  // จำกัดอายุความคุ้มครองไม่ให้เกินช่วงของแพ็กเกจ
  const actualEndAge = Math.min(ageTo, coverageAge);
  const coverageYears = actualEndAge - ageFrom;

  if (coverageYears <= 0) return 0;

  return price * coverageYears;
};
*/

/*
// dynamics 
const getPricingTiersFromPackage = (
  pkg: any,
  gender: 'male' | 'female'
): PricingTier[] => {
  if (!pkg?.pricing || !Array.isArray(pkg.pricing)) return [];

  return pkg.pricing
    .filter((p: any) => p[gender] != null)
    .map((p: any) => ({
      ageFrom: p.ageFrom,
      ageTo: p.ageTo,
      price: p[gender],
    }));
};

const calculateTieredPremium = (
  startAge: number,
  endAge: number,
  tiers: PricingTier[]
  ): number => {
    
  let total = 0;
  for (const tier of tiers) {
    const overlapStart = Math.max(startAge, tier.ageFrom);
    const overlapEnd = Math.min(endAge, tier.ageTo);

    const yearsInTier = overlapEnd - overlapStart + 1;
    if (yearsInTier > 0) {
      total += tier.price * yearsInTier;
    }
  }

  return total;
};

*/

  const calculatePremium = () => {
    if (!formData.gender || !formData.currentAge || !formData.coverageAge || 
        formData.packages.length === 0 || formData.plans.length === 0) {
      toast({
        title: "ข้อมูลไม่ครบ",
        description: "กรุณากรอกข้อมูลให้ครบถ้วน",
        variant: "destructive",
      });
      return;
    }

    const mockPremium = {
      monthly: Math.floor(Math.random() * 5000) + 1000,
      quarterly: 0,
      semiAnnual: 0,
      annual: 0
    };
    mockPremium.quarterly = Math.round(mockPremium.monthly * 3 * 1.02);
    mockPremium.semiAnnual = Math.round(mockPremium.monthly * 6 * 1.01);
    mockPremium.annual = mockPremium.monthly * 12;

    setCalculatedPremium(mockPremium);
    setShowResult(true);
    
    toast({
      title: "คำนวณสำเร็จ",
      description: "พบเบี้ยประกันที่เหมาะสมแล้ว",
    });
  };

  {/* (testing) Premium Calculator */}

  const selectedPackageName = stepData.selectedPackage;
  const pkg = packagesData.find(p => p.name === selectedPackageName);

  const gender = formData.gender as 'male' | 'female';
  const currentAge = parseInt(formData.currentAge);
  const coverageAge = parseInt(formData.coverageAge);
  // getPricingTiersFromPackage() & calculateTieredPremium เรียกจากไฟล์อื่น
  if (pkg && gender && currentAge && coverageAge) {
    const tiers = getPricingTiersFromPackage(pkg, gender);
    const totalPremium = calculateTieredPremium(currentAge, coverageAge, tiers);

    console.log("💰 เบี้ยรวมตามช่วงอายุ:", totalPremium.toLocaleString());
  }

  
  // Render Step-by-steps เราใช้ case มาช่วยในการทำ
  /* Multi-step flow  */
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:

      const eligiblePackages = getEligiblePackages();
      return (
        <Step1
          eligiblePackages={eligiblePackages}
          selectPackage={selectPackage}
          goBack={goBackStep}
        />);

      case 2:
      const availablePlans = getPlanOptionsFromPricing(stepData.selectedPackage);
      return (
        <Step2
          availablePlans={availablePlans}
          selectedPackage={stepData.selectedPackage}
          selectPlan={selectPlan}
          goBack={goBackStep}
        />);
  
      case 3:
        return (
        <Step3
          searchResults={stepData.searchResults}
          saved={!!stepData.savedData}
          onSave={handleSave}
          goBack={goBackStep}
        />
      );
      default:
        return null;
    }
  };
  



  return (
    <section id="calculator" className="py-8 bg-gray-50">
      <div className="container mx-auto px-3">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-brand-green mb-3">
            เครื่องคำนวณเบี้ยประกัน
          </h2>
          <p className="text-gray-600 text-sm md:text-base">
            คำนวณเบี้ยประกันที่เหมาะสมกับคุณ ง่ายๆ ในไม่กี่ขั้นตอน
          </p>
        </div>

        <div className="max-w-2xl mx-auto space-y-6">
          <Card className="shadow-lg border-0">
            <CardHeader className="brand-green text-white py-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calculator className="w-5 h-5" />
                กรอกข้อมูลเพื่อคำนวณเบี้ยประกัน
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-6">
              
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-brand-green border-b pb-2">
                  ข้อมูลส่วนตัว
                </h3>
                
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gender" className="text-sm">เพศ *</Label>
                    <Select value={formData.gender} onValueChange={value => setFormData({...formData, gender: value})}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="เลือกเพศ" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">ชาย</SelectItem>
                        <SelectItem value="female">หญิง</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="currentAge" className="text-sm">อายุปัจจุบัน (ปี) *</Label>
                      <Input
                        id="currentAge"
                        type="number"
                        min="1"
                        max="99"
                        value={formData.currentAge}
                        onChange={e => setFormData({...formData, currentAge: e.target.value})}
                        placeholder="กรอกอายุปัจจุบัน"
                        className="h-12"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="coverageAge" className="text-sm">จนถึงอายุ (ปี) *</Label>
                      <Input
                        id="coverageAge"
                        type="number"
                        min={formData.currentAge || "1"}
                        max="99"
                        value={formData.coverageAge}
                        onChange={e => setFormData({...formData, coverageAge: e.target.value})}
                        placeholder="กรอกอายุสิ้นสุดความคุ้มครอง"
                        className="h-12"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="paymentFrequency" className="text-sm">ความถี่ในการจ่าย</Label>
                    <Select value={formData.paymentFrequency} onValueChange={value => setFormData({...formData, paymentFrequency: value})}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="เลือกวิธีการจ่าย" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="annual">รายปี</SelectItem>
                        <SelectItem value="monthly">รายเดือน</SelectItem>
                        <SelectItem value="quarterly">รายไตรมาส</SelectItem>
                        <SelectItem value="semiannual">ราย 6 เดือน</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* 4-Step Process */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-brand-green border-b pb-2">
                  เลือกประกันภัย (3 ขั้นตอน)
                </h3>
                
                {/* Progress Indicator */}
                <div className="flex items-center justify-between mb-4">
                  {[1, 2, 3].map((step) => (
                    <div key={step} className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                        currentStep >= step ? 'bg-brand-green text-white' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {currentStep > step ? <CheckCircle className="w-5 h-5" /> : step}
                      </div>
                      {step < 4 && (
                        <div className={`w-12 h-1 ${
                          currentStep > step ? 'bg-brand-green' : 'bg-gray-200'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>

                {/* Step Buttons */}
                {currentStep === 0 && (
                  // (version 1.1.0) : เราได้ทำการปรับจาก 4-cols เป็น 3-cols 
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <Button 
                      onClick={handlePackageSelection}
                      variant="outline" 
                      className="h-16 flex-col gap-1 border-brand-green text-brand-green hover:bg-brand-green hover:text-white"
                    >
                      <Package className="w-5 h-5" />
                      <span className="text-xs">เลือกแพ็กเกจ</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-16 flex-col gap-1" 
                      disabled
                    >
                      <Shield className="w-5 h-5" />
                      <span className="text-xs">เลือกแผน</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-16 flex-col gap-1" 
                      disabled
                    >
                      <Save className="w-5 h-5" />
                      <span className="text-xs">บันทึก</span>
                    </Button>
                  </div>
                )}

                {/* Step Content */}
                {currentStep > 0 && (
                  <Card className="p-4">
                    {renderStepContent()}
                  </Card>
                )}
              </div>

              {/* Action Buttons */}
  
              <div className="space-y-3 pt-4 border-t">
                <Button 
                  onClick={calculatePremium}
                  className="brand-green text-white w-full h-12"
                  size="lg"
                >
                  <Calculator className="w-5 h-5 mr-2" />
                  คำนวณเบี้ยประกัน
                </Button>
                
                <Button 
                  onClick={resetForm}
                  variant="outline"
                  className="border-brand-green text-brand-green hover:bg-brand-green hover:text-white w-full h-12"
                  size="lg"
                >
                  <RotateCcw className="w-5 h-5 mr-2" />
                  รีเซ็ตฟอร์ม
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          {showResult && calculatedPremium && (
            <QuoteResult 
              formData={formData}
              premium={calculatedPremium}
              selectedPackages={[{
                id: '1',
                name: stepData.selectedPackage || 'แพ็กเกจที่เลือก',
                coverage: 1000000,
                premium: calculatedPremium.monthly
              }]}
              selectedPlans={[]}
            />
          )}
        </div>
      </div>
    </section>
  );
};

export default InsuranceCalculator;
