#!usr/bin/env python3

# setup.py

# --- Standard library ---
import os
import re
import json
import logging
from time import localtime, strftime

# --- Third-party libraries ---
from flask import Flask, request, abort, jsonify, render_template, Blueprint
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
from utils.helpers import *

# --- routes ---
from db import collection
from routes.website import website_bp


#--- config --- 
from dotenv import load_dotenv
load_dotenv()

# --- environment variables ---
CHANNEL_SECRET = os.getenv("CHANNEL_SECRET")
CHANNEL_TOKEN = os.getenv("CHANNEL_TOKEN")
OLLAMA_URL = os.getenv("OLLAMA_URL")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL")
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
MONGO_DB = os.getenv("MONGO_DB", "Testing")
MONGO_DB_COLLECTION = os.getenv("MONGO_DB_COLLECTION", "Packages")

# YOUR_CHANNEL_ACCESS_TOKEN AND YOUR_CHANNEL_SECRET
configuration = Configuration(access_token=CHANNEL_TOKEN)
handler = WebhookHandler(CHANNEL_SECRET)
# Database
CLIENT = MongoClient(MONGO_URI)
db = CLIENT[MONGO_DB]
COLLECTION=db[MONGO_DB_COLLECTION]


# --- Initialize Flask app ---
from __init__ import create_app
app = create_app()

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


#! FIX: Non-Length must be between 0 and 5000 [text-length] 
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
            print(f"user_input: {user_input}, plan_code: {plan_code}, age: {age},")
            # ดึงข้อมูลจาก DB
            keywords = plan_code.split()
            pattern = regular_expression_search(keywords=keywords) if keywords else None
            query = {"Class": {"$regex": pattern, "$options": "i"}} if keywords else {}
            docs = list(COLLECTION.find(query))

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
                        messages=[TextMessage(text="ไม่สามารถส่งข้อความได้ เนื่องจากข้อความยาวเกิน 5000 ตัวอักษร")]
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
    os.system('cls' if os.name == 'nt' else 'clear')
    is_ollama_online(OLLAMA_URL=OLLAMA_URL)
    app.run(debug=True)
