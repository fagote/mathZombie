from fastapi import FastAPI, UploadFile, File
import pandas as pd

app = FastAPI()

@app.post("/upload-csv")
async def upload_csv(file: UploadFile = File(...)):
    if not file.filename.endswith(".csv"):
        return {"error": "Por favor, envie um arquivo CSV válido."}
    
    df = pd.read_csv(file.file)
    
    data = df.to_dict(orient="records")
    
    return {
        "filename": file.filename,
        "rows": len(data),
        "data": data
    }
