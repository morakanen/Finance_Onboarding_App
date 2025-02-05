import uvicorn
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from sqlalchemy.orm import Session
from database import engine,Base,get_db

app = FastAPI()

origins = [
    "http://localhost:3000",
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

@app.get("/test-db")
def test_db(db: Session = Depends(get_db)):
    return {"message": "Database connection successful!"}

@app.get("/hello/{name}")
async def say_hello(name: str):
    return {"message": f"Hello {name}"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)