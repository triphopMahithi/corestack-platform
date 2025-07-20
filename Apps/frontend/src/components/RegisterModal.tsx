import React, { useEffect ,useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { LogIn, Eye, EyeOff } from 'lucide-react';
import { config } from '@/config';
interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string; // รับข้อมูลจาก LoginModal
}

const RegisterModal: React.FC<RegisterModalProps> = ({ isOpen, onClose}) => {
  const [username, setUser] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  // เงื่อนไขการสร้างรหัสผ่าน
  const isStrongPassword = (password: string): boolean => {
  const regex = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
  return regex.test(password);
};
  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);

  // ตรวจสอบความแข็งแรงของรหัสผ่าน
  if (!isStrongPassword(password)) {
    toast({
      title: 'รหัสผ่านไม่ปลอดภัย',
      description: 'รหัสผ่านต้องมีตัวพิมพ์ใหญ่ ตัวพิเศษ และอย่างน้อย 8 ตัวอักษร',
      variant: 'destructive',
    });
    setIsLoading(false);
    return;
  }

  try {
      const res = await fetch(config.Register, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }), // ✳️ ยังไม่แฮชตรงนี้
    });

    const result = await res.json();

    if (!res.ok) throw new Error(result.error || 'เกิดข้อผิดพลาด');

    toast({ title: 'สมัครสมาชิกสำเร็จ', description: `ยินดีต้อนรับ ${username}` });
    setUser('');
    setEmail('');
    setPassword('');
    onClose();
  } catch (error: unknown) {
    let errorMessage = 'เกิดข้อผิดพลาด';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    toast({ title: 'สมัครไม่สำเร็จ', description: errorMessage, variant: 'destructive' });
  } finally {
    setIsLoading(false);
  }
};


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-brand-green">
            ลงทะเบียนสมาชิกใหม่
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">ชื่อผู้ใช้</Label>
            <Input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUser(e.target.value)} // เพิ่ม onChange เพื่อให้สามารถแก้ไขค่าได้
            placeholder="กรอกชื่อผู้ใช้"
            className="border-brand-green/30 focus:border-brand-green"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">อีเมล</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="กรอกอีเมล"
              required
              className="border-brand-green/30 focus:border-brand-green"
            />
          </div>

          <div className="space-y-2">
              <Label htmlFor="password">รหัสผ่าน</Label>

                {/* ห่อด้วย relative container */}
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}  // ✅ ใช้เงื่อนไขแสดงรหัสผ่าน
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="กรอกรหัสผ่าน"
                    required
                    className="border-brand-green/30 focus:border-brand-green pr-10" // ✅ เพิ่ม padding ด้านขวา
                  />

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-auto p-1"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-gray-500" />
                    ) : (
                      <Eye className="w-4 h-4 text-gray-500" />
                    )}
                  </Button>
            </div>
          </div>


          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-brand-green/30 text-brand-green hover:bg-brand-green/10"
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1 brand-green text-white hover:opacity-90"
            >
              {isLoading ? "กำลังสมัคร..." : "สมัครสมาชิก"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RegisterModal;
