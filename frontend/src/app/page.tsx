"use client";

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShieldCheck, Video, Activity, Lock } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex-1 relative flex items-center justify-center min-h-[calc(100vh-140px)] overflow-hidden">
      {/* Background Graphic */}
      <div className="absolute inset-0 z-0 bg-grid-pattern opacity-20"></div>
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="container mx-auto px-4 z-10 text-center relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center space-x-2 bg-blue-900/40 border border-blue-500/30 px-3 py-1 rounded-full text-blue-300 text-sm font-medium mb-6">
            <Lock size={14} />
            <span>State-of-the-Art Deepfake Detection</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400 mb-6 drop-shadow-sm">
            AI-Powered Deepfake<br />Detection System
          </h1>
          
          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            Upload a video or image and leverage our robust deep learning model to detect whether the media is authentic or manipulated using advanced spatiotemporal analysis.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
            <Link href="/detection">
              <button className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-lg transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] flex items-center space-x-2">
                <Video size={20} />
                <span>Start Detection</span>
              </button>
            </Link>
            <Link href="/methodology">
              <button className="px-8 py-4 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-200 rounded-lg font-bold text-lg transition-all flex items-center space-x-2">
                <Activity size={20} />
                <span>View Methodology</span>
              </button>
            </Link>
          </div>
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-20 text-left"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-xl backdrop-blur-sm">
            <ShieldCheck className="text-blue-400 mb-4" size={32} />
            <h3 className="text-xl font-bold mb-2">High Accuracy</h3>
            <p className="text-slate-400 text-sm">Powered by cutting-edge neural networks tested across multiple robust datasets.</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-xl backdrop-blur-sm">
            <Activity className="text-cyan-400 mb-4" size={32} />
            <h3 className="text-xl font-bold mb-2">Frame Analysis</h3>
            <p className="text-slate-400 text-sm">Extracts and evaluates sequences of frames to catch subtle temporal manipulations.</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-xl backdrop-blur-sm">
            <Video className="text-purple-400 mb-4" size={32} />
            <h3 className="text-xl font-bold mb-2">Media Versatility</h3>
            <p className="text-slate-400 text-sm">Supports rapid detection on both images and video sequences natively.</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
