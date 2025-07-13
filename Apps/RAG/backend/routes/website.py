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
from db import collection

# --- routes ---
#from linebot_config import handler, get_line_api, OLLAMA_URL, OLLAMA_MODEL
website_bp = Blueprint('website', __name__, url_prefix='/')


@website_bp.route("/")
def hello_world():
    return "<p>Hello, World!</p>"


@website_bp.route("/store")
def storefront():
    products = list(collection.find({}))
    for p in products:
        p["_id"] = str(p["_id"])
    return render_template("store.html", products=products)