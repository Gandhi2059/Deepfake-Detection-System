"use client";

import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend
} from "recharts";

const placeholderMetrics = [
  { metric: "Accuracy", value: 94.5 },
  { metric: "Precision", value: 92.8 },
  { metric: "Recall", value: 96.1 },
  { metric: "F1-Score", value: 94.4 },
];

const rocData = [
  { fpr: 0, tpr: 0 },
  { fpr: 0.05, tpr: 0.85 },
  { fpr: 0.1, tpr: 0.92 },
  { fpr: 0.2, tpr: 0.96 },
  { fpr: 0.5, tpr: 0.98 },
  { fpr: 1, tpr: 1 },
];

export default function MetricsPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <h2 className="text-4xl font-bold mb-8 text-center">Research Metrics</h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
        {placeholderMetrics.map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-slate-800 border border-slate-700 p-6 rounded-xl text-center"
          >
            <p className="text-slate-400 capitalize text-sm font-semibold mb-2">{item.metric}</p>
            <p className="text-3xl font-extrabold text-blue-400">{item.value}%</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Bar Chart Details */}
        <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-bold mb-6">Cross-Dataset Performance</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { name: 'FF++', score: 98.2 },
                  { name: 'Celeb-DF', score: 91.5 },
                  { name: 'DFDC', score: 85.4 },
                  { name: 'WildDeepfake', score: 82.1 },
                ]}
                margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#cbd5e1" />
                <YAxis stroke="#cbd5e1" domain={[0, 100]} />
                <Tooltip cursor={{ fill: '#1e293b' }} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                <Bar dataKey="score" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ROC Curve Placeholder */}
        <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-bold mb-6">ROC-AUC Curve</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={rocData}
                margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="fpr" stroke="#cbd5e1" label={{ value: 'False Positive Rate', position: 'insideBottom', offset: -5, fill: '#cbd5e1' }} />
                <YAxis stroke="#cbd5e1" label={{ value: 'True Positive Rate', angle: -90, position: 'insideLeft', fill: '#cbd5e1' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                <Legend verticalAlign="top" height={36}/>
                <Line type="monotone" name="ROC Curve (AUC = 0.96)" dataKey="tpr" stroke="#8b5cf6" strokeWidth={3} dot={false} />
                <Line type="dashed" name="Random Guess" dataKey="fpr" stroke="#64748b" strokeWidth={2} dot={false} strokeDasharray="5 5"/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Confusion Matrix Visual */}
      <div className="bg-slate-800 border border-slate-700 p-8 rounded-xl shadow-lg max-w-2xl mx-auto">
        <h3 className="text-xl font-bold border-b border-slate-700 pb-2 mb-6 text-center">Confusion Matrix (Placeholder)</h3>
        <div className="grid grid-cols-3 gap-1 mb-4 text-center">
           <div></div>
           <div className="font-bold text-slate-300">Predicted Real</div>
           <div className="font-bold text-slate-300">Predicted Fake</div>

           <div className="font-bold text-slate-300 flex items-center justify-end pr-4">Actual Real</div>
           <div className="bg-slate-700 p-6 rounded border border-green-500/50">
             <span className="text-green-400 font-bold block text-2xl">450</span>
             <span className="text-xs text-slate-400">True Negative</span>
           </div>
           <div className="bg-slate-700 p-6 rounded border border-red-500/50">
             <span className="text-red-400 font-bold block text-2xl">25</span>
             <span className="text-xs text-slate-400">False Positive</span>
           </div>

           <div className="font-bold text-slate-300 flex items-center justify-end pr-4">Actual Fake</div>
           <div className="bg-slate-700 p-6 rounded border border-yellow-500/50">
             <span className="text-yellow-400 font-bold block text-2xl">18</span>
             <span className="text-xs text-slate-400">False Negative</span>
           </div>
           <div className="bg-slate-700 p-6 rounded border border-blue-500/50">
             <span className="text-blue-400 font-bold block text-2xl">510</span>
             <span className="text-xs text-slate-400">True Positive</span>
           </div>
        </div>
      </div>
    </div>
  );
}
