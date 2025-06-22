from flask import Flask, request, abort, jsonify, render_template
import requests
import ollama
import re
import json
import logging

from pymongo import MongoClient 
import pandas as pd

from linebot.v3 import (
    WebhookHandler
)
from linebot.v3.exceptions import (
    InvalidSignatureError
)
from linebot.v3.messaging import (
    Configuration,
    ApiClient,
    MessagingApi,
    ReplyMessageRequest,
    TextMessage
)
from linebot.v3.webhooks import (
    MessageEvent,
    TextMessageContent
)

import os
os.system('cls' if os.name == 'nt' else 'clear')

app = Flask(__name__)

# YOUR_CHANNEL_ACCESS_TOKEN AND YOUR_CHANNEL_SECRET
configuration = Configuration(access_token='qyflOf3hPw+QSBsJ2e3VPt+snbADiut9+dTWShe0fq2kB3LyfynsB7V9G0ssAevh96WUzpRcrUxeX+fpvlL1hvLJ3eQvFTZTC4gNILyrJBq+uZiTz2TRAq0mrr9qYCZ6+vZHndC2Dp6GSP6hKdO0oAdB04t89/1O/w1cDnyilFU=')
handler = WebhookHandler('a51b3f381532d12e4a94ade383058a37')

# Generative AI 
OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "llama3.2"
# Database
client = MongoClient('mongodb://localhost:27017/')
collection = client["Testing"]["Packages"]

# Helper to convert ObjectId
def serialize_doc(doc):
    doc['_id'] = str(doc['_id'])
    return doc

@app.route("/")
def hello_world():
    return "<p>Hello, World!</p>"

@app.route("/data")
def get_data():
    data_cursor = collection.find(filter=filter)
    data = [serialize_doc(doc) for doc in data_cursor]
    return jsonify(data)

@app.route("/api/products")
def get_products():
    products = collection.find({})
    return jsonify([serialize_doc(p) for p in products])

@app.route("/store")
def storefront():
    products = list(collection.find({}))
    for p in products:
        p["_id"] = str(p["_id"])
    return render_template("store.html", products=products)

@app.route("/callback", methods=['POST'])
def callback():
    # get X-Line-Signature header value
    signature = request.headers['X-Line-Signature']

    # get request body as text
    body = request.get_data(as_text=True)
    app.logger.info("Request body: " + body)

    # handle webhook body
    try:
        handler.handle(body, signature)
    except InvalidSignatureError:
        app.logger.info("Invalid signature. Please check your channel access token/channel secret.")
        abort(400)

    return 'OK'

def ask_ollama(prompt):
    payload = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False
    }
    response = requests.post(OLLAMA_URL, json=payload)
    response.raise_for_status()
    return response.json().get("response", "")

#! FIX: Non-Length must be between 0 and 5000 [text-length] 
@handler.add(MessageEvent, message=TextMessageContent)
def handle_message(event):
    with ApiClient(configuration) as api_client:
        line_bot_api = MessagingApi(api_client)
        user_input = event.message.text.strip()

        try:
            if re.search(r'\bsearch\b', user_input, re.IGNORECASE):

                # --- ดึง keyword สำคัญ ---
                #class_match = re.search(r"แผน\s?([A-Z0-9]+)", user_input, re.I)
                
                class_match = re.search(r"แผน\s+(.+?)(?:\s|$)", user_input, re.I)
                age_match = re.search(r"(อายุ\s?)?(\d{2})", user_input)
                sex_match = re.search(r"(ชาย|หญิง)", user_input)

                if not class_match and not age_match and not sex_match:
                    res = "กรุณาระบุอย่างน้อย 'แผน', 'อายุ' หรือ 'เพศ' อย่างใดอย่างหนึ่ง\nตัวอย่างที่ถูกต้อง: search อายุ 35 เพศชาย แผน 5M ✅"
                else:
                    if class_match:
                        # Query to database
                        #class_name = class_match.group(1).upper()
                        #query = {"Class": {"$regex": f"^{class_name}$", "$options": "i"}}
                        class_name = class_match.group(1).strip()
                        query = {"Class": {"$regex": class_name, "$options": "i"}}

                        all_data = list(collection.find(query))
                        result_text = ""
                        print(f"[DEBUG] keyword for searching in Class: {class_name}")

                        for doc in all_data:
                            
                            if age_match:
                                age = int(age_match.group(2))
                                
                                if "year" in doc:
                                    #match = re.match(r"(\d+)\D+(\d+)", doc["year"])
                                    match = re.match(r"(\d+)\s*(?:-|–|ถึง)\s*(\d+)", doc["year"])
                                    if match:
                                        if not (int(match.group(1)) <= age <= int(match.group(2))):
                                            continue
                                        else:
                                            # มีปัญหา regex แต่ส่งข้อความไปแล้ว
                                            print(f"[WARNING] not match regex: {doc['year']} - (s:sent)")
                            
                            if sex_match:
                                sex = "M" if "ชาย" in sex_match.group(1) else "F"
                                price = doc.get(sex, "ไม่มีข้อมูลราคา")
                            else:
                                price = f"ชาย: {doc.get('M', 'ไม่มีข้อมูล')} | หญิง: {doc.get('F', 'ไม่มีข้อมูล')}"
                            

                            # ตรวจสอบว่าเป็น text หรือ float -> ถ้าไม่มีเวลาเรียกใช้ search แผน XX จะพบปัญหาเพราะดึงข้อมูลที่เป็น str ออกมาด้วย
                            if isinstance(price, (int, float)):
                                price_text = f"{price:,} บาท"
                            else:
                                price_m = doc.get("M", "ไม่มีข้อมูล")
                                price_f = doc.get("F", "ไม่มีข้อมูล")


                                if isinstance(price_m, (int, float)):
                                    price_m = f"{price_m:,} บาท"
                                if isinstance(price_f, (int, float)):
                                    price_f = f"{price_f:,} บาท"

                                price_text = f"ชาย: {price_m}\nหญิง: {price_f}"

                            result_text += f"🔎แผน {doc['Class']} ({doc.get('year', 'ไม่ระบุช่วงอายุ')})\n{price_text}\n\n"
                        
                        # แสดงผลลัพธ์ทั้งหมดที่ค้นหาได้จาก Database
                        result_text = f'ค้นหาจากทั้งหมด {len(all_data)}\n ' + result_text
                        print(f"[INFO] string-length: {len(result_text)}")

                        if result_text:
                            res = result_text.strip()
                        else:
                            res = "❗ ไม่พบข้อมูลตามที่ระบุครับ"

            else:
                # --- ใช้ Ollama ---
                payload = {
                    "model": OLLAMA_MODEL,
                    "prompt": user_input,
                    "stream": False
                }

                response = requests.post(OLLAMA_URL, json=payload)
                response.raise_for_status()
                result = response.json()
                res = result.get("response", "ไม่สามารถตอบกลับได้")

        except Exception as e:
            res = f"เกิดข้อผิดพลาด: {str(e)}"

        # --- ส่งกลับไปยัง LINE ---
        line_bot_api.reply_message_with_http_info(
            ReplyMessageRequest(
                reply_token=event.reply_token,
                messages=[TextMessage(text=res)]
            )
        )

if __name__ == "__main__":
    app.run()