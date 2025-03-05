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
    "https://finance-onboarding-app.vercel.app",
    "http://localhost:5173",
    "http://host.docker.internal:3000",
    "http://host.docker.internal:8000",
    "http://localhost:8000"
    
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    
    
)

import models





@app.get("/")
async def root():
    return {"message": "Hello World"}

@app.get("/test-postdb")
def test_db(db: Session = Depends(get_db)):
    return {"message": "Database connection successful!"}

@app.get("/hello/{name}")
async def say_hello(name: str):
    return {"message": f"Hello {name}"}

@app.get("/test-cors")
async def test_cors():
    return {"message": "CORS is working!"}

@app.get("/test-mongo")
async def test_mongo():
    try:
        # Test if we can list collections
        collections = mdb.list_collection_names()
        return {"message": "Connected to MongoDB!", "collections": collections}
    except Exception as e:
        return {"error": str(e)}
    
@app.post("/add-clients", response_model=ClientBase) 
def create_client(client: ClientBase, db: Session = Depends(get_db)):
    new_client = models.Client(name=client.name, email=client.email, phone=client.phone)
    db.add(new_client)
    db.commit()
    db.refresh(new_client)
    return new_client  # ✅ Now it returns a valid Pydantic model




if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)

