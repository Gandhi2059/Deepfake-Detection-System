"use client";

import { Database, Shield, Image as ImageIcon, Users } from "lucide-react";

export default function DatasetPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="mb-12 text-center">
        <h2 className="text-4xl font-bold mb-4">Training Datasets</h2>
        <p className="text-slate-400">
          Our model can be trained on FaceForensics++ and Celeb-DF and evaluated on unseen DFDC and WildDeepfake datasets for robust cross-dataset generalization.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-slate-800/60 p-8 rounded-2xl border border-slate-700 hover:border-blue-500/50 transition-colors">
          <Database className="text-blue-400 mb-4" size={40} />
          <h3 className="text-2xl font-bold mb-2">FaceForensics++</h3>
          <p className="text-slate-300 mb-4">
            A large-scale dataset of manipulated facial videos covering multiple manipulation methods like Deepfakes, Face2Face, FaceSwap, and NeuralTextures. 
            It provides a robust baseline for detecting standard deepfakes.
          </p>
        </div>

        <div className="bg-slate-800/60 p-8 rounded-2xl border border-slate-700 hover:border-purple-500/50 transition-colors">
          <Users className="text-purple-400 mb-4" size={40} />
          <h3 className="text-2xl font-bold mb-2">Celeb-DF</h3>
          <p className="text-slate-300 mb-4">
            A large-scale, highly challenging dataset generated using an improved deepfake synthesis algorithm, reducing visual artifacts compared to earlier datasets.
            Crucial for high-quality deepfake feature extraction.
          </p>
        </div>

        <div className="bg-slate-800/60 p-8 rounded-2xl border border-slate-700 hover:border-cyan-500/50 transition-colors">
          <Shield className="text-cyan-400 mb-4" size={40} />
          <h3 className="text-2xl font-bold mb-2">DFDC (Deepfake Detection Challenge)</h3>
          <p className="text-slate-300 mb-4">
            A massive dataset by Meta containing over 100,000 deepfake clips with extreme augmentations like noise, compression, and varying lighting. Used primarily for cross-dataset evaluation to measure generalization.
          </p>
        </div>

        <div className="bg-slate-800/60 p-8 rounded-2xl border border-slate-700 hover:border-red-500/50 transition-colors">
          <ImageIcon className="text-red-400 mb-4" size={40} />
          <h3 className="text-2xl font-bold mb-2">WildDeepfake</h3>
          <p className="text-slate-300 mb-4">
            A real-world deepfake dataset collected directly from the internet. Unlike laboratory-generated fakes, WildDeepfake contains diverse, unconstrained faces, offering the ultimate testing ground for real-world reliability.
          </p>
        </div>
      </div>
    </div>
  );
}
