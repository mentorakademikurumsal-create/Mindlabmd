from sqlalchemy import Boolean, Column, Integer, String
from backend.database import Base
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

# SQLAlchemy Models (Database)
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String)
    grade = Column(Integer)

class Task(Base):
    __tablename__ = "tasks"
    id = Column(String, primary_key=True, index=True)
    grade_level = Column(Integer)
    subject = Column(String)
    module_type = Column(String)
    json_data = Column(String) # Store the whole JSON structure

# Pydantic Schemas (API Validation)
class UserCreate(BaseModel):
    username: str
    password: str
    role: str
    grade: int = 7

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    username: str
    grade: int

class CategoryBasket(BaseModel):
    id: str
    title: str
    color: str

class CategoryItem(BaseModel):
    id: str
    text: str
    target: str

class CategoryTaskSchema(BaseModel):
    grade_level: int
    subject: str
    maarif_skill: str
    cognitive_target: str
    module_type: str = "Kategori Sepeti"
    context_text: str
    categories: list[CategoryBasket]
    items: list[CategoryItem]
    feedback: str
