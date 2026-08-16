import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { BookOpen, Plus, Trash2, CheckCircle2, ArrowRight, Layers, AlertCircle, Loader2 } from 'lucide-react';

export default function ExamSetup({ activeExam, setActiveExam, onComplete }) {
  const [exams, setExams] = useState([]);
  const [examName, setExamName] = useState('Data Science Examination');
  const [subject, setSubject] = useState('Data Science');
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Flexible exam structure preset (Part I: MCQs, Part II: Short Answer)
  const [structure, setStructure] = useState([
    { part: 'I', num_questions: 20, marks_per_question: 1, type: 'MCQ' },
    { part: 'II', num_questions: 15, marks_per_question: 2, type: 'Short_Answer' }
  ]);

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const res = await api.listExams();
      setExams(res.data);
      if (res.data.length > 0 && !activeExam) {
        setActiveExam(res.data[0]);
      }
    } catch (err) {
      console.error('Error fetching exams:', err);
    }
  };

  const handleCreateExam = async (e) => {
    e.preventDefault();
    if (!examName || !subject) {
      alert('Please fill in exam name and subject.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.createExam({
        exam_name: examName,
        subject: subject,
        exam_structure: structure
      });
      setActiveExam(res.data);
      await fetchExams();
      if (onComplete) onComplete();
    } catch (err) {
      alert('Failed to create exam: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExam = async (examId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this exam and all its evaluations?')) {
      return;
    }

    setDeletingId(examId);
    try {
      await api.deleteExam(examId);
      if (activeExam?.id === examId) {
        setActiveExam(null);
      }
      await fetchExams();
    } catch (err) {
      alert('Failed to delete exam: ' + (err.response?.data?.detail || err.message));
    } finally {
      setDeletingId(null);
    }
  };

  const updatePart = (index, field, value) => {
    const updated = [...structure];
    updated[index][field] = value;
    setStructure(updated);
  };

  const addPart = () => {
    const nextPartLabel = String.fromCharCode(65 + structure.length); // A, B, C...
    setStructure([
      ...structure,
      { part: nextPartLabel, num_questions: 5, marks_per_question: 2, type: 'Short_Answer' }
    ]);
  };

  const removePart = (index) => {
    if (structure.length <= 1) {
      alert('An exam must have at least one part.');
      return;
    }
    setStructure(structure.filter((_, idx) => idx !== index));
  };

  const calculatedTotalMarks = structure.reduce(
    (sum, p) => sum + (parseInt(p.num_questions) || 0) * (parseInt(p.marks_per_question) || 0),
    0
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Existing Exams Selector */}
      {exams.length > 0 && (
        <div className="neo-box p-6 space-y-4">
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2">
            <h3 className="text-xs font-black uppercase text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-700" />
              Existing Exams ({exams.length})
            </h3>
            <span className="text-xs text-slate-500 font-bold">Select an exam to manage or delete</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {exams.map((ex) => {
              const isSelected = activeExam?.id === ex.id;
              return (
                <div
                  key={ex.id}
                  onClick={() => setActiveExam(ex)}
                  className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-yellow-300 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] translate-y-[-2px]'
                      : 'bg-white border-slate-900 hover:bg-slate-50 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-black text-slate-900 text-sm">{ex.exam_name}</h4>
                      <p className="text-xs text-slate-700 font-semibold mt-0.5">{ex.subject}</p>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleDeleteExam(ex.id, e)}
                      disabled={deletingId === ex.id}
                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-slate-900"
                      title="Delete Exam"
                    >
                      {deletingId === ex.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-900/20 text-xs font-bold">
                    <span className="text-slate-800">Total: {ex.total_marks} Marks</span>
                    {isSelected && (
                      <span className="flex items-center gap-1 text-slate-900 font-black">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-800" /> Active
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Create New Exam Form */}
      <div className="neo-box p-8 space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b-2 border-slate-900 pb-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <BookOpen className="w-7 h-7 text-slate-900" />
              Create Exam Structure
            </h2>
            <p className="text-xs text-slate-600 font-semibold mt-1">
              Define the subject, question types, and parts breakdown (0 questions allowed for unused parts).
            </p>
          </div>

          <div className="bg-emerald-200 border-2 border-slate-900 rounded-xl px-4 py-2 text-right shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]">
            <span className="text-[10px] uppercase font-black text-slate-800 block">Calculated Total Marks</span>
            <span className="text-2xl font-black text-slate-900">{calculatedTotalMarks}</span>
          </div>
        </div>

        <form onSubmit={handleCreateExam} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-black uppercase text-slate-900 mb-2">Exam Title</label>
              <input
                type="text"
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
                placeholder="e.g. Data Science Examination"
                className="neo-input w-full px-4 py-3 text-sm font-bold"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-900 mb-2">Subject / Course</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Data Science"
                className="neo-input w-full px-4 py-3 text-sm font-bold"
                required
              />
            </div>
          </div>

          {/* Exam Parts Setup */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                Exam Parts Breakdown
              </h3>
              <button
                type="button"
                onClick={addPart}
                className="neo-button-yellow px-3 py-1.5 text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Exam Part
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {structure.map((part, idx) => (
                <div key={idx} className="bg-slate-50 border-2 border-slate-900 rounded-xl p-4 space-y-3 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm text-slate-900">Part</span>
                      <input
                        type="text"
                        value={part.part}
                        onChange={(e) => updatePart(idx, 'part', e.target.value)}
                        className="neo-input w-16 px-2 py-1 text-xs font-black uppercase text-center"
                      />
                    </div>
                    {structure.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePart(idx)}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                        title="Remove Part"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Number of Questions</label>
                    <input
                      type="number"
                      min="0"
                      value={part.num_questions}
                      onChange={(e) => updatePart(idx, 'num_questions', Math.max(0, parseInt(e.target.value) || 0))}
                      className="neo-input w-full px-3 py-2 text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Marks per Question</label>
                    <input
                      type="number"
                      min="1"
                      value={part.marks_per_question}
                      onChange={(e) => updatePart(idx, 'marks_per_question', Math.max(1, parseInt(e.target.value) || 1))}
                      className="neo-input w-full px-3 py-2 text-xs font-bold"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={loading}
              className="neo-button-primary px-6 py-3 flex items-center gap-2 text-sm cursor-pointer disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {loading ? 'Creating Exam...' : 'Create Exam & Continue'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
