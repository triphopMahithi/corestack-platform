# db.py
from pymongo import MongoClient
import os

# อ่านค่า connection string จาก environment variable หรือ config
MONGO_URI = 'mongodb://localhost:27017'
DB_NAME = 'Testing'
COLLECTION_NAME = 'Packages'

client = MongoClient(MONGO_URI)
db = client[DB_NAME]
collection = db[COLLECTION_NAME]
