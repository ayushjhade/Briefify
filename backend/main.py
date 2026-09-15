from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import os
import subprocess

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Directories to store our processed media
os.makedirs("uploaded_videos", exist_ok=True)
os.makedirs("extracted_audio", exist_ok=True)

def extract_audio_from_video(video_path: str, audio_path: str):
    """Uses FFmpeg to extract audio from a video file into a WAV format."""
    command = [
        "ffmpeg",
        "-i", video_path,       # Input video path
        "-vn",                  # Disable video recording (audio only)
        "-acodec", "pcm_s16le", # Standard WAV audio encoding
        "-ar", "16000",         # 16kHz sample rate (ideal for Speech-to-Text AI)
        "-ac", "1",             # Mono channel (reduces file size)
        audio_path,             # Output audio path
        "-y"                    # Overwrite output file if it exists
    ]
    # Run the FFmpeg command silently
    subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)


@app.get("/")
def read_root():
    return {"message": "Hello World! The AI Video Assistant Backend is running!"}


@app.post("/upload-video/")
async def upload_video(file: UploadFile = File(...)):
    # 1. Save the raw video file
    video_path = f"uploaded_videos/{file.filename}"
    with open(video_path, "wb") as buffer:
        buffer.write(await file.read())

    # 2. Generate the output path for audio (e.g. video.mp4 -> video.wav)
    base_filename = os.path.splitext(file.filename)[0]
    audio_path = f"extracted_audio/{base_filename}.wav"

    # 3. Extract audio from video
    try:
        extract_audio_from_video(video_path, audio_path)
        return {
            "message": f"Successfully uploaded {file.filename} and extracted audio!",
            "video_path": video_path,
            "audio_path": audio_path
        }
    except Exception as e:
        return {"error": f"Uploaded video, but failed to extract audio: {str(e)}"}