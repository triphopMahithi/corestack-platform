#!/usr/bin/env python3
from modules.TableToContext import TableToContext
from modules.PDFBuilder import PDFBuilder
from modules.Shopping import Product, User, AddItem, Cart
import pandas as pd
import os 



def table_to_context(filepath : str, file_name : str) -> None:
    print('====== TableToContext ======')
    table = TableToContext(filepath)
    # หากต้องการดูข้อมูลที่เป็น DataFrame สามารถเรียกใช้ method ToDataFrame
    table = table.ToDataFrame(filepath=filepath) 
    print(table.to_csv(file_name+'.csv', index=False))

def builder_test(filepath : str, template : str,file_name : str) -> None:
    print('====== PDFBuilder ======')

    table = TableToContext(filepath)
    lines = table.render_template(template)
    
    # export (pdf) version 0.0.1
    (PDFBuilder(font_path=font_path)
        .setup()
        .add_lines(lines=lines)
        .save(file_name +".pdf")
        .execute())

    # version 0.0.0

        # PDF = PDFBuilder(font_path=font_path)
        # SETUP = PDF.setup()
        # add_line = PDF.add_lines(lines=lines)
        # output = PDF.save(filename='test.pdf')


def run_shop_interface(add_item, cart) -> None:
    print('====== Interface ======')
    product_dict = {
        p.id: p for p in add_item.to_products()
    }
    while True:
        print("\n=== เมนูร้านค้า ===")
        print("0 - แสดงรายการสินค้า")
        print("1 - เพิ่มสินค้าเข้าตะกร้า")
        print("2 - แสดงตะกร้าสินค้า")
        print("x - ออกจากระบบ")
        choice = input("(shop)> ").strip()

        if choice == "0":
            os.system("cls" if os.name == "nt" else "clear")
            print("\n รายการสินค้า:\n")
            print(add_item.show_item())

        elif choice == "1":
            user_input = input("กรุณาระบุรหัสสินค้าและจำนวน (เช่น: P002 2): ").strip().split()
            if len(user_input) != 2:
                print("  รูปแบบไม่ถูกต้อง กรุณากรอกในรูปแบบ: PXXX จำนวน")
                continue

            product_id, quantity_str = user_input
            if product_id not in product_dict:
                print(f" ไม่พบสินค้า ID: {product_id}")
                continue

            try:
                quantity = int(quantity_str)
                if quantity <= 0:
                    raise ValueError
            except ValueError:
                print("  กรุณากรอกจำนวนเป็นเลขจำนวนเต็มที่มากกว่า 0")
                continue

            cart.add_item(product_dict[product_id], quantity)
            print(f" เพิ่มสินค้า {product_id} จำนวน {quantity} ชิ้น เรียบร้อยแล้ว")

        elif choice == "2":
            os.system("cls" if os.name == "nt" else "clear")
            print("\n ตะกร้าสินค้าของคุณ:\n")
            cart.view_cart()

        elif choice.lower() == "x":
            print(" ขอบคุณที่ใช้บริการ")
            break

        else:
            print("  กรุณาเลือกเมนูที่ถูกต้อง (0, 1, 2, x)")


# paths and template

filepath = 'Data\csv\health_saver_origin.csv'
template = "อายุ {year} แผน {Class} เพศ {Gender} เบี้ยประกัน {Value:,.0f} บาท"
font_path = 'modules\THSarabunNew.ttf'
df = pd.read_csv('out.csv')

# สร้าง object ผ่าน class TableToContext

table = TableToContext(filepath)
lines = table.render_template(template)

# Shopping
add_item = AddItem(df)
cart = Cart()
#print(type(cart))
def main():
    print("started")
    #builder_test(filepath=filepath, template=template,file_name='test1')
    #table_to_context(filepath=filepath, file_name='out')
    run_shop_interface(add_item=add_item, cart=cart)

if __name__ == "__main__":
    main()