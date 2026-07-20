"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Trash2, Users, FileVideo, RefreshCw, ShieldAlert, BarChart3, PieChart as PieIcon } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid
} from "recharts";

export default function AdminDashboard() {
  const [history, setHistory] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("scans");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const router = useRouter();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [historyRes, usersRes] = await Promise.all([
        axios.get("http://localhost:8000/api/history"),
        axios.get("http://localhost:8000/api/admin/users")
      ]);
      setHistory(historyRes.data);
      setUsers(usersRes.data);
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
    if (!user.is_admin) {
      router.push('/user_dashboard');
      return;
    }
    setCurrentUser(user);
    fetchData();
  }, [router]);

  const handleDelete = async (id: number) => {
    if(!confirm("Are you sure you want to delete this record?")) return;
    try {
      await axios.delete(`http://localhost:8000/api/history/${id}`);
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm("Are you sure you want to delete this user? All of their prediction history will be deleted as well.")) return;
    try {
      await axios.delete(`http://localhost:8000/api/admin/users/${userId}`);
      fetchData();
    } catch (error) {
      console.error(error);
      alert("Failed to delete user.");
    }
  };

  const total = history.length;
  const fakes = history.filter(h => h.prediction === "FAKE").length;
  const reals = total - fakes;

  // Process data for Top Active Users bar chart
  const activeUsersData = [...users]
    .map(u => ({ name: u.username, scans: u.scan_count }))
    .sort((a, b) => b.scans - a.scans)
    .slice(0, 5);

  // Process data for system breakdown pie chart
  const systemBreakdownData = [
    { name: 'Fake', value: fakes, color: '#ef4444' }, // Red
    { name: 'Real', value: reals, color: '#22c55e' }  // Green
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
        <h2 className="text-3xl font-black text-yellow-500 flex items-center">
          <ShieldAlert size={28} className="mr-2" /> Admin Security Console
        </h2>
        <div className="flex space-x-2">
          <button 
            onClick={() => setActiveTab('scans')}
            className={`px-4 py-2 rounded font-medium flex items-center space-x-2 transition-colors ${activeTab === 'scans' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
          >
            <FileVideo size={18} /> <span>All Scans</span>
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded font-medium flex items-center space-x-2 transition-colors ${activeTab === 'users' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
          >
            <Users size={18} /> <span>Users List</span>
          </button>
          <button onClick={fetchData} className="flex items-center space-x-2 bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded text-sm transition-colors" title="Reload Data">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 shadow-lg">
          <p className="text-slate-400 text-sm mb-1">Total System Scans</p>
          <p className="text-3xl font-black text-slate-100">{total}</p>
        </div>
        <div className="bg-slate-800 p-6 rounded-lg border border-red-900/50 shadow-lg">
          <p className="text-red-400 text-sm mb-1">Total Fakes Detected</p>
          <p className="text-3xl font-black text-red-500">{fakes}</p>
        </div>
        <div className="bg-slate-800 p-6 rounded-lg border border-green-900/50 shadow-lg">
          <p className="text-green-400 text-sm mb-1">Total Reals Verified</p>
          <p className="text-3xl font-black text-green-500">{reals}</p>
        </div>
      </div>

      {/* Recharts Analytics Charts Panel */}
      {!loading && total > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top User Activity Bar Chart */}
          <div className="bg-slate-800/60 border border-slate-700/60 p-6 rounded-xl shadow-xl">
            <h3 className="text-lg font-bold mb-4 flex items-center text-slate-200">
              <BarChart3 className="mr-2 text-blue-400" size={20}/> Top Active Users
            </h3>
            <div className="h-64 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activeUsersData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                  <Tooltip cursor={{ fill: '#1e293b' }} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                  <Bar dataKey="scans" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Total Scans" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* System Detection Ratio Pie Chart */}
          <div className="bg-slate-800/60 border border-slate-700/60 p-6 rounded-xl shadow-xl flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold mb-4 flex items-center text-slate-200">
                <PieIcon className="mr-2 text-purple-400" size={20}/> System Classification Ratio
              </h3>
              <div className="h-48 w-full relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={systemBreakdownData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {systemBreakdownData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            {/* Custom Pie Legend */}
            <div className="flex justify-around items-center border-t border-slate-700/50 pt-4 mt-2">
              <div className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>
                <span className="text-sm text-slate-300">Real ({reals})</span>
              </div>
              <div className="flex items-center">
                <span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span>
                <span className="text-sm text-slate-300">Fake ({fakes})</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'scans' && (
        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-900/50 border-b border-slate-700">
                <tr>
                  <th className="p-4 font-semibold text-sm">ID</th>
                  <th className="p-4 font-semibold text-sm">User</th>
                  <th className="p-4 font-semibold text-sm">Filename</th>
                  <th className="p-4 font-semibold text-sm">Prediction</th>
                  <th className="p-4 font-semibold text-sm">Risk</th>
                  <th className="p-4 font-semibold text-sm text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="p-8 text-center text-slate-400">Loading history...</td></tr>
                ) : history.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-slate-400">No predictions recorded yet.</td></tr>
                ) : (
                  history.map((record) => (
                    <tr key={record.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                      <td className="p-4 text-sm text-slate-400">#{record.id}</td>
                      <td className="p-4 text-sm text-blue-300 font-semibold">{record.user ? record.user.username : 'Anonymous'}</td>
                      <td className="p-4 text-sm font-medium">{record.filename}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          record.prediction === 'FAKE' ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-green-950 text-green-400 border border-green-800'
                        }`}>
                          {record.prediction}
                        </span>
                        <div className="text-xs text-slate-500 mt-1.5 font-semibold">{record.confidence}% confidence</div>
                      </td>
                      <td className="p-4 text-sm text-slate-400">{record.risk_level}</td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => handleDelete(record.id)}
                          className="text-red-400 hover:text-red-300 p-2 rounded hover:bg-red-400/10 transition-colors"
                          title="Delete Record"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-900/50 border-b border-slate-700">
                <tr>
                  <th className="p-4 font-semibold text-sm">User ID</th>
                  <th className="p-4 font-semibold text-sm">Username</th>
                  <th className="p-4 font-semibold text-sm">Role</th>
                  <th className="p-4 font-semibold text-sm">Total Scans</th>
                  <th className="p-4 font-semibold text-sm">Joined At</th>
                  <th className="p-4 font-semibold text-sm text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="p-8 text-center text-slate-400">Loading users...</td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-slate-400">No users found.</td></tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                      <td className="p-4 text-sm text-slate-400">#{u.id}</td>
                      <td className="p-4 text-sm font-medium">{u.username}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          u.is_admin ? 'bg-yellow-950 text-yellow-400 border border-yellow-800' : 'bg-slate-700 text-slate-300'
                        }`}>
                          {u.is_admin ? 'Admin' : 'User'}
                        </span>
                      </td>
                      <td className="p-4 text-sm font-semibold">{u.scan_count}</td>
                      <td className="p-4 text-sm text-slate-400">{new Date(u.created_at).toLocaleString()}</td>
                      <td className="p-4 text-right">
                        {currentUser && currentUser.id !== u.id ? (
                          <button 
                            onClick={() => handleDeleteUser(u.id)}
                            className="text-red-400 hover:text-red-300 p-2 rounded hover:bg-red-400/10 transition-colors"
                            title="Delete User"
                          >
                            <Trash2 size={16} />
                          </button>
                        ) : (
                          <span className="text-slate-500 text-xs italic px-2">Self (Active)</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
