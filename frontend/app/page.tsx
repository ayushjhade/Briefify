'use client';

import { useState, useRef } from 'react';

interface NoteTopic {
  start_seconds: number;
  timestamp_label: string;
  topic: string;
  detailed_notes: string;
  snapshot_url?: string;
}

// Uses environment variable for deployed live backend, or defaults to local backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [notes, setNotes] = useState<NoteTopic[]>([]);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Handle uploading and requesting AI Analysis
  const handleUploadAndAnalyze = async () => {
    if (!file) {
      alert("Please select a video file first!");
      return;
    }

    setLoading(true);
    setStatusText("Uploading video & extracting audio... ⏳");
    setNotes([]);
    setVideoUrl(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      // Create local preview URL immediately for smooth UX
      setVideoUrl(URL.createObjectURL(file));

      setStatusText("Gemini AI is analyzing video & generating notes with snapshots... 🧠");

      const response = await fetch(`${API_BASE_URL}/analyze-video/`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.notes) {
        setNotes(Array.isArray(data.notes) ? data.notes : []);
        if (data.video_url) {
          setVideoUrl(data.video_url);
        }
        setStatusText("Analysis Complete! 🎉");
      } else {
        setStatusText(`Error: ${data.error || "Failed to analyze video."}`);
      }
    } catch (error) {
      setStatusText("Error connecting to backend server. Make sure your Python backend is running!");
    } finally {
      setLoading(false);
    }
  };

  // Seek video player to specific timestamp
  const jumpToTimestamp = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      videoRef.current.play();
    }
  };

  // Trigger browser print to save/export document as PDF
  const handleExportDocument = () => {
    window.print();
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      {/* Header */}
      <header className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-center gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            AI Video Assistant
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Automated Video Summaries, Timestamped Notes & Snapshot Extraction
          </p>
        </div>

        {notes.length > 0 && (
          <button
            onClick={handleExportDocument}
            className="no-print bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-6 rounded-lg shadow-md transition-all flex items-center gap-2"
          >
            📄 Print / Export Document
          </button>
        )}
      </header>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Control Panel & Video Player */}
        <div className="lg:col-span-5 flex flex-col gap-6 no-print">
          
          {/* File Upload Box */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
            <h2 className="text-xl font-bold mb-4 text-slate-200">1. Upload Video</h2>
            <div className="flex flex-col gap-4">
              <input
                type="file"
                accept="video/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer text-slate-300 bg-slate-950 p-2 rounded-xl border border-slate-800 text-sm"
              />

              <button
                onClick={handleUploadAndAnalyze}
                disabled={loading || !file}
                className={`py-3 px-6 rounded-xl font-bold transition-all shadow-lg text-white ${
                  loading || !file
                    ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-500 active:scale-[0.98]"
                }`}
              >
                {loading ? "Processing..." : "Analyze & Generate Notes"}
              </button>

              {statusText && (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-sm text-center font-medium text-amber-400">
                  {statusText}
                </div>
              )}
            </div>
          </div>

          {/* Video Player */}
          {videoUrl && (
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl">
              <h2 className="text-lg font-bold mb-3 text-slate-200">Video Player</h2>
              <video
                ref={videoRef}
                src={videoUrl}
                controls
                className="w-full rounded-xl bg-black aspect-video border border-slate-800"
              />
            </div>
          )}
        </div>

        {/* Right Column: AI Generated Notes & Snapshots Document */}
        <div className={`lg:col-span-7 flex flex-col gap-6 ${notes.length === 0 ? "lg:col-span-7" : ""}`}>
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl min-h-[500px]">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-800">
              <h2 className="text-2xl font-bold text-slate-100">
                {file ? `Meeting Notes: ${file.name}` : "Generated Notes & Snapshots"}
              </h2>
              {notes.length > 0 && (
                <span className="text-xs font-semibold px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                  {notes.length} Topics Extracted
                </span>
              )}
            </div>

            {notes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center text-slate-500">
                <span className="text-5xl mb-4">🎥</span>
                <p className="text-lg font-medium">No video analyzed yet.</p>
                <p className="text-sm text-slate-600 mt-1 max-w-sm">
                  Upload a meeting, lecture, or podcast video on the left to extract detailed notes with timestamps and snapshots!
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {notes.map((note, index) => (
                  <div
                    key={index}
                    className="p-5 bg-slate-950 rounded-xl border border-slate-800 hover:border-slate-700 transition-all shadow-sm flex flex-col gap-4"
                  >
                    {/* Header: Timestamp Badge & Topic Title */}
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => jumpToTimestamp(note.start_seconds)}
                        className="no-print bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 font-mono text-xs font-bold py-1.5 px-3 rounded-lg border border-blue-500/30 transition-all flex items-center gap-1.5"
                        title="Click to jump video to this exact moment"
                      >
                        <span>⏱️</span> {note.timestamp_label || `${note.start_seconds}s`}
                      </button>
                      
                      <h3 className="text-lg font-bold text-slate-100 flex-1">
                        {note.topic}
                      </h3>
                    </div>

                    {/* Snapshot Preview */}
                    {note.snapshot_url && (
                      <div className="relative overflow-hidden rounded-lg border border-slate-800 max-h-64 bg-slate-900">
                        <img
                          src={note.snapshot_url}
                          alt={`Snapshot for ${note.topic}`}
                          className="w-full h-auto object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}

                    {/* Detailed Notes */}
                    <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                      {note.detailed_notes}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </main>
  );
}