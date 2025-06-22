from typing import Callable, List, Dict
import pandas as pd

class Product:
    # Encapsulation
    def __init__(self, product_id, name, price):
        self.id = product_id
        self.name = name
        self.price = price 

class CartItem:
    # Encapsulation
    def __init__(self, product : Product, quantity : int):
        self.product = product
        self.quantity = quantity

class AddItem:
    def __init__(self, data: pd.DataFrame, key_cols: List[str] = ['year','Class']):
        value_vars = [val for val in data.columns if val not in key_cols]
        self.price_table = data.melt(
            id_vars=key_cols,
            value_vars=value_vars,
            var_name='gender',
            value_name='price'
        )
    
    def to_products(self) -> List[Product]:
        products = []
        for i, (_, row) in enumerate(self.price_table.iterrows(), start=1):
            product_id = "P%03d" % i  # สร้าง id สินค้า
            name = f"{row['Class']} ({row['gender']}) {row['year']}"
            product = Product(product_id, name, row['price']) # เก็บข้อมูลจาก csv ไปเก็บใน class -> Product (id, name, price)
            products.append(product)
        return products

    def show_item(self) -> str:
        lines = []
        products = self.to_products()

        for i, product in enumerate(products, start=1):
            line = "ID: %-4s | Name: %-25s | P: %7.2f บาท |" % (
                product.id, product.name, product.price
            )
            lines.append(line)

        return "\n".join(lines)

class Cart:
    def __init__(self):
        self.items: Dict[str, CartItem] = {}

    def add_item(self, product: Product, quantity: int):
        if product.id in self.items:
            self.items[product.id].quantity += quantity
        else:
            self.items[product.id] = CartItem(product, quantity)

    def remove_item(self, product_id : str, quantity : int = 1):
        if  product_id not in self.items:
            print(f"[x] ไม่พบสินค้า {product_id} ในตะกร้า")
            return
        
        item = self.items[product_id]
        if quantity >= item.quantity:
            del self.items[product_id]
            print(f"ลบสินค้า {product_id} ออกจากตะกร้า \n")
        else:
            item.quantity -= quantity
            print(f"ลดสินค้า {product_id} ลง {quantity} ชิ้น (เหลือ {item.quantity}) \n")

    def view_cart(self):
        total = 0
        for item in self.items.values():
            subtotal = item.product.price * item.quantity
            print(f"{item.product.name} (x{item.quantity}) = {subtotal} บาท")
            total += subtotal
        print(f"\nรวมทั้งหมด: {total} บาท")

class User:
    def __init__(self, user_id):
        self.user_id = user_id
        self.cart = Cart()