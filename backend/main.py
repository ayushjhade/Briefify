from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI()

# --- VIP PASS FOR FRONTEND (CORS) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], # The exact address of your Next.js frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# ------------------------------------

os.makedirs("uploaded_videos", exist_ok=True)

@app.get("/")
def read_root():
    return {"message": "Hello World! The AI Video Assistant Backend is running!"}

@app.post("/upload-video/")
async def upload_video(file: UploadFile = File(...)):
    file_path = f"uploaded_videos/{file.filename}"
    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())
    return {"message": f"Successfully uploaded {file.filename}!"}