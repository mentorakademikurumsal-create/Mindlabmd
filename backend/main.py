import json
import random
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel

from backend import models, database, auth, ai_service
from backend.database import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="MindLab API")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    from jose import jwt, JWTError
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token hatası")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Geçersiz token")
    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Kullanıcı bulunamadı")
    return user

@app.post("/api/register")
def register(user: models.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Kullanıcı adı alınmış")
    
    hashed_pw = auth.get_password_hash(user.password)
    new_user = models.User(username=user.username, hashed_password=hashed_pw, role=user.role, grade=user.grade)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token = auth.create_access_token(data={"sub": new_user.username, "role": new_user.role, "grade": new_user.grade})
    return {"access_token": access_token, "token_type": "bearer", "role": new_user.role, "username": new_user.username, "grade": new_user.grade}

class LoginRequest(BaseModel):
    username: str
    password: str

@app.post("/api/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == req.username).first()
    if not user or not auth.verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Hatalı giriş")
    
    access_token = auth.create_access_token(data={"sub": user.username, "role": user.role, "grade": user.grade})
    return {"access_token": access_token, "token_type": "bearer", "role": user.role, "username": user.username, "grade": user.grade}

@app.get("/api/tasks/generate")
def generate_task(module_type: str = "Kategori Sepeti", current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    task_data = ai_service.generate_task_structured(grade_level=current_user.grade, subject="Genel", module_type=module_type)
    
    if task_data:
        new_task = models.Task(
            id=task_data["id"],
            grade_level=task_data.get("grade_level", current_user.grade),
            subject=task_data.get("subject", "Genel"),
            module_type=task_data.get("module_type", module_type),
            json_data=json.dumps(task_data)
        )
        db.add(new_task)
        db.commit()
        return JSONResponse(task_data)
    raise HTTPException(status_code=500, detail="Üretilemedi")

@app.get("/api/tasks")
def get_tasks(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    tasks = db.query(models.Task).filter(models.Task.grade_level == current_user.grade).all()
    return JSONResponse([json.loads(t.json_data) for t in tasks])

@app.get("/{full_path:path}")
def serve_frontend(full_path: str):
    import os
    path = os.path.join("frontend", full_path)
    if os.path.exists(path) and os.path.isfile(path):
        return FileResponse(path)
    return FileResponse("frontend/index.html")

