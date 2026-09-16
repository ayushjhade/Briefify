from fastapi import FastAPI, UploadFile, File, Form
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

# Directories for our media assets
os.makedirs("uploaded_videos", exist_ok=True)
os.makedirs("extracted_audio", exist_ok=True)
os.makedirs("extracted_snapshots", exist_ok=True)


def extract_audio_from_video(video_path: str, audio_path: str):
    """Extracts audio from video to 16kHz mono WAV format."""
    command = [
        "ffmpeg", "-i", video_path, "-vn",
        "-acodec", "pcm_s16le", "-ar", "16000", "-ac", "1",
        audio_path, "-y"
    ]
    subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)


def extract_frame_at_timestamp(video_path: str, timestamp_seconds: float, output_image_path: str):
    """Grabs a single image frame from a video at the specified timestamp in seconds."""
    command = [
        "ffmpeg",
        "-ss", str(timestamp_seconds), # Jump to timestamp
        "-i", video_path,             # Input video
        "-vframes", "1",               # Capture only 1 frame
        "-q:v", "2",                   # High quality JPEG
        output_image_path,
        "-y"
    ]
    subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)


@app.get("/")
def read_root():
    return {"message": "Hello World! The AI Video Assistant Backend is running!"}


@app.post("/upload-video/")
async def upload_video(file: UploadFile = File(...)):
    video_path = f"uploaded_videos/{file.filename}"
    with open(video_path, "wb") as buffer:
        buffer.write(await file.read())

    base_filename = os.path.splitext(file.filename)[0]
    audio_path = f"extracted_audio/{base_filename}.wav"

    try:
        extract_audio_from_video(video_path, audio_path)
        return {
            "message": f"Successfully uploaded {file.filename} and extracted audio!",
            "video_path": video_path,
            "audio_path": audio_path
        }
    except Exception as e:
        return {"error": f"Failed to extract audio: {str(e)}"}


# NEW: Test endpoint to grab a screenshot at any second!
@app.post("/extract-snapshot/")
async def extract_snapshot(video_filename: str = Form(...), timestamp_seconds: float = Form(...)):
    video_path = f"uploaded_videos/{video_filename}"
    if not os.path.exists(video_path):
        return {"error": "Video file not found!"}

    snapshot_path = f"extracted_snapshots/{os.path.splitext(video_filename)[0]}_at_{int(timestamp_seconds)}s.jpg"

    try:
        extract_frame_at_timestamp(video_path, timestamp_seconds, snapshot_path)
        return {
            "message": "Snapshot extracted successfully!",
            "snapshot_path": snapshot_path
        }
    except Exception as e:
        return {"error": f"Failed to extract snapshot: {str(e)}"}