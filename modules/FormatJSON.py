import csv
import json
import os

def convert_csv_to_insurance_json(
    input_csv_path: str,
    output_json_path: str,
    default_category: str = "general"
) -> None:
    """
    แปลงไฟล์ .csv ที่มีข้อมูลช่วงอายุ/เบี้ยประกัน เป็น JSON พร้อม import เข้า MongoDB
    Args:
        input_csv_path (str): path ไปยังไฟล์ CSV
        output_json_path (str): path สำหรับบันทึก JSON
        default_category (str): ค่าเริ่มต้นของ categoryId
    """
    packages = {}

    if not os.path.exists(input_csv_path):
        print(f"[!] File not found: {input_csv_path}")
        return

    with open(input_csv_path, newline='', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            # รองรับกรณีมี BOM
            class_name = row.get('Class') or row.get('\ufeffClass')
            if not class_name:
                continue

            try:
                age_range = row['year'].split('-')
                age_from = int(age_range[0])
                age_to = int(age_range[1])
                female = float(row['F'])
                male = float(row['M'])
            except (ValueError, KeyError) as e:
                print(f"❗ Skipping row (bad format): {row} -> {e}")
                continue

            if class_name not in packages:
                packages[class_name] = {
                    "id": class_name.lower().replace(" ", "-").replace("&", "and"),
                    "name": class_name,
                    "categoryId": default_category,
                    "baseMonthly": 0,
                    "baseAnnual": 0,
                    "special": False,
                    "subPackages": None,
                    "genderRestriction": "",
                    "minAge": age_from,
                    "maxAge": age_to,
                    "pricing": []
                }

            packages[class_name]["pricing"].append({
                "ageFrom": age_from,
                "ageTo": age_to,
                "female": female,
                "male": male
            })

            # อัปเดต min/max age
            pkg = packages[class_name]
            pkg["minAge"] = min(pkg["minAge"], age_from)
            pkg["maxAge"] = max(pkg["maxAge"], age_to)

    # เขียนออกเป็น JSON
    with open(output_json_path, 'w', encoding='utf-8') as outfile:
        json.dump(list(packages.values()), outfile, indent=2, ensure_ascii=False)

    print(f"✅ Conversion completed. Output saved to: {output_json_path}")


# ✅ Example usage:
if __name__ == "__main__":
    convert_csv_to_insurance_json(
        input_csv_path="health_happy_kid_f.csv",
        output_json_path="health_happy_kids.json",
        default_category="critical"
    )
