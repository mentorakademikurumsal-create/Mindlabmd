import os
import json
import time
from dotenv import load_dotenv
from google import genai
from backend.models import CategoryTaskSchema

load_dotenv()

def generate_task_structured(grade_level: int, subject: str, module_type: str):
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return mock_task(grade_level, subject, module_type)
        
    client = genai.Client()
    
    prompt = f"{grade_level}. sınıf düzeyinde, '{subject}' dersi ile ilgili, tamamen yaratıcı ve eşsiz bir '{module_type}' görevi üret."
    sys_instruction = "Sen bir MEB Eğitim Uzmanı ve Bilişsel Psikologsun. Amacın MindLab isimli platform için sorular üretmektir."
    
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config={
                "system_instruction": sys_instruction,
                "response_mime_type": "application/json",
                "response_schema": CategoryTaskSchema if module_type == "Kategori Sepeti" else None
            }
        )
        data = json.loads(response.text)
        data["id"] = f"AI_GEN_{int(time.time() * 1000)}"
        return data
    except Exception as e:
        print(f"AI Generation Failed: {e}")
        return mock_task(grade_level, subject, module_type)

def mock_task(grade_level, subject, module_type):
    return {
        "id": f"AI_GEN_MOCK_{int(time.time() * 1000)}_K",
        "grade_level": grade_level,
        "subject": subject,
        "maarif_skill": "Sınıflandırma",
        "cognitive_target": "Çalışma Belleği ve Gruplandırma",
        "module_type": "Kategori Sepeti",
        "context_text": "Kelimeleri doğru kutulara sürükleyerek eşleştirin.",
        "categories": [
            {"id": "cat1", "title": "Doğru", "color": "#27ae60"},
            {"id": "cat2", "title": "Yanlış", "color": "#e74c3c"}
        ],
        "items": [
            {"id": "i1", "text": "Dünya Güneş etrafında döner", "target": "cat1"},
            {"id": "i2", "text": "Su 100 derecede donar", "target": "cat2"}
        ],
        "feedback": "Harika!"
    }
