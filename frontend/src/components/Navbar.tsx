"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchUser = () => {
      const stored = localStorage.getItem('user');
      setUser(stored ? JSON.parse(stored) : null);
    };
    fetchUser();
    window.addEventListener('storage', fetchUser);
    
    // Poll for changes if login is in same tab
    const interval = setInterval(fetchUser, 1000);
    return () => {
      window.removeEventListener('storage', fetchUser);
      clearInterval(interval);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    router.push('/');
  };

  return (
    <nav className="bg-slate-900 border-b border-blue-900/50 text-white p-4 shadow-md sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold flex items-center space-x-2">
          <span className="text-blue-500 text-2xl">⚡</span>
          <span>Deepfake<span className="text-blue-400">Detector</span></span>
        </Link>
        <div className="space-x-4 md:space-x-6 text-sm font-medium flex items-center">
          <Link href="/detection" className="hover:text-blue-400 transition-colors">Detection</Link>
          <Link href="/methodology" className="hover:text-blue-400 transition-colors">Methodology</Link>
          <Link href="/dataset" className="hover:text-blue-400 transition-colors">Dataset</Link>
          
          {user ? (
            <>
              {user.is_admin ? (
                <Link href="/admin" className="text-yellow-400 hover:text-yellow-300 transition-colors font-bold">Admin Panel</Link>
              ) : (
                <Link href="/user_dashboard" className="text-green-400 hover:text-green-300 transition-colors font-bold">My Dashboard</Link>
              )}
              <button onClick={handleLogout} className="text-red-400 hover:text-red-500 transition-colors">Logout ({user.username})</button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="hover:text-blue-400 transition-colors border border-blue-500/50 px-3 py-1 rounded">Login</Link>
              <Link href="/auth/register" className="bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded transition-colors text-white">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
