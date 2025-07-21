import React, { useState } from "react";
import { config} from '@/config';
import axios from "axios";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface FieldDiff {
  field: string;
  old: unknown;
  new: unknown;
}

interface Conflict {
  id: string;
  diff: FieldDiff[];
  old: Record<string, unknown>;
  new: Record<string, unknown>;
}

export const UploadWithConflictDialog: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const { toast } = useToast();
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null);
  };

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const ConflictURL = `${config.apiBase}/upload`
      const response = await axios.post(ConflictURL, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.conflicts?.length > 0) {
        setConflicts(response.data.conflicts);
        setShowDialog(true);
      } else {
        toast({ title: "อัปโหลดสำเร็จ", description: `${response.data.inserted} รายการถูกเพิ่มแล้ว` });
      }
    } catch (error) {
      toast({ title: "อัปโหลดล้มเหลว", description: "ไม่สามารถอัปโหลดไฟล์ได้", variant: "destructive" });
    }
  };

  const handleConfirmUpload = async () => {
  if (!file) return;

  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await axios.post("http://localhost:8080/api/upload?force=true", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    toast({
      title: "อัปโหลดสำเร็จ",
      description: `${response.data.inserted} รายการถูกเพิ่ม และ ${response.data.updated || 0} รายการถูกอัปเดต`,
    });

    setShowDialog(false);
    setConflicts([]);
  } catch (error) {
    toast({
      title: "เกิดข้อผิดพลาด",
      description: "ไม่สามารถอัปโหลดข้อมูลซ้ำได้",
      variant: "destructive",
    });
  }
};

  function highlightPricingDiff(oldArr: unknown[], newArr: unknown[]) {
  const diffs: boolean[] = [];
  for (let i = 0; i < Math.max(oldArr.length, newArr.length); i++) {
    const oldItem = oldArr[i];
    const newItem = newArr[i];
    diffs.push(JSON.stringify(oldItem) !== JSON.stringify(newItem));
  }
  return diffs;
}

  return (
    <div className="space-y-4">
      <Input type="file" onChange={handleFileChange} />
      <Button onClick={handleUpload}>Upload</Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>พบความขัดแย้งของข้อมูล</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {conflicts.map((conflict) => (
              <div key={conflict.id} className="border p-3 rounded-lg bg-muted">
                <p className="font-semibold text-brand">Package ID: {conflict.id}</p>
                <ul className="list-disc list-inside">
                  {conflict.diff.map((d, idx) => (
            <div key={idx} className="mt-2">
              <p className="font-semibold">{d.field}</p>
              {d.field === "pricing" && Array.isArray(d.old) && Array.isArray(d.new) ? (
                (() => {
                  const diffFlags = highlightPricingDiff(d.old, d.new);
                  return (
                    <div className="grid grid-cols-2 gap-4 border p-2 rounded bg-white text-sm">
                      <div>
                        <p className="underline font-medium text-red-600">ของเดิม</p>
                        {d.old.map((item: unknown, i: number) => (
                          <pre
                            key={i}
                            className={`p-1 rounded overflow-auto whitespace-pre-wrap ${
                              diffFlags[i] ? "bg-red-100" : "bg-muted"
                            }`}
                          >
                            {JSON.stringify(item, null, 2)}
                          </pre>
                        ))}
                      </div>
                      <div>
                        <p className="underline font-medium text-green-700">ของใหม่</p>
                        {d.new.map((item: unknown, i: number) => (
                          <pre
                            key={i}
                            className={`p-1 rounded overflow-auto whitespace-pre-wrap ${
                              diffFlags[i] ? "bg-green-100" : "bg-muted"
                            }`}
                          >
                            {JSON.stringify(item, null, 2)}
                          </pre>
                        ))}
                      </div>
                    </div>
                  );
                })()
              ) : (
                <p>
                  <strong>{d.field}</strong>: เดิม = <span className="text-red-500">{String(d.old)}</span>,
                  ใหม่ = <span className="text-green-600">{String(d.new)}</span>
                </p>
              )}
            </div>
          ))}

                </ul>
              </div>
            ))}
            <div className="flex justify-end space-x-2 pt-2">
              <Button variant="outline" onClick={() => setShowDialog(false)}>ยกเลิก</Button>
              <Button onClick={handleConfirmUpload}>ยืนยันอัปโหลดซ้ำ</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
