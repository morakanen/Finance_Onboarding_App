import uvicorn
from fastapi import Depends, HTTPException, FastAPI, status
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from typing import List, Annotated
from sqlalchemy.orm import Session
import datetime
import jwt

# LOCAL IMPORTS
from database import engine, get_db, mdb
import models
from schemas import ClientCreate, ClientResponse, UserCreate, UserResponse
from uuid import UUID
from passlib.context import CryptContext
from minio_utils import ensure_bucket_exists
from routes import clients as clients_routes
from routes import applications as applications_routes
from routes import users as users_routes
from routes import risk_assessment as risk_assessment_routes
from routes import documents as documents_routes

app = FastAPI()

# Important: Explicitly add tags and prefix to the routers
app.include_router(clients_routes.router, tags=["clients"])
app.include_router(applications_routes.router, tags=["applications"])
app.include_router(users_routes.router, tags=["users"])
app.include_router(risk_assessment_routes.router, tags=["risk_assessment"])
app.include_router(documents_routes.router, tags=["documents"])

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

@app.get("/test-email")
async def test_email():
    try:
        from utils.email import send_application_completed_email
        success = await send_application_completed_email("test-app-123", "test-user-456")
        return {"message": "Email sent successfully" if success else "Failed to send email"}
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

from utils.auth import hash_password, verify_password

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")

# Create tables
models.Base.metadata.create_all(bind=engine)

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

@app.get("/api/logout")
@app.get("/logout")
async def logout(redirect: str = None):
    # Base frontend URL
    frontend_url = "http://localhost:3000"
    
    # Default redirect to auth page if none specified
    redirect_url = redirect if redirect and redirect.startswith("http") else f"{frontend_url}/auth"
    
    # Add a query parameter to signal frontend to clear state
    if "?" in redirect_url:
        redirect_url += "&clearState=true"
    else:
        redirect_url += "?clearState=true"
    
    response = RedirectResponse(url=redirect_url, status_code=302)
    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="access_token", path="/api")
    response.headers["Access-Control-Allow-Origin"] = frontend_url
    response.headers["Access-Control-Allow-Credentials"] = "true"
    return response

@app.post("/login")
def login_user(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    # Check if trying to access admin dashboard
    redirect_path = form_data.scopes[0] if form_data.scopes else ""
    if "/admin/" in redirect_path and user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Access denied. Admin privileges required."
        )

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