import os
from fastapi import FastAPI, UploadFile, File
import pandas as pd

app = FastAPI()
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post("/upload-csv")
async def upload_csv(file: UploadFile = File(...)):
    if not file.filename.endswith(".csv"):
        return {"error": "Por favor, envie um arquivo CSV válido."}
    
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as f:
        f.write(await file.read())

    df = pd.read_csv(file_path)
    return {"filename": file.filename, "rows": len(df), "columns": list(df.columns)}

@app.get("/list")
def list_csv():
    return {"files": os.listdir(UPLOAD_DIR)}

@app.get("/read/{filename}")
def read_csv(filename: str):
    file_path = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(file_path):
        return {"error": "Arquivo não encontrado"}
    
    df = pd.read_csv(file_path)
    return {"filename": filename, "rows": len(df), "data": df.to_dict(orient="records")}

# como rodar a api: dentro da pasta api $ uvicorn main:app --reload