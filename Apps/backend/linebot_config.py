# linebot_config.py

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


# อ่านค่า channel secret และ access token จาก env
CHANNEL_SECRET = 'a51b3f381532d12e4a94ade383058a37'
CHANNEL_TOKEN  = 'qyflOf3hPw+QSBsJ2e3VPt+snbADiut9+dTWShe0fq2kB3LyfynsB7V9G0ssAevh96WUzpRcrUxeX+fpvlL1hvLJ3eQvFTZTC4gNILyrJBq+uZiTz2TRAq0mrr9qYCZ6+vZHndC2Dp6GSP6hKdO0oAdB04t89/1O/w1cDnyilFU='
OLLAMA_URL     = 'OLLAMA_URL', 'http://localhost:11434/api/generate'
OLLAMA_MODEL   = 'OLLAMA_MODEL', 'llama3.2'

# สร้าง instances รวมศูนย์
handler = WebhookHandler(CHANNEL_SECRET)
config = Configuration(access_token=CHANNEL_TOKEN)

# helper function สร้าง MessagingApi client
def get_line_api():
    api_client = ApiClient(config)
    return MessagingApi(api_client)