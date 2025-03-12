import uvicorn
from fastapi import Depends, HTTPException, FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from typing import List, Annotated
from sqlalchemy.orm import Session
import datetime
import jwt

# LOCAL IMPORTS
from database import engine, get_db, mdb
import models
from schemas import ClientCreate, ClientResponse, UserCreate, UserResponse
from passlib.context import CryptContext
from minio_utils import ensure_bucket_exists

app = FastAPI()

@app.on_event("startup")
def startup_event():
    print("[DEBUG] startup_event triggered.")
    ensure_bucket_exists()

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
    allow_headers=["*"]
)

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
        collections = mdb.list_collection_names()
        return {"message": "Connected to MongoDB!", "collections": collections}
    except Exception as e:
        return {"error": str(e)}

@app.post("/add-clients", response_model=ClientResponse)
def create_client(client: ClientCreate, db: Session = Depends(get_db)):
    new_client = models.Client(name=client.name, email=client.email, phone=client.phone)
    db.add(new_client)
    db.commit()
    db.refresh(new_client)
    return new_client

# JWT Secret Key
SECRET_KEY = "your_secret_key"  # Change this in production
ALGORITHM = "HS256"

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")

# Create tables
models.Base.metadata.create_all(bind=engine)

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.datetime.utcnow() + datetime.timedelta(hours=1)  # Token valid for 1 hour
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

@app.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(models.User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = hash_password(user.password)
    new_user = models.User(name=user.name, email=user.email, hashed_password=hashed_password, role=user.role)

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/login")
def login_user(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": user.email, "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role
        }
    }

@app.get("/me", response_model=UserResponse)
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_email = payload.get("sub")
        user = db.query(models.User).filter(models.User.email == user_email).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Only one "if __name__ == '__main__':"
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)