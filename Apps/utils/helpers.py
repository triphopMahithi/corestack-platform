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

def time_alert():
    return strftime("%a, %d %b %Y %H:%M:%S %z", localtime())

# Helper to convert ObjectId
def serialize_doc(doc):
    doc['_id'] = str(doc['_id'])
    return doc

def parse_search_params(user_input: str):
    """
    แยกค่าจาก user_input: แผน, อายุ, เพศ
    คืนค่า tuple (plan_code:str|None, age:int|None, sex:'M'|'F'|None)
    """
    class_m = re.search(r"แผน\s+(.+?)(?=\s*(อายุ|เพศ|$))", user_input, re.IGNORECASE)
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

MAX_LENGTH = 5000
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

def regular_expression_search(keywords : list[str]) -> str:
    """
    รับลิสต์ของคำค้นหา แล้วสร้าง regex pattern ที่แมตช์คำตามลำดับ
    """
    return ".*" + ".*".join(map(re.escape, keywords)) + ".*"
    

def is_ollama_online(OLLAMA_URL,timeout: float = 2.0) -> bool:
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
