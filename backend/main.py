import uvicorn
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from sqlalchemy.orm import Session
from database import engine,Base,get_db,mdb

app = FastAPI()

origins = [
    "http://localhost:3000",
    "https://finance-onboarding-app.vercel.app/"
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import models

# Create tables in the database
Base.metadata.create_all(bind=engine)





@app.get("/")
async def root():
    return {"message": "Hello World"}

@app.get("/test-postdb")
def test_db(db: Session = Depends(get_db)):
    return {"message": "Database connection successful!"}

@app.get("/hello/{name}")
async def say_hello(name: str):
    return {"message": f"Hello {name}"}

@app.get("/test-mongo")
async def test_mongo():
    try:
        # Test if we can list collections
        collections = mdb.list_collection_names()
        return {"message": "Connected to MongoDB!", "collections": collections}
    except Exception as e:
        return {"error": str(e)}




if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

