"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, FileVideo, ShieldAlert, CheckCircle, Search, FileImage } from "lucide-react";
import { motion } from "framer-motion";
import axios from "axios";

export default function DetectionPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      router.push('/auth/login');
      return;
    }
    setLoading(false);
  }, [router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setResult(null);
      
      if (selectedFile.type.startsWith("video/") || selectedFile.type.startsWith("image/")) {
        const url = URL.createObjectURL(selectedFile);
        setPreview(url);
      }
    }
  };

   const triggerAnalysis = async () => {
    if (!file) return;
    setAnalyzing(true);
    setResult(null);
    setProgress(10);
    setStatusText("Uploading file...");

    const formData = new FormData();
    formData.append("file", file);
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      alert("You must be logged in to analyze media.");
      router.push("/auth/login");
      setAnalyzing(false);
      setProgress(0);
      return;
    }
    const user = JSON.parse(userStr);
    formData.append("user_id", user.id.toString());

    try {
      // Fake progress animation while waiting
      const progressInterval = setInterval(() => {
        setProgress(p => {
          if (p < 30) return p + 5;
          if (p < 60) {
            setStatusText("Extracting frames & detecting faces...");
            return p + 2;
          }
          if (p < 85) {
            setStatusText("Running deepfake detection model...");
            return p + 1;
          }
          return p;
        });
      }, 500);

      const response = await axios.post("http://localhost:8000/api/predict", formData);

      clearInterval(progressInterval);
      setProgress(100);
      setStatusText("Generating report...");
      
      setTimeout(() => {
        setResult(response.data);
        setAnalyzing(false);
      }, 800);

    } catch (error) {
      console.error(error);
      alert("An error occurred during analysis.");
      setAnalyzing(false);
      setProgress(0);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-32 text-center text-slate-400">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="text-lg font-medium text-slate-300">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <h2 className="text-3xl font-bold text-center mb-8">Media Analysis Console</h2>
      
      {!result ? (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-xl">
          <div 
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${file ? 'border-blue-500 bg-blue-900/10' : 'border-slate-600 hover:border-blue-400 hover:bg-slate-800/80 cursor-pointer'}`}
            onClick={() => !file && fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="video/mp4,video/x-m4v,video/*,image/*" 
              onChange={handleFileChange}
            />
            
            {!file ? (
              <div className="flex flex-col items-center">
                <UploadCloud size={64} className="text-slate-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Drag & Drop or Click to Upload</h3>
                <p className="text-slate-500">Supports MP4, AVI, MKV, MOV, JPG, PNG (Max 50MB)</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                {preview ? (
                  <div className="relative w-full max-w-md h-64 mb-6 rounded-lg overflow-hidden bg-black border border-slate-700 group">
                    {file.type.startsWith("video/") ? (
                      <video src={preview} className="w-full h-full object-contain" controls />
                    ) : (
                      <img src={preview} className="w-full h-full object-contain" alt="Preview" />
                    )}
                    <button 
                      onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null); }}
                      className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-500 text-white p-2 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <FileVideo size={64} className="text-blue-400 mb-4" />
                )}
                <div className="flex items-center space-x-2 text-slate-300 font-medium bg-slate-900/50 px-4 py-2 rounded">
                  {file.type.startsWith("video/") ? <FileVideo size={16}/> : <FileImage size={16}/>}
                  <span>{file.name}</span>
                  <span className="text-slate-500 text-sm">({(file.size / (1024 * 1024)).toFixed(2)} MB)</span>
                </div>
              </div>
            )}
          </div>

          {file && !analyzing && (
            <div className="mt-8 flex justify-center">
              <button 
                onClick={triggerAnalysis}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)] flex items-center space-x-2"
              >
                <Search size={20} />
                <span>Analyze Media</span>
              </button>
            </div>
          )}

          {analyzing && (
            <div className="mt-8">
              <div className="flex justify-between text-sm mb-2 font-medium text-slate-300">
                <span>{statusText}</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                <motion.div 
                  className="bg-gradient-to-r from-blue-500 to-cyan-400 h-3"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                ></motion.div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Result Header */}
          <div className={`p-8 text-center ${result.prediction === 'FAKE' ? 'bg-red-900/30 border-b border-red-500/30' : 'bg-green-900/30 border-b border-green-500/30'}`}>
            <div className="inline-flex items-center justify-center p-4 rounded-full mb-4 bg-slate-900/50">
              {result.prediction === 'FAKE' ? (
                <ShieldAlert size={48} className="text-red-500" />
              ) : (
                <CheckCircle size={48} className="text-green-500" />
              )}
            </div>
            <h3 className="text-4xl font-extrabold mb-2">
              <span className={result.prediction === 'FAKE' ? 'text-red-400' : 'text-green-400'}>
                {result.prediction}
              </span>
            </h3>
            <p className="text-slate-300">
              The model detected this media as {result.prediction} with {result.confidence}% confidence.
            </p>
          </div>

          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Probability Bars */}
            <div className="space-y-6">
              <h4 className="text-xl font-semibold border-b border-slate-700 pb-2">Analysis Metrics</h4>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-red-400 font-medium">Fake Probability</span>
                  <span>{(result.fake_probability * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-4 overflow-hidden">
                  <div className="bg-red-500 h-4" style={{ width: `${result.fake_probability * 100}%` }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-green-400 font-medium">Real Probability</span>
                  <span>{(result.real_probability * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-4 overflow-hidden">
                  <div className="bg-green-500 h-4" style={{ width: `${result.real_probability * 100}%` }}></div>
                </div>
              </div>

              <div className="pt-4 grid grid-cols-2 gap-4">
                <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                  <p className="text-slate-400 text-sm mb-1">Risk Level</p>
                  <p className={`text-lg font-bold ${result.risk_level === 'High Risk' ? 'text-red-400' : result.risk_level === 'Medium Risk' ? 'text-yellow-400' : 'text-green-400'}`}>{result.risk_level}</p>
                </div>
                <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                  <p className="text-slate-400 text-sm mb-1">Frames Analyzed</p>
                  <p className="text-lg font-bold text-white">{result.frames_analyzed}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col justify-center space-y-4 border-l border-slate-700 pl-8">
               <a 
                 href={`http://localhost:8000${result.report_url}`}
                 target="_blank"
                 className="w-full py-4 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-colors"
               >
                 <Download size={20} />
                 <span>Download PDF Report</span>
               </a>
               <button 
                 onClick={() => {setResult(null); setFile(null); setPreview(null);}}
                 className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold flex items-center justify-center space-x-2 transition-colors"
               >
                 <UploadCloud size={20} />
                 <span>Process Another File</span>
               </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// Temporary import for Download icon which was missed above
import { Download } from "lucide-react";
