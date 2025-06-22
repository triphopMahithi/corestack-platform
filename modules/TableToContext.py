#!/usr/bin/env python3
import pandas as pd
import re

def clean_value(series: pd.Series) -> pd.Series:
    """
    แปลงค่าจากสตริงให้เป็น float โดยรองรับ:
      - (123) → -123
      - คั่นพันด้วย comma (e.g. 12,345.67) → drop comma
      - comma เดี่ยวๆ เป็น decimal (e.g. 12345,67) → แปลงเป็น dot
      - เอา symbol หรืออักษรอื่นๆ ทิ้ง
      - ผิดรูป → NaN
    """
    s = series.astype(str).str.strip()

    # (123) → -123
    s = s.str.replace(r'^\((.*)\)$', r'-\1', regex=True)

    # ถ้า pattern เป็น [-]?xxx,xxx[,xxx]*[.yyy]?  → comma คือ thousands separator
    mask_thousand = s.str.match(r'^\-?\d{1,3}(?:,\d{3})+(?:\.\d+)?$')
    s.loc[mask_thousand] = (
        s.loc[mask_thousand]
        .str.replace(',', '', regex=False)
    )

    # ถ้ามี comma แต่ไม่มี dot → comma เป็น decimal separator
    mask_decimal = s.str.contains(',') & ~s.str.contains(r'\.')
    s.loc[mask_decimal] = (
        s.loc[mask_decimal]
        .str.replace(',', '.', regex=False)
    )

    # เอา char อื่นๆ (currency symbol, space ฯลฯ) ทิ้ง
    s = s.str.replace(r'[^\d\.\-]+', '', regex=True)

    # แปลงเป็น float (error → NaN)
    return pd.to_numeric(s, errors='coerce')

class TableToContext:
    def __init__(self, filepath):
        self.df = self.ToDataFrame(filepath)
    
    @staticmethod
    def clean_value(series: pd.Series) -> pd.Series:
        s = series.astype(str).str.strip()
        s = s.str.replace(r'^\((.*)\)$', r'-\1', regex=True)
        mask_thousand = s.str.match(r'^\-?\d{1,3}(?:,\d{3})+(?:\.\d+)?$')
        s.loc[mask_thousand] = s.loc[mask_thousand].str.replace(',', '', regex=False)
        mask_decimal = s.str.contains(',') & ~s.str.contains(r'\.')
        s.loc[mask_decimal] = s.loc[mask_decimal].str.replace(',', '.', regex=False)
        s = s.str.replace(r'[^\d\.\-]+', '', regex=True)
        return pd.to_numeric(s, errors='coerce')

    def ToDataFrame(self, filepath : str) -> pd.DataFrame:
        """
            Form : year,Package1_Gender, ...
            (!) Example : year, package1_M, package1_F, ...,packageN_M, packageN_F

        """
        try:
            df = pd.read_csv(filepath)
            df = pd.melt(df, id_vars=['year'], var_name='Category', value_name='Value')
            # label mapping
            df['year'] = (
            df['year']
            .astype(str)
            .str.replace(r'["\',*]', '', regex=True)   
            .str.replace(r'\s+', 'ถึง', regex=True)   

            )

            #df['Value'] = df['Value'].str.replace(',', '').astype(float)
            #df['Value'] = clean_value(df['Value'])
            df['Value'] = self.clean_value(df['Value'])
                # รหัส X เราจะถือว่าไม่ทราบแผน
            #df[['Class', 'Gender']] = df['Category'].str.extract(r'(\d+[SNXKMBTGL])_(M|F)')
            df[['Class', 'Gender']] = df['Category'].str.extract(r'(?P<Class>[^_]+)_(?P<Gender>[MF])')
            df = df.pivot_table(
                index=['year', 'Class'],
                columns='Gender',
                values='Value'
            ).reset_index()
            df.columns.name = None

            return df
        except Exception as e:
            raise ValueError("DataFormError: expected format year,Package1_Gender,...") from e
    
    def render_template(self, template):
        """
        template: str, e.g. "อายุ {year} แผน {Class} เพศ {Gender} เบี้ย {Value:,.0f} บาท"
        จะวนรอบคอลัมน์ 'F' และ 'M' สร้างข้อความแยกกัน
        """
        df = self.df.copy()
        output = []
    
        gender_map = {'F': 'หญิง', 'M': 'ชาย'}
    
        for _, row in df.iterrows():
            for gender_code in ['F', 'M']:
                if pd.notna(row[gender_code]):
                    text = template.format_map({
                        'year': row['year'],
                        'Class': row['Class'],
                        'Gender': gender_map[gender_code],
                        'Value': row[gender_code]
                    })
                    output.append(text)
    
        return output
