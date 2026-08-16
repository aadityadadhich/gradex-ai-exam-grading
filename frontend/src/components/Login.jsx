import React, { useState } from 'react';
import { api } from '../api/client';
import { GraduationCap, BookOpen, Lock, User, ArrowRight, Sparkles, AlertCircle, Loader2 } from 'lucide-react';

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
      setErrorMsg('Please enter both identifier and password.');
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
      setErrorMsg(err.response?.data?.detail || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAF9] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        
        {/* Header Logo */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-yellow-300 border-3 border-slate-900 rounded-2xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex items-center justify-center font-black text-2xl text-slate-900 mx-auto">
            G
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">GRADEX AI</h1>
          <p className="text-xs text-slate-600 font-bold">Subjective Exam Evaluation & Grading System</p>
        </div>

        {/* Login Card */}
        <div className="neo-box p-8 space-y-6 bg-white">
          {/* Role Selector Tabs */}
          <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 border-2 border-slate-900 rounded-xl">
            <button
              type="button"
              onClick={() => handleRoleChange('TEACHER')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                role === 'TEACHER'
                  ? 'bg-yellow-300 text-slate-900 border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-4 h-4" /> Teacher
            </button>

            <button
              type="button"
              onClick={() => handleRoleChange('STUDENT')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                role === 'STUDENT'
                  ? 'bg-purple-300 text-slate-900 border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-4 h-4" /> Student
            </button>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="bg-rose-100 border-2 border-slate-900 rounded-xl p-3 flex items-center gap-2 text-xs font-bold text-slate-900">
              <AlertCircle className="w-4 h-4 text-rose-700 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-black uppercase text-slate-900 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                {role === 'TEACHER' ? 'Employee ID' : 'Student Roll Number'}
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={role === 'TEACHER' ? 'e.g. Teacher_1' : 'e.g. Student_1'}
                className="neo-input w-full px-4 py-3 text-sm font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-slate-900 mb-1.5 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" /> Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="neo-input w-full px-4 py-3 text-sm font-bold"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 mt-2 flex items-center justify-center gap-2 text-sm font-black cursor-pointer border-2 border-slate-900 rounded-xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all disabled:opacity-50 ${
                role === 'TEACHER' ? 'bg-yellow-300' : 'bg-purple-300'
              }`}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              {loading ? 'Authenticating...' : `Sign in as ${role === 'TEACHER' ? 'Teacher' : 'Student'}`}
            </button>
          </form>

          {/* Quick Demo Fill Buttons */}
          <div className="pt-4 border-t-2 border-slate-900/10 space-y-2">
            <span className="text-[10px] font-black uppercase text-slate-500 block text-center">
              Quick Demo Logins
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setRole('TEACHER');
                  setUsername('Teacher_1');
                  setPassword('teacher123');
                }}
                className="px-2 py-1.5 bg-yellow-100 hover:bg-yellow-200 border-2 border-slate-900 rounded-lg font-bold text-slate-900 text-center cursor-pointer transition-colors"
              >
                Teacher_1
              </button>
              <button
                type="button"
                onClick={() => {
                  setRole('STUDENT');
                  setUsername('Student_1');
                  setPassword('password123');
                }}
                className="px-2 py-1.5 bg-purple-100 hover:bg-purple-200 border-2 border-slate-900 rounded-lg font-bold text-slate-900 text-center cursor-pointer transition-colors"
              >
                Student_1
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
