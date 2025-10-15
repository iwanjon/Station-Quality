from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from config import settings


# SQLALCHEMY_DATABASE_URL = settings.SQLALCHEMY_DATABASE_URL or ""
# SQLALCHEMY_DATABASE_URL = 'mysql+pymysql://root:admin@localhost/test'
# SQLALCHEMY_DATABASE_URL = 'sqlite:///./todosapp.db'

engine = create_engine(settings.SQLALCHEMY_DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()
