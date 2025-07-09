
export const createFormStepHandlers = ({
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
  toast,
}: any) => {
  return {
    handlePackageSelection: () => {
      if (!formData.gender || !formData.currentAge) {
        toast({
          title: "ข้อมูลไม่ครบ",
          description: "กรุณากรอกข้อมูลส่วนตัวก่อนเลือกแพ็กเกจ",
          variant: "destructive",
        });
        return;
      }
      setCurrentStep(1);
    },

    selectPackage: (packageName: string) => {
      setStepData({ ...stepData, selectedPackage: packageName, selectedPlan: '' });
      setCurrentStep(2);
      toast({
        title: "เลือกแพ็กเกจสำเร็จ",
        description: `เลือก ${packageName} แล้ว`,
      });
    },

    selectPlan: (planName: string) => {
      setStepData({ ...stepData, selectedPlan: planName });
      setCurrentStep(3);
      toast({
        title: "เลือกแผนสำเร็จ",
        description: `เลือก ${planName} แล้ว`,
      });
    },

    handleSave: () => {
      setFormData({
        ...formData,
        packages: [stepData.selectedPackage],
        plans: [stepData.selectedPlan],
      });
      setStepData({ ...stepData, savedData: true });
      setShowResult(true);
      toast({
        title: "บันทึกสำเร็จ",
        description: "บันทึกข้อมูลประกันเรียบร้อย",
      });
    },

    resetForm: () => {
      setFormData({
        gender: '',
        currentAge: '',
        coverageAge: '',
        paymentFrequency: 'annual',
        plans: [],
        packages: [],
      });
      setCurrentStep(0);
      setStepData({
        selectedPackage: '',
        selectedPlan: '',
        searchResults: null,
        savedData: null,
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
    },

    goBackStep: () => {
      if (typeof stepData.currentStep === 'number' && stepData.currentStep > 0) {
        setCurrentStep((prev: number) => prev - 1);
      }
    },
  };
};
