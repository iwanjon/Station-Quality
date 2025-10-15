import os
from pydantic_settings import BaseSettings

STATIC= "static"
RESPONSE_PATH = os.path.join("public","response")
RESPONSE_PATH_URL = "public/response/"
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_FOLDER = os.path.join(BASE_DIR, STATIC,RESPONSE_PATH)