from fastapi import FastAPI, UploadFile, File
import os

app = FastAPI()

# This tells Python to create a folder called 'uploaded_videos' if it doesn't exist yet
os.makedirs("uploaded_videos", exist_ok=True)

@app.get("/")
def read_root():
    return {"message": "Hello World! The AI Video Assistant Backend is running!"}

# This is our new "catcher" - it waits for someone to send a file to /upload-video/
@app.post("/upload-video/")
async def upload_video(file: UploadFile = File(...)):
    # We create the exact file path where we want to save the video
    file_path = f"uploaded_videos/{file.filename}"
    
    # We open that path and save the video bytes into it
    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())
    
    return {"message": f"Successfully uploaded {file.filename}!"}