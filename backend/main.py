from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import os
import subprocess
import json
from dotenv import load_dotenv
from google import genai
from google.genai import types

# Load .env file
env_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(dotenv_path=env_path, override=True)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploaded_videos", exist_ok=True)
os.makedirs("extracted_audio", exist_ok=True)
os.makedirs("extracted_snapshots", exist_ok=True)


def get_gemini_client():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY is missing! Please set it inside your backend/.env file.")
    return genai.Client(api_key=api_key)


def extract_audio_from_video(video_path: str, audio_path: str):
    command = [
        "ffmpeg", "-i", video_path, "-vn",
        "-acodec", "pcm_s16le", "-ar", "16000", "-ac", "1",
        audio_path, "-y"
    ]
    subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)


@app.get("/")
def read_root():
    return {"message": "Hello World! The AI Video Assistant Backend is running!"}


@app.post("/analyze-video/")
async def analyze_video(file: UploadFile = File(...)):
    try:
        client = get_gemini_client()
    except ValueError as e:
        return {"error": str(e)}

    video_path = f"uploaded_videos/{file.filename}"
    with open(video_path, "wb") as buffer:
        buffer.write(await file.read())

    base_filename = os.path.splitext(file.filename)[0]
    audio_path = f"extracted_audio/{base_filename}.wav"
    extract_audio_from_video(video_path, audio_path)

    prompt = """
    You are an expert note-taker for video meetings, lectures, and podcasts.
    Analyze this audio track in detail. Generate comprehensive notes covering EVERYTHING discussed.

    Return your output strictly as a JSON list of topics formatted like this:
    [
      {
        "start_seconds": 0,
        "timestamp_label": "00:00",
        "topic": "Topic Title",
        "detailed_notes": "Detailed explanation of what was discussed..."
      }
    ]
    """

    try:
        print("Uploading audio to Gemini AI...")
        audio_file = client.files.upload(file=audio_path)

        print("Gemini is analyzing the audio...")
        response = client.models.generate_content(
            model="gemini-3.8-flash",
            contents=[audio_file, prompt],
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )

        try:
            notes_data = json.loads(response.text)
        except Exception:
            notes_data = response.text

        return {
            "message": "Analysis complete!",
            "video_filename": file.filename,
            "notes": notes_data
        }
    except Exception as e:
        print(f"Error during Gemini processing: {e}")
        return {"error": f"AI Processing failed: {str(e)}"}