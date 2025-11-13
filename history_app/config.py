# config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # debug: bool = False
    # database_url: str
    # secret_key: str
    SQLALCHEMY_DATABASE_URL:str
    INV_URL:str
    # LOKI_URL:str
    LOG_FILE_PATH:str

    class Config:
        env_file = ".env"  # Optional if you're using python-dotenv
        extra='ignore'    # This is the key setting

settings = Settings()
