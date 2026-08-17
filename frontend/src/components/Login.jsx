import React, { useState } from 'react';
import { api } from '../api/client';
import { GraduationCap, BookOpen, Lock, User, ArrowRight, ShieldCheck, AlertCircle, Loader2, School } from 'lucide-react';

export default function Login({ onLoginSuccess }) {
  const [role, setRole] = useState('TEACHER'); // 'TEACHER' or 'STUDENT'
  const [username, setUsername] = useState('Teacher_1');
  const [password, setPassword] = useState('teacher123');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    setErrorMsg('');
    if (newRole === 'TEACHER') {
      setUsername('Teacher_1');
      setPassword('teacher123');
    } else {
      setUsername('Student_1');
      setPassword('password123');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMsg('Please enter your institutional credentials.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await api.login({
        username: username.trim(),
        password: password.trim(),
        role: role
      });

      if (res.data && res.data.user) {
        onLoginSuccess(res.data.user);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        
        {/* University Header Emblem */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-md mx-auto">
            <School className="w-6 h-6 text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Gradex Assessment Portal
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Examination Management & Evaluation Authority
          </p>
        </div>

        {/* Login Card */}
        <div className="academic-card p-8 bg-white border border-slate-200 shadow-sm space-y-6">
          
          {/* Role Selector Tabs */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => handleRoleChange('TEACHER')}
              className={`flex items-center justify-center gap-2 py-2 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                role === 'TEACHER'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" /> Faculty / Examiner
            </button>

            <button
              type="button"
              onClick={() => handleRoleChange('STUDENT')}
              className={`flex items-center justify-center gap-2 py-2 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                role === 'STUDENT'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" /> Student / Candidate
            </button>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="academic-badge badge-rose p-3 rounded-lg flex items-center gap-2 w-full text-xs">
              <AlertCircle className="w-4 h-4 text-rose-700 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-500" />
                {role === 'TEACHER' ? 'Faculty Employee ID' : 'Student Enrollment / Roll Number'}
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={role === 'TEACHER' ? 'e.g., Teacher_1' : 'e.g., Student_1'}
                className="academic-input w-full px-3.5 py-2.5"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-500" /> Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="academic-input w-full px-3.5 py-2.5"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full academic-button-primary py-2.5 mt-2 flex items-center justify-center gap-2 text-xs font-semibold cursor-pointer disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              {loading ? 'Authenticating...' : `Sign in to ${role === 'TEACHER' ? 'Faculty Console' : 'Student Portal'}`}
            </button>
          </form>

          {/* Quick Demo Fill Credentials */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <span className="text-[11px] font-semibold text-slate-400 block text-center uppercase tracking-wider">
              Fast Demo Authentication
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setRole('TEACHER');
                  setUsername('Teacher_1');
                  setPassword('teacher123');
                }}
                className="academic-button-secondary py-1.5 text-xs text-center cursor-pointer"
              >
                Faculty (Teacher_1)
              </button>
              <button
                type="button"
                onClick={() => {
                  setRole('STUDENT');
                  setUsername('Student_1');
                  setPassword('password123');
                }}
                className="academic-button-secondary py-1.5 text-xs text-center cursor-pointer"
              >
                Candidate (Student_1)
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-400">
          Gradex Assessment Engine v2.0 • Local Qwen 2.5 7B & Gemini Integration
        </p>
      </div>
    </div>
  );
}
