import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { config } from "@/config";

interface ConfirmDeleteAllProps {
  onCancel: () => void; // ฟังก์ชันปิด popup/dialog
}

const ConfirmDeleteAll: React.FC<ConfirmDeleteAllProps> = ({ onCancel }) => {
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(config.Packages, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("ลบไม่สำเร็จ");

      toast({
        title: "สำเร็จ",
        description: "ข้อมูลทั้งหมดถูกลบเรียบร้อยแล้ว",
      });

      setConfirmText("");
      onCancel();
    } catch (err) {
      console.error(err);
      toast({
        title: "ลบไม่สำเร็จ",
        description: "เกิดข้อผิดพลาดระหว่างลบข้อมูล",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-white border p-6 rounded shadow space-y-4">
      <h2 className="text-xl font-bold text-red-600">⚠️ ลบข้อมูลทั้งหมดในระบบ</h2>
      <p className="text-gray-700">
        การกระทำนี้จะลบ <strong>ทุกแพ็กเกจ</strong> อย่างถาวร และไม่สามารถกู้คืนได้
        <br />
        กรุณาพิมพ์ <span className="font-mono font-bold text-red-500">DELETE ALL</span> เพื่อยืนยัน
      </p>

      <Input
        type="text"
        placeholder="พิมพ์ DELETE ALL เพื่อยืนยัน"
        value={confirmText}
        onChange={(e) => setConfirmText(e.target.value)}
      />

      <div className="flex justify-end space-x-2">
        <Button variant="ghost" onClick={onCancel}>
          ยกเลิก
        </Button>
        <Button
          variant="destructive"
          disabled={confirmText !== "DELETE ALL" || isDeleting}
          onClick={handleDelete}
        >
          {isDeleting ? "กำลังลบ..." : "ยืนยันการลบทั้งหมด"}
        </Button>
      </div>
    </div>
  );
};

export default ConfirmDeleteAll;
