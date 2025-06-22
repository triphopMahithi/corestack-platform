#!usr/bin/env python3

# -*- coding: utf-8 -*-
"""
    PEP8 Style 
"""
# --- Standard library ---
import os
import re
import json
import logging
from time import localtime, strftime

# --- Third-party libraries ---
from flask import Flask, request, abort, jsonify, render_template
import requests
import ollama
from pymongo import MongoClient
import pandas as pd
from linebot.v3 import WebhookHandler
from linebot.v3.exceptions import InvalidSignatureError
from linebot.v3.messaging import (
    Configuration,
    ApiClient,
    MessagingApi,
    ReplyMessageRequest,
    TextMessage,
)
from linebot.v3.webhooks import MessageEvent, TextMessageContent


os.system('cls' if os.name == 'nt' else 'clear')
time_alert = strftime("%a, %d %b %Y %H:%M:%S %z", localtime())

app = Flask(__name__)

# YOUR_CHANNEL_ACCESS_TOKEN AND YOUR_CHANNEL_SECRET
configuration = Configuration(access_token='qyflOf3hPw+QSBsJ2e3VPt+snbADiut9+dTWShe0fq2kB3LyfynsB7V9G0ssAevh96WUzpRcrUxeX+fpvlL1hvLJ3eQvFTZTC4gNILyrJBq+uZiTz2TRAq0mrr9qYCZ6+vZHndC2Dp6GSP6hKdO0oAdB04t89/1O/w1cDnyilFU=')
handler = WebhookHandler('a51b3f381532d12e4a94ade383058a37')
MAX_LENGTH = 5000
# Generative AI 
OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "llama3.2"
# Database
client = MongoClient('mongodb://localhost:27017/')
collection = client["Testing"]["Packages"]

# ——— Helper functions ———


# Helper to convert ObjectId
def serialize_doc(doc):
    doc['_id'] = str(doc['_id'])
    return doc

def parse_search_params(user_input: str):
    """
    แยกค่าจาก user_input: แผน, อายุ, เพศ
    คืนค่า tuple (plan_code:str|None, age:int|None, sex:'M'|'F'|None)
    """
    class_m = re.search(r"\bแผน\s*([A-Za-z0-9]+)\b", user_input, re.IGNORECASE)
    age_m   = re.search(r"อายุ\s*(\d{1,3})", user_input)
    sex_m   = re.search(r"(ชาย|หญิง)", user_input)

    plan_code = class_m.group(1).upper() if class_m else None
    age       = int(age_m.group(1))     if age_m   else None
    sex       = 'M' if sex_m and sex_m.group(1) == 'ชาย' else \
                'F' if sex_m                 else None

    return plan_code, age, sex

def within_age_range(age: int, expr: str) -> bool:
    """ตรวจสอบว่า age อยู่ในช่วงที่ระบุใน expr เช่น '10-20'"""
    m = re.match(r"(\d+)\s*(?:-|–|ถึง)\s*(\d+)", expr)
    if not m:
        return False
    low, high = int(m.group(1)), int(m.group(2))
    return low <= age <= high

def determine_price(doc: dict, sex: str|None) -> str|int|float:
    """
    ถ้ามี sex ให้ return ราคาตาม sex
    ถ้าไม่มี sex ให้ return dict-string ของทั้ง M และ F
    """
    if sex in ('M','F'):
        return doc.get(sex, 'ไม่มีข้อมูลราคา')
    # ไม่มีเพศระบุ
    return {
        'M': doc.get('M', 'ไม่มีข้อมูล'),
        'F': doc.get('F', 'ไม่มีข้อมูล'),
    }

def format_price(price: str|int|float|dict) -> str:
    """ฟอร์แมตราคาให้เป็นสตริงพร้อมหน่วย 'บาท'"""
    if isinstance(price, (int, float)):
        return f"{price:,} บาท"
    if isinstance(price, dict):
        m = price['M']
        f = price['F']
        m_txt = f"{m:,} บาท" if isinstance(m, (int,float)) else m
        f_txt = f"{f:,} บาท" if isinstance(f, (int,float)) else f
        return f"ชาย: {m_txt}\nหญิง: {f_txt}"
    return str(price)

def split_into_chunks(text: str, size: int = MAX_LENGTH) -> list[str]:
    """แบ่งข้อความเป็นชิ้นๆ ไม่ให้ยาวเกิน size"""
    return [text[i:i+size] for i in range(0, len(text), size)]

def safe_reply(line_bot_api, reply_token: str, full_text: str):
    """
    ส่งข้อความกลับผู้ใช้ โดยแบ่ง chunk ถ้าความยาวเกิน MAX_LEN
    """
    chunks = split_into_chunks(full_text)
    for chunk in chunks:
        line_bot_api.reply_message_with_http_info(
            ReplyMessageRequest(
                reply_token=reply_token,
                messages=[TextMessage(text=chunk)]
            )
        )

def is_ollama_online(timeout: float = 2.0) -> bool:
    """
    ตรวจสอบว่า Ollama พร้อมให้บริการ
    คืนค่า True ถ้าสถานะ HTTP 200, False ถ้าไม่สำเร็จ
    """
    try:
        resp = requests.get(f"{OLLAMA_URL}/v1/models", timeout=timeout)
        return resp.status_code == 200
    except requests.RequestException as e:
        logging.error(f"[HealthCheck] ไม่สามารถติดต่อ Ollama ได้: {e}")
        return False

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
#! FIX: Error Code

@handler.add(MessageEvent, message=TextMessageContent)
def handle_message(event):
    user_input = event.message.text.strip()

    with ApiClient(configuration) as api_client:
        line_bot_api = MessagingApi(api_client)

        try:
            # ——— กรณีทั่วไป: ส่งให้ LLM ———
            if not re.search(r"\bsearch\b", user_input, re.IGNORECASE):
                payload = {
                    "model": OLLAMA_MODEL,
                    "prompt": user_input,
                    "stream": False
                }
                resp = requests.post(OLLAMA_URL, json=payload)
                resp.raise_for_status()
                answer = resp.json().get("response", "ไม่สามารถตอบกลับได้")

                line_bot_api.reply_message_with_http_info(
                    ReplyMessageRequest(
                        reply_token=event.reply_token,
                        messages=[TextMessage(text=answer)]
                    )
                )
                return  # **ออกจากฟังก์ชันทันที** เพื่อไม่ให้รันโค้ดข้างล่างต่อ

            # ——— กรณี search: ดึง param แล้วค้นหา ———
            plan_code, age, sex = parse_search_params(user_input)

            if not any([plan_code, age, sex]):
                msg = (
                    "กรุณาระบุอย่างน้อย 'แผน', 'อายุ' หรือ 'เพศ' อย่างใดอย่างหนึ่ง\n"
                    "ตัวอย่างที่ถูกต้อง: search อายุ 35 เพศชาย แผน 5M ✅"
                )
                line_bot_api.reply_message_with_http_info(
                    ReplyMessageRequest(
                        reply_token=event.reply_token,
                        messages=[TextMessage(text=msg)]
                    )
                )
                return

            # ดึงข้อมูลจาก DB
            query = {"Class": {"$regex": plan_code, "$options": "i"}} if plan_code else {}
            docs = list(collection.find(query))

            # สร้างข้อความผลลัพธ์
            lines = [f"ค้นหาจากทั้งหมด {len(docs)} รายการ"]
            for doc in docs:
                if age is not None and 'year' in doc and not within_age_range(age, doc['year']):
                    continue
                price_raw  = determine_price(doc, sex)
                price_txt  = format_price(price_raw)
                year_txt   = doc.get('year', 'ไม่ระบุช่วงอายุ')
                lines.append(f"🔎 แผน {doc['Class']} ({year_txt})\n{price_txt}")

            result = "\n\n".join(lines) if len(lines)>1 else "❗ ไม่พบข้อมูลตามที่ระบุครับ"
            
            # --- ส่งข้อความกลับทาง LINE เราใช้ฟังก์ชัน safe_reply เพื่อจัดการข้อความยาวเกิน 5000 ตัวอักษร ---
            try:
                safe_reply(line_bot_api, event.reply_token, result)
            except Exception as e:    
                logging.error(f"Error sending reply: {e}")
                # fallback to sending a simple message
                line_bot_api.reply_message_with_http_info(
                    ReplyMessageRequest(
                        reply_token=event.reply_token,
                        messages=[TextMessage(text="ไม่สามารถส่งข้อความได้")]
                    )
                )

        except Exception as e:
            # กรณีเกิด error ระหว่างประมวลผล
            error_msg = f"เกิดข้อผิดพลาด: {e}"
            line_bot_api.reply_message_with_http_info(
                ReplyMessageRequest(
                    reply_token=event.reply_token,
                    messages=[TextMessage(text=error_msg)]
                )
            )

if __name__ == "__main__":
    is_ollama_online()
    app.run()