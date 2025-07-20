import React, { useState,useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Calculator, RotateCcw, Package, Shield, Search, Save, CheckCircle, ChevronDown, Minus, Plus, Eye, Filter, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import QuoteResult from '@/components/QuoteResult';
import Step1 from '@/components/steps/Step1';
import Step2 from '@/components/steps/Step2';
import Step3 from '@/components/steps/Step3';
import { createFormStepHandlers } from '@/utils/formStepHandlers';
import { calculateTieredPremium, getPricingTiersFromPackage } from '@/utils/premiumCalculator';
import { parseCoverageFromText } from '@/utils/ParserHandler';
import { useAuth } from '../contexts/AuthContext';
<<<<<<< HEAD
=======
import { PromotionProvider, usePromotion } from '@/contexts/PromotionContext';
import PromotionSelectorDialog from '@/components/PromotionSelector';
import { Promotion, CouponType,PremiumResult } from '@/lib/types';
>>>>>>> main

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

<<<<<<< HEAD
interface PackageObject {
  name: string;
  [key: string]: any;
}

=======
interface NewCartEntry {
  packageName: string;
  startAge: number;
  endAge: number;
  premium: PremiumInfo;
}


>>>>>>> main
interface PremiumInfo {
  annual: number;
}

interface CartEntry {
<<<<<<< HEAD
=======
  id: string;
>>>>>>> main
  packageName: string;
  startAge: number;
  endAge: number;
  premium: PremiumInfo;
  dateAdded: string;
}

interface CartItem {
  id: string;
  userId: string;
  username: string;
  packageName: string | { name: string } | Array<{ name: string }>;
  startAge: number;
  endAge: number;
  premium: { annual: number };
  dateAdded: string;
}

interface User {
  _id?: string;
  userId?: string;
  username?: string;
}

interface Plan {
  id: string;
  name: string;
  description: string;
  basePremium: number;
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

const InsuranceCalculator = () => {
  const { user } = useAuth();
<<<<<<< HEAD
=======
  const userId = user?.id || ''; // ดึง userId มาใช้งานแบบปลอดภัย
>>>>>>> main
  console.log("user:", user);

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
  const [cart, setCart] = useState<CartEntry[]>([]);
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
  const [selectedPlans, setSelectedPlans] = useState<Plan[]>([]);
  const [showAllPlans, setShowAllPlans] = useState(false);

  const { toast } = useToast();

  // ✅ ย้าย fetchCart ออกมาเป็นฟังก์ชันแยกเพื่อให้สามารถเรียกใช้ได้จากที่อื่น
const fetchCart = async () => {
  try {
    const userId = user?._id || user?.userId || "";
    if (!userId) return;

    const res = await fetch(`http://localhost:8080/api/cart?userId=${userId}`);
    if (!res.ok) {
<<<<<<< HEAD
      console.error("Fetch cart failed");
=======
      console.error("Fetch cart failed with status", res.status);
>>>>>>> main
      return;
    }

    const data = await res.json();
<<<<<<< HEAD
    console.log("Fetched cart:", data);

    if (Array.isArray(data)) {
      setCart(data);
    } else {
=======
    console.log("Fetched cart data:", data);

    // ตรวจสอบว่าข้อมูลที่ได้เป็น array หรือไม่
    if (Array.isArray(data)) {
      setCart(data);
    } else if (data.cart && Array.isArray(data.cart)) {
      // ถ้า backend ส่ง object ที่มี property cart เป็น array
      setCart(data.cart);
    } else {
      console.warn("Unexpected cart data structure:", data);
>>>>>>> main
      setCart([]);
    }
  } catch (error) {
    console.error("Fetch cart error:", error);
  }
};


<<<<<<< HEAD
=======



>>>>>>> main
  // Loading API 
  /* เชื่อมโยงจาก Frontend-to-Backend โดยใช้ res ไปยัง PORT:8080 (Go lang) backend */
  useEffect(() => {
    const fetchData = async () => {
      try {
        // ดึงทั้ง packages และ categories พร้อมกัน
        const [pkgRes, catRes] = await Promise.all([
          fetch('http://localhost:8080/api/packages'),
          fetch('http://localhost:8080/api/categories'),
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

  useEffect(() => {
      if (user) {
    fetchCart();
      }
  }, [user]);

  // 🛒 เพิ่ม & ลบ cart
<<<<<<< HEAD
  const handleAddToCart = async (item: Omit<CartEntry, "dateAdded">) => {
    try {
      const userId = user?._id || user?.userId || "";
      const username = user?.username || "Unknown User";
      if (!userId) {
        console.error("No userId, cannot add to cart");
        return;
      }

      const newItemWithUser = {
        ...item,
        userId,
        username,
        dateAdded: new Date().toISOString(),
      };

      const res = await fetch("http://localhost:8080/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItemWithUser),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Backend error:", errorText);
        return;
      }

      // ✅ ดึงข้อมูล cart ใหม่จาก backend เพื่ออัพเดต UI ทันที
      await fetchCart();

      // ✅ แสดง toast แจ้งเตือนเมื่อเพิ่มสำเร็จ
      toast({
        title: "เพิ่มลงตะกร้าสำเร็จ",
        description: `เพิ่ม ${item.packageName} ลงตะกร้าแล้ว`,
      });

      setCurrentStep(1);
    } catch (error) {
      console.error("เพิ่มตะกร้าล้มเหลว", error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถเพิ่มรายการลงตะกร้าได้",
        variant: "destructive",
      });
    }
  };
=======
  const handleAddToCart = async (item: NewCartEntry) => {
  try {
    const userId = user?._id || user?.userId || "";
    const username = user?.username || "Unknown User";
    if (!userId) {
      console.error("No userId, cannot add to cart");
      return;
    }

    const newItemWithUser = {
      ...item,
      userId,
      username,
      dateAdded: new Date().toISOString(),
    };

    const res = await fetch("http://localhost:8080/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newItemWithUser),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Backend error:", errorText);
      return;
    }

    await fetchCart();

    toast({
      title: "เพิ่มลงตะกร้าสำเร็จ",
      description: `เพิ่ม ${item.packageName} ลงตะกร้าแล้ว`,
    });

    setCurrentStep(1);
  } catch (error) {
    console.error("เพิ่มตะกร้าล้มเหลว", error);
    toast({
      title: "เกิดข้อผิดพลาด",
      description: "ไม่สามารถเพิ่มรายการลงตะกร้าได้",
      variant: "destructive",
    });
  }
};
>>>>>>> main

  // ✅ แก้ไข handleRemoveFromCart ให้ใช้ ID แทน packageName
const handleRemoveFromCart = async (itemId: string) => {
  try {
    const userId = user?._id || user?.userId || "";
    if (!userId) return;

    const res = await fetch(
      `http://localhost:8080/api/cart/${itemId}?userId=${userId}`,
      { method: "DELETE" }
    );

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Backend error:", errorText);
      return;
    }

    await fetchCart();

    toast({
      title: "ลบออกจากตะกร้าสำเร็จ",
      description: "ลบรายการออกจากตะกร้าแล้ว",
    });

  } catch (error) {
    console.error("ลบตะกร้าล้มเหลว", error);
    toast({
      title: "เกิดข้อผิดพลาด",
      description: "ไม่สามารถลบรายการจากตะกร้าได้",
      variant: "destructive",
    });
  }
};

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

  {/* Form Handler */}
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
    currentStep,
    setCurrentStep,
    setShowResult,
    setCalculatedPremium,
    setSelectedPackages,
    setExpandedCategories,
    setShowAllPlans,
    toast
  });

  const calculatePremium = () => {
    const { gender, currentAge, coverageAge } = formData;

    if (!gender || !currentAge || !stepData.selectedPackage) {
      toast({
        title: "ข้อมูลไม่ครบ",
        description: "กรุณากรอกเพศ อายุ และเลือกแพ็กเกจ",
        variant: "destructive",
      });
      return;
    }

    const startAge = parseInt(currentAge, 10);
    const endAge = coverageAge ? parseInt(coverageAge, 10) : startAge;

    const pkg = packagesData.find(p => p.name === stepData.selectedPackage);
    if (!pkg) {
      toast({
        title: "ไม่พบแพ็กเกจ",
        description: "ไม่สามารถค้นหาแพ็กเกจที่เลือกได้",
        variant: "destructive",
      });
      return;
    }

    const pricingTiers = getPricingTiersFromPackage(pkg, gender as 'male' | 'female');
    const premium = calculateTieredPremium(startAge, endAge, pricingTiers);

    setCalculatedPremium(premium);
    setShowResult(true);

    toast({
      title: "คำนวณสำเร็จ",
      description: "พบเบี้ยประกันที่เหมาะสมแล้ว",
    });
  };

  // Render Step-by-steps เราใช้ case มาช่วยในการทำ
  /* Multi-step flow  */
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        /* HACK: ปัญหาการแสดงข้อมูล <Packages> <plan> 
        *  ซึ่งความเป็นจริงไม่ควรจะแสดง <plan> 
        *
        * NOTE: หากผู้ใช้ไม่ได้ใส่ข้อมูลดังต่อไปนี้ข้อมูลควรที่จะยังสามารถแสดงได้
        * สามารถทำงานได้ : เพศ (gender) กับ ความคุ้มครองจนถึงอายุ (CoverageAge)
        * ผลลัพธ์        : package -> plan (price.male/price.female)
        */
        const eligiblePackages = getEligiblePackages();
        return (
          <Step1
            eligiblePackages={eligiblePackages}
            selectPackage={selectPackage}
            goBack={goBackStep}
          />
        );

      case 2:
        const availablePlans = getPlanOptionsFromPricing(stepData.selectedPackage);
        return (
          <Step2
            availablePlans={availablePlans}
            selectedPackage={stepData.selectedPackage}
            selectPlan={selectPlan}
            goBack={goBackStep}
          />
        );

      case 3:
        /**
         * ตรวจสอบข้อมูลที่จำเป็นต้องใช้ในขั้นตอนที่ 3 (Step3) ดึงข้อมูลที่ผู้ใช้เลือกมาซึ่งเป็น object
         * ทำการแปลงข้อมูล เพศกับช่วงอายุให้เรียบร้อย
         */
        const selectedPackageName = stepData.selectedPackage;
        const pkg = packagesData.find(p => p.name === selectedPackageName);

        const gender = formData.gender as 'male' | 'female';
        const currentAge = parseInt(formData.currentAge);
        const coverageAge = formData.coverageAge ? parseInt(formData.coverageAge) : currentAge;

        return (
          // TODO: สรุปข้อมูลที่ลูกค้าได้กรอกไปทั้งหมด
          pkg && gender && currentAge && coverageAge ? (
            <Step3
              selectedPackage={pkg}
              startAge={currentAge}
              endAge={coverageAge}
              gender={gender}
              saved={!!stepData.savedData}
              onSave={() => {
                const tiers = getPricingTiersFromPackage(pkg, gender);
                const premium = calculateTieredPremium(currentAge, coverageAge, tiers);
                handleAddToCart({ packageName: pkg.name, startAge: currentAge, endAge: coverageAge, premium });
              }}
              goBack={goBackStep}
            />
          ) : (
            <p className="text-red-500">ข้อมูลไม่ครบ ไม่สามารถแสดงเบี้ยประกันได้</p>
          )
        );

      default:
        return null;
    }
  };

  // ✅ ปรับปรุง flattenedCart ให้มีการจัดการ ID ที่ถูกต้อง
const flattenedCart = cart.map((entry, index) => ({
  ...entry,
<<<<<<< HEAD
  uniqueId: `${entry.packageName}-${entry.startAge}-${entry.endAge}-${index}`
}));

=======
  id: entry.id || `cart-item-${index}`, // ใช้ _id ถ้ามี ไม่งั้นใช้ index
  uniqueId: `${entry.packageName}-${entry.startAge}-${entry.endAge}-${index}`
}));

const { selectedPromotion } = usePromotion();

// คำนวณราคารวมในตะกร้า (รวม annual premium ทุกตัว)
const baseTotal = cart.reduce((sum, item) => sum + (item.premium?.annual || 0), 0);

// คำนวณส่วนลด
const discountAmount = React.useMemo(() => {
  if (!selectedPromotion) return 0;

  if (selectedPromotion.type === 'general') {
    return (selectedPromotion.discountPercentage / 100) * baseTotal;
  }

  if (selectedPromotion.type === 'package-specific') {
    // ลดเฉพาะแพ็กเกจที่ตรงกับ selectedPromotion.packageId (สมมติ packageName ตรงกับ packageId)
    const applicableSum = cart
      .filter(item => item.packageName === selectedPromotion.packageId)
      .reduce((sum, item) => sum + (item.premium?.annual || 0), 0);
    return (selectedPromotion.discountPercentage / 100) * applicableSum;
  }

  return 0;
}, [selectedPromotion, cart, baseTotal]);

const discountedTotal = baseTotal - discountAmount;


>>>>>>> main
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
                      <Label htmlFor="coverageAge" className="text-sm">ความคุ้มครองจนถึงอายุ (ปี) *</Label>
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
                        currentStep >= step ? 'bg-brand-green text-green' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {currentStep > step ? <CheckCircle className="w-5 h-5" color="#496650"/> : step}
                      </div>
                      {step < 3 && (
                        <div
                          className="w-12 h-1"
                          style={{ backgroundColor: currentStep > step ? '#496650' : '#e5e7eb' }} // #e5e7eb = gray-200
                        />
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

              {/* HACK: ปัญหาเมื่อเราไม่ใส่ข้อมูล CoverageAge ปุ่ม "คำนวณเบี้ยประกัน" ไม่สามารถทำงานได้
                * แนวทางการแก้ไข : เรากำหนดให้ค่าของ parseInt(formData.CoverageAge) ? CoverageAge : CurrentAge
              */}

              {/* 🛒 ตะกร้า */}
<<<<<<< HEAD
              {Array.isArray(flattenedCart) && (
                <div className="border rounded p-3 space-y-2 mt-4">
                  <h5 className="font-semibold">🛒 ตะกร้าของคุณ:</h5>
                  {flattenedCart.length > 0 ? (
                    <>
                      {flattenedCart.map((entry, index) => (
                        <div
                          key={entry.uniqueId || index}
                          className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded"
                        >
                          <span>
                            {entry.packageName} (อายุ {entry.startAge}–{entry.endAge}) – ฿
                            {entry.premium?.annual
                              ? entry.premium.annual.toLocaleString()
                              : "-"}
                          </span>
                          <button
                            onClick={() => handleRemoveFromCart(entry.packageName)}
                            className="text-red-500 text-xs hover:text-red-700 px-2 py-1 rounded hover:bg-red-50"
                          >
                            ลบ
                          </button>
                        </div>
                      ))}
                      <div className="font-semibold border-t pt-2">
                        รวม: ฿
                        {flattenedCart
                          .reduce((sum, i) => sum + (i.premium?.annual || 0), 0)
                          .toLocaleString()}
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-gray-500">ยังไม่มีรายการในตะกร้า</p>
                  )}
                </div>
              )}
=======
{Array.isArray(flattenedCart) && (
  <div className="border rounded p-3 space-y-2 mt-4">
    <h5 className="font-semibold">ตะกร้าของคุณ:</h5>
    {flattenedCart.length > 0 ? (
      <>
        {flattenedCart.map((entry, index) => (
          <div
            key={entry.uniqueId || index}
            className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded"
          >
            <span>
              {entry.packageName} (อายุ {entry.startAge}–{entry.endAge}) – ฿
              {entry.premium?.annual
                ? entry.premium.annual.toLocaleString()
                : "-"}
            </span>
            <button
              onClick={() => handleRemoveFromCart(entry.id)}
              className="text-red-500 text-xs hover:text-red-700 px-2 py-1 rounded hover:bg-red-50"
            >
              ลบ
            </button>
          </div>
        ))}

        <div className="font-semibold border-t pt-2">
          รวมก่อนส่วนลด: ฿{baseTotal.toLocaleString()}
        </div>

        {selectedPromotion && discountAmount > 0 && (
          <div className="font-semibold border-t pt-2 text-green-600">
            ส่วนลด ({selectedPromotion.name}): -฿
            {discountAmount.toLocaleString(undefined, {
              minimumFractionDigits: 0,
            })}
          </div>
        )}

        <div className="font-bold text-lg border-t pt-2">
          รวมสุทธิ: ฿{discountedTotal.toLocaleString()}
        </div>
      </>
    ) : (
      <p className="text-sm text-gray-500">ยังไม่มีรายการในตะกร้า</p>
    )}
  </div>
)}

              {/* Promotion Selector */}
              <PromotionSelectorDialog />
>>>>>>> main
  
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
          {/*TODO: แก้ไขวิธีการคำนวณจาก Hard-code ในที่นี้คือ calculatedPremium -> permiumCalculator 
           * 
           */}
          {


<<<<<<< HEAD
  showResult && calculatedPremium && (() => {
=======
  
showResult && calculatedPremium && (() => {
>>>>>>> main
    const packageName = stepData.selectedPackage || 'แพ็กเกจที่เลือก';
    const coverage = parseCoverageFromText(packageName) ?? 0;
    

    return (
<<<<<<< HEAD
      <QuoteResult 
        formData={formData}
        premium={calculatedPremium}
        selectedPlans={selectedPlans}
        cartItems={cart}

      />
=======
<QuoteResult 
  
  premium={calculatedPremium}
  selectedPlans={selectedPlans}
  cartItems={cart}
  selectedPromotion={selectedPromotion}
  discountAmount={discountAmount}
/>


>>>>>>> main
    );
  })()
}
        </div>
      </div>
    </section>
  );
};

export default InsuranceCalculator;
