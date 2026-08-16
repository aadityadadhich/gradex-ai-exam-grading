import React from 'react';
import { BookOpen, Bot, Upload, PlayCircle, UserCheck, BarChart3, CheckCircle2, LogOut, User, GraduationCap, Building2, ShieldCheck } from 'lucide-react';

export default function Header({ activeTab, setActiveTab, activeExam, user, onLogout }) {
  const teacherTabs = [
    { id: 'setup', label: 'Examination Setup', icon: BookOpen },
    { id: 'rubric', label: 'Evaluation Rubric', icon: Bot },
    { id: 'upload', label: 'Script Ingestion', icon: Upload },
    { id: 'process', label: 'AI Assessment Pipeline', icon: PlayCircle },
    { id: 'hitl', label: 'Faculty Moderation (HITL)', icon: UserCheck },
    { id: 'results', label: 'Master Gradebook', icon: BarChart3 },
  ];

  const isTeacher = user?.role === 'TEACHER';

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      {/* Top Academic Institution Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Brand & Institution Title */}
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center text-white shadow-sm font-serif font-bold text-lg tracking-wider">
            G
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                GRADEX ACADEMIC EVALUATION SYSTEM
              </h1>
              <span className="academic-badge badge-blue text-[11px] py-0.5 px-2">
                OFFICIAL
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              University Automated Assessment & Examination Authority
            </p>
          </div>
        </div>

        {/* Right Info: User Profile Badge, Active Course/Exam & Logout */}
        <div className="flex flex-wrap items-center gap-3">
          {activeExam && isTeacher && (
            <div className="academic-badge badge-green py-1 px-3">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>Active Course: <b>{activeExam.exam_name}</b> ({activeExam.total_marks} Marks)</span>
            </div>
          )}

          {user && (
            <div className="academic-badge badge-slate py-1 px-3">
              {isTeacher ? <User className="w-3.5 h-3.5 text-slate-600" /> : <GraduationCap className="w-3.5 h-3.5 text-slate-600" />}
              <span className="font-semibold text-slate-700">
                {isTeacher ? 'Faculty' : 'Candidate'}: <span className="font-mono text-slate-900">{user.username}</span>
              </span>
            </div>
          )}

          {user && (
            <button
              onClick={onLogout}
              className="academic-button-secondary px-3 py-1.5 text-xs flex items-center gap-1.5 cursor-pointer text-slate-600 hover:text-slate-900"
              title="Sign Out of Session"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          )}
        </div>
      </div>

      {/* Navigation Sub-bar for Faculty */}
      {isTeacher && (
        <div className="bg-slate-900 text-white px-4 sm:px-6 lg:px-8 border-t border-slate-800">
          <div className="max-w-7xl mx-auto flex items-center gap-1 py-1.5 overflow-x-auto">
            {teacherTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
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
