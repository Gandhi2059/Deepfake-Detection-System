import os
import time
import shutil
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy.orm import Session, joinedload
from pydantic import BaseModel
import hashlib
from dotenv import load_dotenv

from database import get_db, PredictionRecord, User
from model_loader import load_deepfake_model
from preprocessing import extract_faces_from_video, extract_faces_from_image
from prediction import predict_deepfake
from report_generator import generate_pdf_report

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

class UserCreate(BaseModel):
    username: str
    password: str
    is_admin: bool = False

class UserLogin(BaseModel):
    username: str
    password: str

load_dotenv()

app = FastAPI(title="Deepfake Detection API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    # Browsers reject Access-Control-Allow-Origin: * when credentials are allowed.
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


os.makedirs("temp", exist_ok=True)

@app.on_event("startup")
def startup_event():
    load_deepfake_model()

@app.get("/api/health")
def health_check():
    return {"status": "ok", "backend": "online", "model_loaded": True}

@app.post("/api/auth/register")
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.username == user.username).first():
        raise HTTPException(status_code=400, detail="Username already registered")
    
    new_user = User(
        username=user.username,
        password_hash=hash_password(user.password),
        is_admin=user.is_admin
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"status": "success", "user": {"id": new_user.id, "username": new_user.username, "is_admin": new_user.is_admin}}

@app.post("/api/auth/login")
def login_user(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == user.username).first()
    if not db_user or db_user.password_hash != hash_password(user.password):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    return {"status": "success", "user": {"id": db_user.id, "username": db_user.username, "is_admin": db_user.is_admin}}

@app.post("/api/predict")
async def predict_media(file: UploadFile = File(...), user_id: int = Form(...), db: Session = Depends(get_db)):
    # Validate user exists in the database
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=401, detail="Unauthorized: User does not exist")

    start_time = time.time()
    
    max_size = int(os.getenv("MAX_UPLOAD_SIZE", "52428800"))
    
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")
        
    ext = file.filename.split('.')[-1].lower()
    valid_video_exts = ['mp4', 'mov', 'avi', 'mkv']
    valid_image_exts = ['jpg', 'jpeg', 'png']
    
    if ext not in valid_video_exts and ext not in valid_image_exts:
        raise HTTPException(status_code=400, detail="Unsupported file type")
        
    temp_path = f"temp/{file.filename}"
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    if os.path.getsize(temp_path) > max_size:
        os.remove(temp_path)
        raise HTTPException(status_code=400, detail="File too large")
        
    try:
        frames_per_video = int(os.getenv("FRAMES_PER_VIDEO", "16"))
        img_size = int(os.getenv("IMG_SIZE", "224"))
        
        if ext in valid_video_exts:
            faces_array, frame_indices = extract_faces_from_video(temp_path, frames_per_video, img_size)
        else:
            faces_array, frame_indices = extract_faces_from_image(temp_path, frames_per_video, img_size)
            
        result = predict_deepfake(faces_array, frame_indices)
        
        process_time = round(time.time() - start_time, 2)
        
        db_record = PredictionRecord(
            filename=file.filename,
            prediction=result["prediction"],
            fake_probability=result["fake_probability"],
            real_probability=result["real_probability"],
            confidence=result["confidence"],
            risk_level=result["risk_level"],
            frames_analyzed=result["frames_analyzed"],
            processing_time=process_time,
            user_id=user_id
        )
        db.add(db_record)
        db.commit()
        db.refresh(db_record)
        
        report_path = generate_pdf_report(file.filename, result)
        result["report_url"] = f"/api/reports/{os.path.basename(report_path)}"
        result["id"] = db_record.id
        
        return result
        
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

@app.get("/api/reports/{filename}")
def get_report(filename: str):
    path = f"reports/{filename}"
    if os.path.exists(path):
        return FileResponse(path, media_type='application/pdf', filename=filename)
    raise HTTPException(status_code=404, detail="Report not found")

@app.get("/api/history")
def get_history(user_id: int = None, db: Session = Depends(get_db)):
    if user_id:
        records = db.query(PredictionRecord).filter(PredictionRecord.user_id == user_id).order_by(PredictionRecord.upload_time.desc()).all()
    else:
        records = db.query(PredictionRecord).options(joinedload(PredictionRecord.user)).order_by(PredictionRecord.upload_time.desc()).all()
    return records

@app.get("/api/admin/users")
def get_all_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    result = []
    for u in users:
        result.append({
            "id": u.id,
            "username": u.username,
            "is_admin": u.is_admin,
            "created_at": u.created_at,
            "scan_count": len(u.predictions)
        })
    return result

@app.delete("/api/history/{record_id}")
def delete_record(record_id: int, db: Session = Depends(get_db)):
    record = db.query(PredictionRecord).filter(PredictionRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    db.delete(record)
    db.commit()
    return {"status": "deleted", "id": record_id}

@app.delete("/api/admin/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Delete associated scans history first
    db.query(PredictionRecord).filter(PredictionRecord.user_id == user_id).delete()
    
    db.delete(db_user)
    db.commit()
    return {"status": "deleted", "id": user_id}

