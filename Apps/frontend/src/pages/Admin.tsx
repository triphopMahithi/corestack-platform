import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Save, Plus, Trash2 , Edit} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import axios from 'axios';
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import { UploadWithConflictDialog } from "@/components/UploadWithConflictDialog";
import ConfirmDeleteAll from "@/components/ConfirmDeleteAll";


interface Pricing {
  ageFrom: number;
  ageTo: number;
  female: number | string;
  male: number | string;
}

interface NewPackage {
  id: string;
  name: string;
  categoryId: string;
  baseMonthly: number;
  baseAnnual: number;
  special: boolean;
  genderRestriction: string;
  minAge: number | string;
  maxAge: number | string;
  pricing: Pricing[];
}

const Admin = () => {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [packageList, setPackageList] = useState([]); // State to store all packages
  
  const [query, setQuery] = useState('');
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState('');
  const [noResults, setNoResults] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showMoreInfo, setShowMoreInfo] = useState(false); // สำหรับการแสดงข้อมูลเพิ่มเติม

    /**
   *  Promotion
   * 
   */
  

  const [loading, setLoading] = useState(true); // สถานะการโหลดข้อมูล
  const [error, setError] = useState(null); // ข้อผิดพลาด

  const [promotionType, setPromotionType] = useState('general');  // default type
  const [promotionName, setPromotionName] = useState('');
  const [promotionDescription, setPromotionDescription] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState('');
  const [validFrom, setValidFrom] = useState('');
  const [validTo, setValidTo] = useState('');
  const [packageId, setPackageId] = useState('');
  const [categoryId, setCategoryId] = useState('');

  // edit price
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editPrice, setEditPrice] = useState({
  ageFrom: '',
  ageTo: '',
  male: '',
  female: '',
  });

  /** 
   *  
   * Search 
   * 
   */

  // ฟังก์ชันค้นหาแพ็กเกจ
  const handleSearch = async (e) => {
    const searchQuery = e.target.value;
    setQuery(searchQuery);

    if (searchQuery.length >= 1) {
      try {
        // ส่งคำค้นหาไปที่ backend
        const response = await axios.get(
          `http://localhost:8080/api/search?query=${searchQuery}`
        );
        if (response.data.length === 0) {
          setNoResults(true);
        } else {
          setPackages(response.data);
          setNoResults(false);
        }
      } catch (error) {
        console.error("Error fetching packages", error);
      }
    } else {
      setPackages([]);
    }
  };
  const handlePackageSelect = (pkg) => {
    setSelectedPackage(pkg);
    setIsDropdownOpen(false); // ปิด dropdown เมื่อเลือกแล้ว
  };

  // คำนวณอายุที่น้อยที่สุดและมากที่สุดจาก pricing
  const getMinAge = (pricing) => {
    if (!pricing || pricing.length === 0) return null;
    return Math.min(...pricing.map(p => p.ageFrom));
  };

  const getMaxAge = (pricing) => {
    if (!pricing || pricing.length === 0) return null;
    return Math.max(...pricing.map(p => p.ageTo));
  };

  // คำนวณราคาเพศชาย (Male) และเพศหญิง (Female) ตามช่วงอายุ
  const getPriceByGender = (pricing, gender) => {
    if (!pricing || pricing.length === 0) return null;
    const price = pricing.find(p => p.gender === gender);
    return price ? price[gender] : 0;
  };

/**
 * 
 *    Page Function
 */

  // ฟังก์ชันเกี่ยวกับ ขึ้นหน้าใหม่
  const ItemsPerPage = 5; // จำนวนรายการที่จะแสดงในแต่ละหน้า
  const [currentPage, setCurrentPage] = useState(1);

  // ฟังก์ชันคำนวณข้อมูลที่จะแสดงในแต่ละหน้า
  const startIndex = (currentPage - 1) * ItemsPerPage;
  const currentPackages = packageList.slice(startIndex, startIndex + ItemsPerPage);

  // ฟังก์ชันไปหน้าถัดไป
  const nextPage = () => {
    if (currentPage < Math.ceil(packageList.length / ItemsPerPage)) {
      setCurrentPage(currentPage + 1);
    }
  };

  // ฟังก์ชันไปหน้าก่อนหน้า
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };  
  
/**
 * 
 *  Package
 * 
 */


  // Fetch package list from database when the component is mounted
  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const response = await axios.get('http://localhost:8080/api/packages');
        setPackageList(response.data); // Store the received data in state
        console.log('Package - ', response.data)
        // updated ui
      } catch (error) {
        toast({
          title: 'Error fetching packages',
          description: error.message,
          variant: 'destructive',
        });
      }
    };

    fetchPackages();
  }, []); // Empty dependency array ensures this runs only once when the component mounts

  const [newPackage, setNewPackage] = useState<NewPackage>({
    id: '',
    name: '',
    categoryId: '',
    baseMonthly: 0,
    baseAnnual: 0,
    special: false,
    genderRestriction: '',
    minAge: '',
    maxAge: '',
    pricing: [],
  });

  const [pricingInputs, setPricingInputs] = useState<{ ageFrom: number, ageTo: number, female: number, male: number }[]>([]);

// ฟังก์ชันเพิ่มช่องกรอกข้อมูลราคาใหม่
const addPricingInput = () => {
  if (newPackage.minAge && newPackage.maxAge) {
    // เพิ่มข้อมูลราคาโดยใช้ minAge และ maxAge ที่กรอก
    setPricingInputs([
      ...pricingInputs,
      {
        ageFrom: parseInt(newPackage.minAge as string), // ใช้ minAge ที่กรอก
        ageTo: parseInt(newPackage.maxAge as string), // ใช้ maxAge ที่กรอก
        female: 0,
        male: 0,
      }
    ]);

    // รีเซ็ตอายุขั้นต่ำและสูงสุดหลังจากเพิ่มราคา
    setNewPackage({ ...newPackage, minAge: '', maxAge: '' }); // รีเซ็ตค่า minAge และ maxAge
  } else {
    toast({
      title: 'ข้อมูลไม่ครบถ้วน',
      description: 'กรุณากรอกอายุขั้นต่ำและสูงสุดให้ครบถ้วน',
      variant: 'destructive',
    });
  }
};

  // ฟังก์ชันลบราคา
  const removePricingInput = (index: number) => {
    const updatedPricingInputs = [...pricingInputs];
    updatedPricingInputs.splice(index, 1);
    setPricingInputs(updatedPricingInputs);
  };

const handleSavePackage = () => {
  if (!newPackage.name || !newPackage.categoryId || pricingInputs.length === 0) {
    toast({
      title: 'ข้อมูลไม่ครบถ้วน',
      description: 'กรุณากรอกข้อมูลให้ครบถ้วน',
      variant: 'destructive',
    });
    return;
  }

  // ตรวจสอบว่า minAge และ maxAge ไม่มีค่า หรือเป็น ''
  let minAge = newPackage.minAge;
  let maxAge = newPackage.maxAge;

  if (minAge === '' || maxAge === '') {
    // คำนวณค่า minAge และ maxAge จาก pricingInputs
    if (pricingInputs.length > 0) {
      minAge = Math.min(...pricingInputs.map(p => p.ageFrom)); // หาค่าน้อยที่สุดจาก ageFrom
      maxAge = Math.max(...pricingInputs.map(p => p.ageTo)); // หาค่ามากที่สุดจาก ageTo
    } else {
      toast({
        title: 'กรุณากรอกข้อมูลราคาให้ครบถ้วน',
        description: 'กรุณากรอกข้อมูลอายุขั้นต่ำและสูงสุดก่อนที่จะบันทึกแพ็คเกจ',
        variant: 'destructive',
      });
      return;
    }
  }

  // รวมข้อมูลที่กรอกลงใน pricing
  const newPricingData = pricingInputs.map(input => ({
    ageFrom: input.ageFrom,
    ageTo: input.ageTo,
    female: input.female,
    male: input.male,
  }));

  const packageToSave = { 
    ...newPackage, 
    minAge: parseInt(minAge as string), // แปลงเป็นตัวเลข
    maxAge: parseInt(maxAge as string), // แปลงเป็นตัวเลข
    pricing: newPricingData 
  };
    // ส่งข้อมูลใหม่ไปที่ backend (สมมุติว่าเป็น POST request)
    axios.post('http://localhost:8080/api/packages', packageToSave)
    .then((response) => {
    // เมื่อการส่งข้อมูลสำเร็จ
    toast({
      title: 'บันทึกสำเร็จ',
      description: `เพิ่มแพ็คเกจ ${newPackage.name} แล้ว`,
    });
    // เพิ่มแพ็คเกจที่เพิ่มใหม่ลงใน packageList โดยตรง
    setPackageList([...packageList, packageToSave]); // อัปเดต packageList ทันที

    // รีเซ็ตข้อมูลหลังจากบันทึก
    setNewPackage({
      id: '',
      name: '',
      categoryId: '',
      baseMonthly: 0,
      baseAnnual: 0,
      special: false,
      genderRestriction: '',
      minAge: '',
      maxAge: '',
      pricing: [],
    });
    setPricingInputs([]);
  })
  .catch((error) => {
    // จัดการข้อผิดพลาด
    toast({
      title: 'เกิดข้อผิดพลาด',
      description: error.response?.data?.message || 'ไม่สามารถเพิ่มแพ็คเกจได้',
      variant: 'destructive',
    });
  });
}

 // ฟังก์ชันจัดการการเปลี่ยนแปลงราคา
const handlePricingChange = (index: number, field: string, value: string) => {
    const updatedPricingInputs = [...pricingInputs];
    // แปลงค่าเป็นตัวเลขเมื่อกรอกข้อมูล
    updatedPricingInputs[index] = { ...updatedPricingInputs[index], [field]: value === '' ? '' : parseFloat(value) };
    setPricingInputs(updatedPricingInputs);
  };

  // Redirect if not admin
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }
  const [monthlyPrice, setMonthlyPrice] = useState('');
  const [annualPrice, setAnnualPrice] = useState('');
  
  const [packagePrices, setPackagePrices] = useState<PackagePrice[]>([
    { packageName: 'AIA Health Happy Kids', baseMonthly: 500, baseAnnual: 5500 },
    { packageName: 'AIA H&S (new standard)', baseMonthly: 800, baseAnnual: 9000 },
    { packageName: 'AIA H&S Extra (new standard)', baseMonthly: 1200, baseAnnual: 13500 },
    { packageName: 'AIA Health Saver', baseMonthly: 600, baseAnnual: 6800 },
    { packageName: 'AIA Health Happy', baseMonthly: 900, baseAnnual: 10200 },
    { packageName: 'AIA Infinite Care (new standard)', baseMonthly: 1500, baseAnnual: 17000 },
    { packageName: 'HB', baseMonthly: 700, baseAnnual: 8000 },
    { packageName: 'AIA HB Extra', baseMonthly: 1000, baseAnnual: 11500 },
    { packageName: 'AIA Health Cancer', baseMonthly: 1200, baseAnnual: 13800 },
    { packageName: 'AIA Care for Cancer', baseMonthly: 1000, baseAnnual: 11500 },
    { packageName: 'AIA CI Plus', baseMonthly: 1500, baseAnnual: 17500 },
    { packageName: 'AIA CI Top Up', baseMonthly: 800, baseAnnual: 9200 },
    { packageName: 'multi pay-ci plus', baseMonthly: 2000, baseAnnual: 23000 },
    { packageName: 'Lady Care & Lady Care Plus', baseMonthly: 1100, baseAnnual: 12800 },
    { packageName: 'AIA TPD', baseMonthly: 600, baseAnnual: 7000 },
    { packageName: 'Accident Coverage', baseMonthly: 400, baseAnnual: 4500 }
  ]);

  const allPackages = [
    'AIA Health Happy Kids',
    'AIA H&S (new standard)',
    'AIA H&S Extra (new standard)',
    'AIA Health Saver',
    'AIA Health Happy',
    'AIA Infinite Care (new standard)',
    'HB',
    'AIA HB Extra',
    'ผลประโยชน์ Day Case ของสัญญาเพิ่มเติม HB และ AIA HB Extra',
    'AIA Health Cancer',
    'AIA Care for Cancer',
    'AIA CI Plus',
    'AIA CI Top Up',
    'multi pay-ci plus',
    'Lady Care & Lady Care Plus',
    'AIA TPD',
    'AIA Multi-Pay CI',
    'AIA Total Care',
    'Accident Coverage'
  ];
  const handleSavePrice = () => {
    if (!selectedPackage || !monthlyPrice || !annualPrice) {
      toast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณากรอกข้อมูลให้ครบถ้วน",
        variant: "destructive",
      });
      return;
    }

    const existingIndex = packagePrices.findIndex(p => p.packageName === selectedPackage);
    
    if (existingIndex > -1) {
      // Update existing
      const newPrices = [...packagePrices];
      newPrices[existingIndex] = {
        packageName: selectedPackage,
        baseMonthly: parseInt(monthlyPrice),
        baseAnnual: parseInt(annualPrice)
      };
      setPackagePrices(newPrices);
    } else {
      // Add new
      setPackagePrices([...packagePrices, {
        packageName: selectedPackage,
        baseMonthly: parseInt(monthlyPrice),
        baseAnnual: parseInt(annualPrice)
      }]);
    }

    toast({
      title: "บันทึกสำเร็จ",
      description: `อัพเดทราคาสำหรับ ${selectedPackage} แล้ว`,
    });

    setSelectedPackage('');
    setMonthlyPrice('');
    setAnnualPrice('');
  };

  //const handlePackageSelect = (packageName: string) => {
  //  setSelectedPackage(packageName);
  //  const existing = packagePrices.find(p => p.packageName === packageName);
  //  if (existing) {
  //    setMonthlyPrice(existing.baseMonthly.toString());
  //    setAnnualPrice(existing.baseAnnual.toString());
  //  } else {
  //    setMonthlyPrice('');
  //    setAnnualPrice('');
  //  }
  //};

  const handleDeletePackage = async (packageName: string) => {
    console.log('PackageID - ',packageName)
    try {
      await axios.delete(`${config.Packages}/${packageName}`);

      // อัปเดต state ทันที (ลบแพ็คเกจออกจาก state)
      setPackages((prev) => prev.filter((pkg) => pkg.name !== packageName));

    } catch (error) {
      toast({
      title: "เกิดข้อผิดพลาด",
      description: "ไม่สามารถลบแพ็คเกจได้",
      variant: "destructive",
    });
    }
    toast({
      title: "ลบสำเร็จ",
      description: `ลบราคาสำหรับ ${packageName} แล้ว`,
    });

  };

  const handleEditPackage = (packageName) => {
      toast({
      title: "แก้ไข",
      description: `แก้ไขข้อมูลของ ${packageName} แล้ว`,
    });
};

  
  /**
   *  Promotion
   * 
   */
  

  const [promotionListState, setPromotionListState] = useState([]); // ข้อมูลโปรโมชั่น
  const [loading, setLoading] = useState(true); // สถานะการโหลดข้อมูล
  const [error, setError] = useState(null); // ข้อผิดพลาด
  const currentPromotions = promotionListState.slice(
    (currentPage - 1) * ItemsPerPage,
    currentPage * ItemsPerPage
  );
  

  // ดึงข้อมูลโปรโมชั่นจาก API เมื่อ component ถูก mount
  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        const response = await axios.get('http://localhost:8080/api/promotions');
        setPromotionListState(response.data); // เก็บข้อมูลที่ได้ใน state
        console.log("log - interface promotions :",response.data);
      } catch (error) {
        setError("ไม่สามารถดึงข้อมูลโปรโมชั่นได้");
      } finally {
        setLoading(false);
      }
    };

    fetchPromotions();
  }, []); // Empty dependency array หมายความว่า useEffect จะทำงานเพียงครั้งเดียวเมื่อ component ถูก mount


const handleDeletePromotion = async (promotionId: string) => {
  console.log("promotionId -",promotionId)

  try {
    // ส่งคำขอ DELETE ไปยัง backend
    const response = await axios.delete(`http://localhost:8080/api/promotions/${promotionId}`);
    console.log("Response from delete:", response);    
    toast({
      title: "ลบโปรโมชั่นสำเร็จ",
      description: `โปรโมชั่น ${promotionName} ถูกลบแล้ว`,
    });
  } catch (error) {
    console.error("Error deleting promotion", error);
    toast({
      title: "เกิดข้อผิดพลาด",
      description: "ไม่สามารถลบโปรโมชั่นได้",
      variant: "destructive",
    });
  }
};

interface Promotion {
  _id: string;
  name: string;
  description: string;
  type: string;
  discountPercentage: number;
  validFrom?: string;
  validTo?: string;
}

const handleEditPromotion = (promotion: Promotion) => {
  console.log("Editing:", promotion);
  setEditPromotionId(promotion._id);
  setEditPromotion({
    name: promotion.name || "",
    description: promotion.description || "",
    type: promotion.type || "",
    discountPercentage: promotion.discountPercentage || 0,
    validFrom: promotion.validFrom
      ? new Date(promotion.validFrom).toISOString().slice(0, 10)
      : "",
    validTo: promotion.validTo
      ? new Date(promotion.validTo).toISOString().slice(0, 10)
      : "",
  });
};

const handleSavePromotion = () => {
  // ส่ง editPromotion และ editPromotionId ไป backend
  console.log("Saving Promotion ID:", editPromotionId, editPromotion);

  // TODO: API call หรืออัปเดต state

  // รีเซต
  setEditPromotionId(null);
};

const handleAddPromotion = async () => {
  // ตรวจสอบข้อมูลที่กรอก
  if (!promotionName || !promotionDescription) {
    toast({
      title: 'ข้อมูลไม่ครบถ้วน',
      description: 'กรุณากรอกชื่อโปรโมชั่นและรายละเอียด',
      variant: 'destructive',
    });
    return;
  }

  // ตรวจสอบสำหรับ "โปรโมชั่นเฉพาะแพ็คเกจ"
  if (promotionType === 'package' && !packageId) {
    toast({
      title: 'ข้อมูลไม่ครบถ้วน',
      description: 'กรุณากรอกชื่อแพ็คเกจที่โปรโมชั่นใช้ได้',
      variant: 'destructive',
    });
    return;
  }

  // ตรวจสอบสำหรับ "โปรโมชั่นเฉพาะ categoryId"
  if (promotionType === 'category' && !categoryId) {
    toast({
      title: 'ข้อมูลไม่ครบถ้วน',
      description: 'กรุณากรอก categoryId ที่โปรโมชั่นใช้ได้',
      variant: 'destructive',
    });
    return;
  }

  // สร้างข้อมูลโปรโมชั่น
  const promotionData = {
    name: promotionName,
    description: promotionDescription,
    type: promotionType,
    discountPercentage: parseFloat(discountPercentage),
    validFrom,
    validTo,
    packageId: promotionType === 'package' ? packageId : null,
    categoryId: promotionType === 'category' ? categoryId : null,
  };

  try {
    // ส่งข้อมูลโปรโมชั่นไปยัง backend
    //await axios.post('http://localhost:8080/api/promotions', promotionData);
    const response = await axios.post('http://localhost:8080/api/promotions', promotionData);
    // รับข้อมูลโปรโมชั่นที่ถูกสร้างพร้อม _id
    const createdPromotion = response.data.promotion;

    // อัปเดตรายการโปรโมชั่นใน state
    setPromotionListState((prev) => [...prev, createdPromotion]);
    
    toast({
      title: 'โปรโมชั่นถูกเพิ่มแล้ว',
      description: `เพิ่มโปรโมชั่น ${promotionName} สำเร็จ`,
    });

    // รีเซ็ตฟอร์มหลังจากเพิ่ม
    setPromotionName('');
    setPromotionDescription('');
    setPackageId('');
    setCategoryId('');
  } catch (error) {
    toast({
      title: 'เกิดข้อผิดพลาด',
      description: error.response?.data?.message || 'ไม่สามารถเพิ่มโปรโมชั่นได้',
      variant: 'destructive',
    });
  }
}

const handleSelect = (pkg) => {
  setSelectedPackage(pkg);   // เก็บข้อมูลแพ็กเกจที่เลือก
  setQuery(pkg.name);        // ใส่ชื่อแพ็กเกจลงในช่องค้นหา
  setIsDropdownOpen(false);  // ปิด dropdown
};


// show-info option 
const handleEditPricing = (index: number) => {
  const p = selectedPackage.pricing[index];
  setEditIndex(index);
  setEditPrice({
    ageFrom: p.ageFrom.toString(),
    ageTo: p.ageTo.toString(),
    male: p.male.toString(),
    female: p.female.toString(),
  });
};

// check minAge and maxAge
const checkAndUpdateMinMax = async (pricing: Pricing[]) => {
  const newMinAge = Math.min(...pricing.map(p => Number(p.ageFrom)));
  const newMaxAge = Math.max(...pricing.map(p => Number(p.ageTo)));

  const currentMinAge = Number(selectedPackage.minAge);
  const currentMaxAge = Number(selectedPackage.maxAge);

  if (newMinAge !== currentMinAge || newMaxAge !== currentMaxAge) {
    const MinMaxAgeURL = `${config.Packages}/${selectedPackage.id}/minmax`
    await fetch(MinMaxAgeURL, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ minAge: newMinAge, maxAge: newMaxAge }),
    });

    // อัปเดตใน frontend ด้วยถ้าจำเป็น
    setSelectedPackage(prev => ({
      ...prev,
      minAge: newMinAge,
      maxAge: newMaxAge,
    }));
  }
};

const updatePricingInDB = async (updatedPricing: Pricing, index: number) => {
  try {
    // 1. Clone pricing array แล้วอัปเดต index
    const updated = [...selectedPackage.pricing];
    updated[index] = updatedPricing;

    // 2. PATCH เฉพาะ pricing[index]
    const pricingURL = `${config.Packages}/${selectedPackage.id}/pricing/${index}`
    const response = await fetch(pricingURL, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedPricing),
    });

    if (!response.ok) throw new Error("Update failed");

    // 3. ตรวจสอบ minAge/maxAge
    await checkAndUpdateMinMax(updated); // <--- เรียกฟังก์ชันแยก

    toast({ title: "สำเร็จ", description: "อัปเดตราคาเรียบร้อยแล้ว" });
  } catch (error) {
    console.error("Update error:", error);
    toast({ title: "ผิดพลาด", description: "ไม่สามารถอัปเดตได้" });
  }
};

const handleSavePricing = async (index: number) => {
  const newData = {
    ageFrom: parseInt(editPrice.ageFrom),
    ageTo: parseInt(editPrice.ageTo),
    male: parseFloat(editPrice.male),
    female: parseFloat(editPrice.female),
  };

  // 1. อัปเดตใน UI
  const updated = [...selectedPackage.pricing];
  updated[index] = newData;
  setSelectedPackage({ ...selectedPackage, pricing: updated });

  // 2. อัปเดต backend
  await updatePricingInDB(newData, index);

  // 3. ตรวจสอบ min/max
  await checkAndUpdateMinMax(updated);

  setEditIndex(null);
};


  if (loading) {
    return <p>กำลังโหลดข้อมูล...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-brand-green/5">
      <Header />
      <div className="py-8">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-brand-green mb-2">
              ระบบจัดการแพ็คเกจประกัน
            </h1>
            <p className="text-gray-600">
              จัดการราคา แพ็คเกจ และแผนประกันภัย
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <Tabs defaultValue="pricing" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="pricing">จัดการราคา</TabsTrigger>
                <TabsTrigger value="packages">จัดการแพ็คเกจ</TabsTrigger>
                <TabsTrigger value="settings">โปรโมชั่น</TabsTrigger>
              </TabsList>

              <TabsContent value="pricing" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      แก้ไขราคาแพ็คเกจ
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
        <div className="space-y-4">
 <div>
      {/* ช่องค้นหาสำหรับการพิมพ์ */}
      <input
        type="text"
        value={query}
        onChange={handleSearch}
        placeholder="ค้นหาแพ็กเกจ..."
        onFocus={() => setIsDropdownOpen(true)} // เปิด dropdown เมื่อคลิกช่องค้นหา
      />

      {/* แสดงผลลัพธ์การค้นหาผ่าน div dropdown */}
      <div className="relative">
        {isDropdownOpen && (
          <div className="absolute z-10 w-full bg-white border rounded shadow-lg max-h-60 overflow-y-auto">
            {noResults ? (
              <div className="p-2 text-center text-gray-500">ไม่พบข้อมูล</div>
            ) : (
              packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="p-2 cursor-pointer hover:bg-gray-200"
                  onClick={() => handlePackageSelect(pkg)} // เมื่อเลือกแพ็กเกจ
                >
                  {pkg.name}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* แสดงข้อมูลของแพ็กเกจที่เลือก */}
      {selectedPackage && (
        <div className="mt-4">
          <h3 className="text-xl font-semibold">ข้อมูลแพ็กเกจ</h3>
          <p><strong>ชื่อแพ็กเกจ:</strong> {selectedPackage.name}</p>

          {/* แสดง AgeFrom และ AgeTo ที่น้อยที่สุดและมากที่สุดจาก pricing */}
          <div>
            {selectedPackage.pricing && selectedPackage.pricing.length > 0 ? (
              <p>
                อายุที่น้อยที่สุด: {getMinAge(selectedPackage.pricing)} <br />
                อายุที่มากที่สุด: {getMaxAge(selectedPackage.pricing)}
              </p>
            ) : (
              <p>ไม่มีข้อมูลช่วงอายุ</p>
            )}
          </div>
          {/* ปุ่มแสดงข้อมูลเพิ่มเติม */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowMoreInfo(!showMoreInfo)} // Toggle การแสดงข้อมูลเพิ่มเติม
            className="mt-4"
          >
            {showMoreInfo ? "ซ่อนข้อมูลเพิ่มเติม" : "แสดงข้อมูลเพิ่มเติม"}
          </Button>

          {/* แสดงข้อมูลเพิ่มเติมเมื่อคลิก */}
{showMoreInfo && (
  <div className="mt-4">
    <p><strong>หมวดหมู่:</strong> {selectedPackage.categoryId}</p>
    <p><strong>ข้อจำกัดเพศ:</strong> {selectedPackage.genderRestriction}</p>

        <p className="font-semibold mt-4">ช่วงอายุและราคา:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {selectedPackage.pricing.map((price, index) => (
            <div
              key={index}
              className="bg-gray-50 border rounded-lg p-3 flex flex-col justify-between"
            >
              <p className="font-semibold text-brand-green">{price.ageFrom} - {price.ageTo} ปี</p>
              <div className="mt-1 text-sm">
                <p><strong>ราคาหญิง:</strong> ฿{price.female.toLocaleString()}</p>
                <p><strong>ราคาชาย:</strong> ฿{price.male.toLocaleString()}</p>
              </div>

               <Button
                variant="outline"
                size="sm"
                className="mt-2 self-end"
                onClick={() => handleEditPricing(index)}
                >
                  แก้ไข
                </Button>
            </div>
          ))}
        </div>
      </div>
    )}
    {editIndex !== null && (
  <div className="mt-4 p-4 border rounded bg-gray-100 space-y-2">
    <h4 className="text-lg font-semibold text-brand-green">แก้ไขช่วงอายุและราคา</h4>
    <div className="grid grid-cols-2 gap-4">
      <Input
        type="number"
        value={editPrice.ageFrom}
        onChange={(e) => setEditPrice({ ...editPrice, ageFrom: e.target.value })}
        placeholder="อายุจาก"
      />
      <Input
        type="number"
        value={editPrice.ageTo}
        onChange={(e) => setEditPrice({ ...editPrice, ageTo: e.target.value })}
        placeholder="อายุถึง"
      />
      <Input
        type="number"
        value={editPrice.female}
        onChange={(e) => setEditPrice({ ...editPrice, female: e.target.value })}
        placeholder="ราคาหญิง"
      />
      <Input
        type="number"
        value={editPrice.male}
        onChange={(e) => setEditPrice({ ...editPrice, male: e.target.value })}
        placeholder="ราคาชาย"
      />
    </div>

    <div className="flex justify-end space-x-2 mt-4">
      <Button variant="ghost" onClick={() => setEditIndex(null)}>ยกเลิก</Button>
      <Button
        onClick={() => handleSavePricing(editIndex)}
      >
        บันทึก
      </Button>
    </div>
  </div>
)}

    <div className="flex gap-4 mt-6">
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleEditPackage(selectedPackage)}
        className="text-blue-600 hover:text-white hover:bg-blue-600 transition"
      >
        แก้ไข
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => handleDeletePackage(selectedPackage.id)}
        className="text-red-600 hover:text-white hover:bg-red-600 transition"
      >
        ลบ
      </Button>
    </div>
  </div>
)}

</div>

      </div>
</CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>รายการราคาปัจจุบัน</CardTitle>
<div className="relative space-y-2">
  <span
    onClick={() => setShowConfirmDelete(true)}
    className="absolute top-0 right-0 text-sm text-red-500 hover:underline cursor-pointer"
  >
    ลบทั้งหมด
  </span>

  {/* ฟอร์มอื่น ๆ */}

  {showConfirmDelete && (
    <ConfirmDeleteAll onCancel={() => setShowConfirmDelete(false)} />
  )}
</div>

                  </CardHeader>
<CardContent>
      <div className="space-y-2">
        {currentPackages.map((pkg) => (
          <div key={pkg.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium">{pkg.name}</h4> {/* ใช้ pkg.name สำหรับแสดงชื่อแพ็คเกจ */}
              <p className="text-sm text-gray-600">
                ช่วงอายุ: {pkg.minAge ? pkg.minAge : 'ไม่ระบุ'} - {pkg.maxAge ? pkg.maxAge : 'ไม่ระบุ'}
              </p>
            </div>

<div className="flex space-x-4">
  {/* ปุ่มลบพร้อมยืนยัน */}
  <ConfirmDeleteDialog
    packageName={pkg.name}
    onConfirm={() => handleDeletePackage(pkg.id, pkg.name)}
    triggerLabel={
      <span className="text-sm text-red-600 hover:text-white hover:bg-red-600 px-2 py-1 rounded cursor-pointer transition flex items-center space-x-1">
        <Trash2 className="w-4 h-4" />
        <span>ลบ</span>
      </span>
    }
  />

  {/* ปุ่มแก้ไขแบบข้อความ */}
    {/**
  <span
    onClick={() => handleEditPackage(pkg.id, pkg.name)}
    className="text-sm text-blue-600 hover:text-white hover:bg-blue-600 px-2 py-1 rounded cursor-pointer transition flex items-center space-x-1"
  >
    <Edit className="w-4 h-4" />
    <span>แก้ไข</span>
  </span>
   */}
</div>
          </div>
        ))}
      </div>

      {/* แสดงปุ่มเปลี่ยนหน้า */}
      <div className="flex justify-between mt-4">
        <Button onClick={prevPage} disabled={currentPage === 1}>
          ก่อนหน้า
        </Button>
        <Button onClick={nextPage} disabled={currentPage >= Math.ceil(packageList.length / ItemsPerPage)}>
          ถัดไป
        </Button>
      </div>
    </CardContent>
                </Card>
              </TabsContent>

              {/** จัดการแพ็คเกจ */}
          <TabsContent value="packages">
      <Card>
        <CardHeader>
          <CardTitle>จัดการแพ็คเกจ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* ฟอร์มสำหรับกรอกข้อมูลแพ็คเกจ */}
            {/** 
            <div className="space-y-2">
              <Label htmlFor="packageId">ID แพ็คเกจ</Label>
              <Input
                id="packageId"
                value={newPackage.id}
                onChange={(e) => setNewPackage({ ...newPackage, id: e.target.value })}
                placeholder="กรอก ID แพ็คเกจ"
              />
            </div>
            */}
            <div className="space-y-2">
              <Label htmlFor="packageName">ชื่อแพ็คเกจ</Label>
              <Input
                id="packageName"
                value={newPackage.name}
                onChange={(e) => setNewPackage({ ...newPackage, name: e.target.value })}
                placeholder="กรอกชื่อแพ็คเกจ"
              />
            </div>
            <div className="space-y-2">
  {/* แถวหมวดหมู่ + ปุ่ม */}
  <div className="flex justify-between items-center">
    <Label htmlFor="categoryId">หมวดหมู่</Label>

    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => setNewPackage({ ...newPackage, categoryId: "สัญญาเพิ่มเติม" })}
        className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
      >
        สัญญาเพิ่มเติม
      </button>
      <button
        type="button"
        onClick={() => setNewPackage({ ...newPackage, categoryId: "โรคร้ายแรง" })}
        className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
      >
        โรคร้ายแรง
      </button>
      <button
        type="button"
        onClick={() => setNewPackage({ ...newPackage, categoryId: "อุบัติเหตุ" })}
        className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm"
      >
        อุบัติเหตุ
      </button>
    </div>
  </div>

  {/* ช่องกรอกหมวดหมู่ */}
  <Input
    id="categoryId"
    value={newPackage.categoryId}
    onChange={(e) => setNewPackage({ ...newPackage, categoryId: e.target.value })}
    placeholder="กรอกหมวดหมู่"
  />
</div>

            <div className="space-y-2">
              <Label htmlFor="minAge">อายุขั้นต่ำ</Label>
              <Input
                id="minAge"
                type="number"
                value={newPackage.minAge}
                onChange={(e) => setNewPackage({ ...newPackage, minAge: parseInt(e.target.value) })}
                placeholder="กรอกอายุขั้นต่ำ"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxAge">อายุสูงสุด</Label>
              <Input
                id="maxAge"
                type="number"
                value={newPackage.maxAge}
                onChange={(e) => setNewPackage({ ...newPackage, maxAge: parseInt(e.target.value) })}
                placeholder="กรอกอายุสูงสุด"
              />
            </div>
<div className="flex justify-end mt-4">
  <div className="space-y-2">
    <div className="flex items-center gap-4">
<>
  <div className="p-6">
      <h1 className="text-xl font-bold mb-4">อัปโหลดไฟล์ข้อมูล Package</h1>
      <UploadWithConflictDialog />
    </div>

</>
    </div>

    {selectedFile && (
      <div className="text-sm text-gray-600 text-right">
        ไฟล์ที่เลือก: <span className="font-medium">{selectedFile.name}</span>
      </div>
    )}
  </div>
</div>

            {/* ฟอร์มกรอกข้อมูลราคา */}
            <div className="space-y-2">
              <Button onClick={addPricingInput} className="brand-green" disabled={!(newPackage.minAge && newPackage.maxAge)}>
                เพิ่มราคา
              </Button>
            </div>

            {/* แสดงราคาที่เพิ่ม */}
            <div>
              {pricingInputs.map((input, index) => (
                <div key={index} className="space-y-2 mb-4 p-4 border border-gray-300 rounded">
                  <div>
                    <Label>อายุ {input.ageFrom} ถึง {input.ageTo}</Label>
                    <div className="flex gap-4">
                      <Input
                        type="number"
                        value={input.female === 0 ? '' : input.female} // ใช้ค่าว่างถ้าไม่มีข้อมูล
                        onChange={(e) => handlePricingChange(index, 'female', e.target.value)}
                        placeholder="กรอกราคาเพศหญิง"
                      />
                      <Input
                        type="number"
                        value={input.male === 0 ? '' : input.male} // ใช้ค่าว่างถ้าไม่มีข้อมูล
                        onChange={(e) => handlePricingChange(index, 'male', e.target.value)}
                        placeholder="กรอกราคาเพศชาย"
                      />
                    </div>
                  </div>

                  {/* ปุ่มลบราคา */}
                  <Button onClick={() => removePricingInput(index)} className="text-red-600 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                    ลบราคา
                  </Button>
                </div>
              ))}
            </div>

            {/* ปุ่มบันทึกแพ็คเกจ */}
            <Button onClick={handleSavePackage} className="brand-green">
              <Plus className="w-4 h-4 mr-2" />
              เพิ่มแพ็คเกจใหม่
            </Button>
            </div>
        </CardContent>
      </Card>
    </TabsContent>

              <TabsContent value="settings">
                <Card>
                  <CardHeader>
                    <CardTitle>ตั้งค่าระบบ</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
      <h4 className="font-medium">เพิ่มโปรโมชั่น</h4>
      {/* ตัวเลือกประเภทโปรโมชั่น */}
      <div>
        <label>ประเภทโปรโมชั่น</label>
        <div className="space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPromotionType('general')}
            className={promotionType === 'general' ? 'bg-blue-500 text-white' : ''}
          >
            โปรโมชั่นทั่วไป
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPromotionType('package')}
            className={promotionType === 'package' ? 'bg-blue-500 text-white' : ''}
          >
            โปรโมชั่นเฉพาะแพ็คเกจ
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPromotionType('category')}
            className={promotionType === 'category' ? 'bg-blue-500 text-white' : ''}
          >
            โปรโมชั่นเฉพาะสัญญา
          </Button>
        </div>
      </div>

      {/* ฟอร์มกรอกชื่อโปรโมชั่นและรายละเอียด */}
      <input
        type="text"
        placeholder="ชื่อโปรโมชั่น"
        value={promotionName}
        onChange={(e) => setPromotionName(e.target.value)}
        className="input"
      />
      <textarea
        placeholder="รายละเอียดโปรโมชั่น"
        value={promotionDescription}
        onChange={(e) => setPromotionDescription(e.target.value)}
        className="textarea"
      />
      <input
        type="number"
        placeholder="เปอร์เซ็นต์ส่วนลด"
        value={discountPercentage}
        onChange={(e) => setDiscountPercentage(e.target.value)}
        className="input"
      />
      <input
        type="date"
        placeholder="วันที่เริ่มต้น"
        value={validFrom}
        onChange={(e) => setValidFrom(e.target.value)}
        className="input"
      />
      <input
        type="date"
        placeholder="วันที่สิ้นสุด"
        value={validTo}
        onChange={(e) => setValidTo(e.target.value)}
        className="input"
      />

      {/* เงื่อนไขสำหรับ "โปรโมชั่นเฉพาะแพ็คเกจ" */}
      {promotionType === 'package' && (
        <div className="space-y-2">
          <label>กรุณากรอกชื่อแพ็คเกจที่โปรโมชั่นใช้ได้</label>
          <input
            type="text"
            placeholder="ชื่อแพ็คเกจ"
            value={packageId}
            onChange={(e) => setPackageId(e.target.value)}
            className="input"
          />
        </div>
      )}

      {/* เงื่อนไขสำหรับ "โปรโมชั่นเฉพาะ categoryId" */}
      {promotionType === 'category' && (
        <div className="space-y-2">
          <label>กรุณากรอกสัญญาที่โปรโมชั่นใช้ได้</label>
          <input
            type="text"
            placeholder="ชื่อสัญญา"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="input"
          />
        </div>
      )}

      {/* ปุ่มเพิ่มโปรโมชั่น */}
      <Button onClick={handleAddPromotion} className="btn btn-primary">
        เพิ่มโปรโมชั่น
      </Button>
    </div>
                  </CardContent>





<CardContent>
  <div className="space-y-2">
    {currentPromotions.length === 0 ? (
      <div className="text-center text-gray-500 py-6">
        ไม่พบโปรโมชั่นในระบบ
      </div>
    ) : (
      currentPromotions.map((promotion) => (
        <div
          key={promotion.id}
          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
        >
          <div>
            <h4 className="font-medium">{promotion.Name}</h4>
            <p className="text-sm text-gray-600">คำอธิบาย: {promotion.Description}</p>
            <p className="text-sm text-gray-600">ส่วนลด: {promotion.DiscountPercentage}%</p>
            <p className="text-sm text-gray-600">
              วันที่เริ่มต้น: {promotion.ValidFrom || 'ไม่ระบุ'}
            </p>
            <p className="text-sm text-gray-600">
              วันที่สิ้นสุด: {promotion.ValidTo || 'ไม่ระบุ'}
            </p>
          </div>

          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDeletePromotion(promotion.ID)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEditPromotion(promotion.ID)}
              className="text-blue-600 hover:text-blue-700"
            >
              <Edit className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ))
    )}
  </div>

      {/* แสดงปุ่มเปลี่ยนหน้า */}
      <div className="flex justify-between mt-4">
        <Button onClick={prevPage} disabled={currentPage === 1}>
          ก่อนหน้า
        </Button>
        <Button
          onClick={nextPage}
          disabled={currentPage >= Math.ceil(promotionListState.length / ItemsPerPage)}
        >
          ถัดไป
        </Button>
      </div>
    </CardContent>




                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
