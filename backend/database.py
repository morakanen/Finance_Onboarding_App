
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from pymongo import MongoClient
from dotenv import load_dotenv

import os

load_dotenv()


#Mongo connection
Mongo_URI = os.getenv('MONGO_URL')
client = MongoClient(Mongo_URI)
mdb =client["docdatabase"]


#postgres connection
DATABASE_URL = os.getenv("DATABASE_URL")
from backend import models
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()