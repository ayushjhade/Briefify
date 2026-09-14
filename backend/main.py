from fastapi import FastAPI

# This creates our app engine
app = FastAPI()

# This tells the app what to do when someone visits our main URL
@app.get("/")
def read_root():
    return {"message": "Hello World! The AI Video Assistant Backend is running!"}