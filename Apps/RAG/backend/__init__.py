from flask import Flask, request, abort, jsonify, render_template, Blueprint
# --- routes ---
from routes.website import website_bp
from db import collection

def create_app():
    app = Flask(__name__)
    app.register_blueprint(website_bp)
    return app