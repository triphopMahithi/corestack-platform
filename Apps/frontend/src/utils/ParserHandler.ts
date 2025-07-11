/**
 * แปลง string เช่น "15M", "500K", "2.5B" ให้เป็นตัวเลข
 * หากไม่พบตัวเลข+หน่วยในข้อความ จะ return null
 */
export const parseCoverageFromText = (text: string): number | null => {
  const pattern = /(\d+(?:\.\d+)?)([KMB])/i; // ตัวเลข + หน่วย
  const match = text.match(pattern);

  if (!match) return null;

  const value = parseFloat(match[1]);
  const unit = match[2].toUpperCase();

  switch (unit) {
    case 'K':
      return value * 1_000;
    case 'M':
      return value * 1_000_000;
    case 'B':
      return value * 1_000_000_000;
    default:
      return null;
  }
};
