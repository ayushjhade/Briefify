'use client'; // This tells Next.js we want to use interactive features (like buttons)

import { useState } from 'react';

export default function Home() {
  // These act as our memory. We remember the file selected, and any messages to show the user.
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState('');

  // This function runs when the user clicks the Upload button
  const handleUpload = async () => {
    if (!file) {
      setMessage("Please select a video file first!");
      return;
    }

    setMessage("Uploading... please wait ⏳");
    
    // We package the file into a virtual envelope (FormData)
    const formData = new FormData();
    formData.append("file", file);

    try {
      // We "fetch" our backend address and send it a POST request with our envelope
      const response = await fetch("http://127.0.0.1:8000/upload-video/", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        setMessage("Upload successful! 🎉");
      } else {
        setMessage("Upload failed. 😢");
      }
    } catch (error) {
      setMessage("Error connecting to the backend. Is it running?");
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8 bg-black text-white">
      <h1 className="text-4xl font-bold mb-8">AI Video Assistant</h1>
      
      {/* This is the box containing our upload tools */}
      <div className="flex flex-col items-center gap-6 bg-gray-900 p-10 rounded-xl shadow-lg border border-gray-800">
        
        {/* The file selector */}
        <input 
          type="file" 
          accept="video/*" 
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer text-gray-300"
        />
        
        {/* The upload button */}
        <button 
          onClick={handleUpload}
          className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-8 rounded-full transition-colors w-full"
        >
          Upload Video
        </button>

        {/* This displays our success or error messages */}
        {message && <p className="mt-2 text-lg text-yellow-400 font-semibold">{message}</p>}
      </div>
    </main>
  );
}