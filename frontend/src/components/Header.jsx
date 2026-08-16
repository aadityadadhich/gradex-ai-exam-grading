import React from 'react';
import { BookOpen, Bot, Upload, PlayCircle, UserCheck, BarChart3, CheckCircle2, LogOut, User, GraduationCap } from 'lucide-react';

export default function Header({ activeTab, setActiveTab, activeExam, user, onLogout }) {
  const teacherTabs = [
    { id: 'setup', label: '1. Exam Setup', icon: BookOpen },
    { id: 'rubric', label: '2. Rubric Bot', icon: Bot },
    { id: 'upload', label: '3. Bulk PDF Upload', icon: Upload },
    { id: 'process', label: '4. AI Pipeline', icon: PlayCircle },
    { id: 'hitl', label: '5. HITL Review', icon: UserCheck },
    { id: 'results', label: '6. Scoresheet', icon: BarChart3 },
  ];

  const isTeacher = user?.role === 'TEACHER';

  return (
    <header className="bg-white border-b-4 border-slate-900 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Brand Title */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-yellow-300 border-2 border-slate-900 rounded-xl shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] flex items-center justify-center font-extrabold text-xl text-slate-900">
            G
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              GRADEX <span className="text-xs px-2.5 py-0.5 bg-purple-200 text-slate-900 border-2 border-slate-900 neo-badge">AI GRADING</span>
            </h1>
            <p className="text-xs text-slate-600 font-semibold">
              Subjective Exam Evaluation Engine
            </p>
          </div>
        </div>

        {/* Right Info: User Profile Badge, Active Exam & Logout */}
        <div className="flex flex-wrap items-center gap-3">
          {activeExam && isTeacher && (
            <div className="bg-emerald-200 border-2 border-slate-900 rounded-xl px-4 py-1.5 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] flex items-center gap-2 text-xs font-bold text-slate-900">
              <CheckCircle2 className="w-4 h-4 text-slate-900" />
              <span>Exam: <b>{activeExam.exam_name}</b></span>
            </div>
          )}

          {user && (
            <div className={`border-2 border-slate-900 rounded-xl px-3.5 py-1.5 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] flex items-center gap-2 text-xs font-black ${
              isTeacher ? 'bg-yellow-200 text-slate-900' : 'bg-purple-200 text-slate-900'
            }`}>
              {isTeacher ? <User className="w-3.5 h-3.5" /> : <GraduationCap className="w-3.5 h-3.5" />}
              <span>{isTeacher ? 'Teacher' : 'Student'}: {user.username}</span>
            </div>
          )}

          {user && (
            <button
              onClick={onLogout}
              className="px-3 py-1.5 bg-rose-200 hover:bg-rose-300 border-2 border-slate-900 rounded-xl text-xs font-black text-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          )}
        </div>
      </div>

      {/* Teacher Navigation Tabs */}
      {isTeacher && (
        <div className="bg-slate-900 text-white px-4 sm:px-6 lg:px-8 overflow-x-auto">
          <div className="max-w-7xl mx-auto flex items-center gap-2 py-2">
            {teacherTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer border-2 ${
                    isActive
                      ? 'bg-yellow-300 text-slate-900 border-slate-900 shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] translate-y-[-2px]'
                      : 'bg-slate-800 text-slate-300 border-transparent hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
