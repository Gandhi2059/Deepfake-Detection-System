"use client";

import { motion } from "framer-motion";
import { Upload, Video, Maximize, Cpu, Scaling, Activity } from "lucide-react";

export default function MethodologyPage() {
  const steps = [
    { icon: <Upload/>, title: "Media Upload", desc: "User uploads a potential deepfake video or image. Temp storage is allocated securely." },
    { icon: <Video/>, title: "Frame Extraction", desc: "For videos, a fixed number of frames (e.g., 16) are uniformly extracted across the timeline to capture temporal features." },
    { icon: <Maximize/>, title: "Face Detection & Cropping", desc: "MediaPipe or MTCNN precisely detects facial coordinates and extracts bounding boxes around the faces." },
    { icon: <Scaling/>, title: "Image Normalization", desc: "Extracted faces are resized (e.g., 224x224) and pixel values are normalized to a 0-1 scale to match model inputs." },
    { icon: <Cpu/>, title: "Deepfake Classification", desc: "A trained Keras Neural Network (CNN/RNN or Transformer based) processes the sequence." },
    { icon: <Activity/>, title: "Decision Thresholding", desc: "Sigmoid probabilities are obtained. Values >= 0.49 are flagged as FAKE, and a report is generated." }
  ];

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h2 className="text-4xl font-bold mb-4 text-center">System Methodology</h2>
      <p className="text-slate-400 text-center mb-12">An end-to-end overview of the extraction and classification pipeline.</p>

      <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-700 before:to-transparent">
        {steps.map((step, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, x: idx % 2 === 0 ? -50 : 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active`}
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-slate-700 bg-slate-900 group-[.is-active]:bg-blue-600 text-slate-500 group-[.is-active]:text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
              {step.icon}
            </div>
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-slate-800/80 border border-slate-700 p-6 rounded-xl shadow-lg">
              <h3 className="font-bold text-lg mb-1">{step.title}</h3>
              <p className="text-sm text-slate-400">{step.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
