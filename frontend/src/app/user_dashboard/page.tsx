"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { ShieldAlert, CheckCircle, Clock, BarChart3, Scan, ShieldAlert as AlertIcon, ShieldCheck } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid
} from "recharts";

export default function UserDashboard() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [username, setUsername] = useState("");

  const fetchHistory = async (userId: number) => {
    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:8000/api/history?user_id=${userId}`);
      setHistory(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      router.push('/auth/login');
      return;
    }
    const user = JSON.parse(userStr);
    setUsername(user.username);
    
    // Redirect admin to admin dashboard immediately
    if (user.is_admin) {
      router.push('/admin');
      return;
    }
    
    fetchHistory(user.id);
  }, [router]);

  // Calculations for Metrics
  const totalScans = history.length;
  const fakesCount = history.filter(h => h.prediction === 'FAKE').length;
  const realsCount = history.filter(h => h.prediction === 'REAL').length;
  const avgConfidence = totalScans
    ? Math.round(history.reduce((acc, curr) => acc + curr.confidence, 0) / totalScans)
    : 0;

  // Process chart data for Scan Activity over time (chronological)
  const sortedHistory = [...history].sort(
    (a, b) => new Date(a.upload_time).getTime() - new Date(b.upload_time).getTime()
  );
  
  const scansByDate = sortedHistory.reduce((acc: any, curr: any) => {
    const date = new Date(curr.upload_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  const areaChartData = Object.entries(scansByDate).map(([date, count]) => ({
    date,
    count
  }));

  // Process data for distribution pie chart
  const pieData = [
    { name: 'Fake', value: fakesCount, color: '#ef4444' }, // Red
    { name: 'Real', value: realsCount, color: '#22c55e' }  // Green
  ];

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      {/* Welcome Hero */}
      <div className="mb-8 border-b border-slate-700/50 pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold mb-2">Welcome, <span className="text-blue-400 font-extrabold">{username}</span>!</h2>
          <p className="text-slate-400">View your analysis history and recent scans here.</p>
        </div>
        <a 
          href="/detection" 
          className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-6 rounded-lg transition-all duration-200 shadow-lg shadow-blue-500/20 active:scale-95 shrink-0"
        >
          <Scan className="mr-2" size={18}/> New Scan
        </a>
      </div>

      {/* Stats Cards Section */}
      {!loading && totalScans > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800/40 backdrop-blur-md border border-slate-700 p-6 rounded-xl hover:border-slate-600 transition-all">
            <p className="text-slate-400 text-sm font-semibold mb-1">Total Scans</p>
            <p className="text-3xl font-black text-slate-100">{totalScans}</p>
          </div>
          <div className="bg-slate-800/40 backdrop-blur-md border border-slate-700 p-6 rounded-xl hover:border-red-500/30 transition-all">
            <p className="text-red-400 text-sm font-semibold mb-1 flex items-center"><AlertIcon size={14} className="mr-1"/> Fakes Flagged</p>
            <p className="text-3xl font-black text-red-500">{fakesCount}</p>
          </div>
          <div className="bg-slate-800/40 backdrop-blur-md border border-slate-700 p-6 rounded-xl hover:border-green-500/30 transition-all">
            <p className="text-green-400 text-sm font-semibold mb-1 flex items-center"><ShieldCheck size={14} className="mr-1"/> Reals Verified</p>
            <p className="text-3xl font-black text-green-500">{realsCount}</p>
          </div>
          <div className="bg-slate-800/40 backdrop-blur-md border border-slate-700 p-6 rounded-xl hover:border-blue-500/30 transition-all">
            <p className="text-blue-400 text-sm font-semibold mb-1">Avg. Confidence</p>
            <p className="text-3xl font-black text-blue-400">{avgConfidence}%</p>
          </div>
        </div>
      )}

      {/* Analytics Charts Panel */}
      {!loading && totalScans > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          {/* Scan Activity Area Chart */}
          <div className="lg:col-span-2 bg-slate-800/60 border border-slate-700/60 p-6 rounded-xl shadow-xl">
            <h3 className="text-lg font-bold mb-4 flex items-center text-slate-200">
              <BarChart3 className="mr-2 text-blue-400" size={20}/> Scan Activity Over Time
            </h3>
            <div className="h-64 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={areaChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                  <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" name="Scans" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Classification Pie Chart */}
          <div className="bg-slate-800/60 border border-slate-700/60 p-6 rounded-xl shadow-xl flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold mb-4 flex items-center text-slate-200">
                <AlertIcon className="mr-2 text-purple-400" size={20}/> Detection Breakdown
              </h3>
              <div className="h-48 w-full relative flex items-center justify-center">
                {fakesCount === 0 && realsCount === 0 ? (
                  <div className="text-slate-400 text-sm">No data available</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
            
            {/* Custom Pie Legend */}
            <div className="flex justify-around items-center border-t border-slate-700/50 pt-4 mt-2">
              <div className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>
                <span className="text-sm text-slate-300">Real ({realsCount})</span>
              </div>
              <div className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span>
                <span className="text-sm text-slate-300">Fake ({fakesCount})</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Scans Table */}
      <h3 className="text-xl font-bold mb-4 flex items-center"><Clock className="mr-2" /> Recent Scans</h3>
      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading your scans...</div>
        ) : history.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            You haven't scanned any media yet. 
            <br />
            <a href="/detection" className="text-blue-400 hover:underline mt-2 inline-block font-bold">Go to Detection</a>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-900/50 border-b border-slate-700">
                <tr>
                  <th className="p-4 font-semibold text-sm">Filename</th>
                  <th className="p-4 font-semibold text-sm">Date</th>
                  <th className="p-4 font-semibold text-sm">Prediction</th>
                  <th className="p-4 font-semibold text-sm">Confidence</th>
                  <th className="p-4 font-semibold text-sm">Risk Level</th>
                </tr>
              </thead>
              <tbody>
                {history.map((record) => (
                  <tr key={record.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                    <td className="p-4 text-sm font-medium">{record.filename}</td>
                    <td className="p-4 text-sm text-slate-400">{new Date(record.upload_time).toLocaleString()}</td>
                    <td className="p-4">
                      {record.prediction === 'FAKE' ? (
                        <span className="flex items-center text-red-400 font-bold"><ShieldAlert size={16} className="mr-1"/> FAKE</span>
                      ) : (
                        <span className="flex items-center text-green-400 font-bold"><CheckCircle size={16} className="mr-1"/> REAL</span>
                      )}
                    </td>
                    <td className="p-4 text-sm font-semibold">{record.confidence}%</td>
                    <td className="p-4 text-sm text-slate-400">{record.risk_level}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
