import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { BookOpen, FileText, CheckCircle2, AlertCircle, Download, HelpCircle, MessageSquare, ArrowRight, Loader2, Sparkles, Send } from 'lucide-react';

export default function StudentDashboard({ user }) {
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [recheckModalItem, setRecheckModalItem] = useState(null);
  const [recheckComment, setRecheckComment] = useState('');
  const [submittingRecheck, setSubmittingRecheck] = useState(false);
  const [recheckSuccessMsg, setRecheckSuccessMsg] = useState('');

  const rollNo = user.username;

  useEffect(() => {
    fetchStudentExams();
  }, [rollNo]);

  const fetchStudentExams = async () => {
    setLoading(true);
    try {
      const res = await api.getStudentExams(rollNo);
      setExams(res.data);
      if (res.data.length > 0 && !selectedExamId) {
        loadExamReport(res.data[0].exam_id);
      }
    } catch (err) {
      console.error('Error fetching student exams:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadExamReport = async (examId) => {
    setSelectedExamId(examId);
    setReportLoading(true);
    setRecheckSuccessMsg('');
    try {
      const res = await api.getStudentReport(rollNo, examId);
      setReport(res.data);
    } catch (err) {
      console.error('Error fetching exam report:', err);
      setReport(null);
    } finally {
      setReportLoading(false);
    }
  };

  const handleOpenRecheckModal = (qItem) => {
    setRecheckModalItem(qItem);
    setRecheckComment(qItem.recheck_comment || '');
    setRecheckSuccessMsg('');
  };

  const handleSubmitRecheck = async (e) => {
    e.preventDefault();
    if (!recheckModalItem || !recheckComment.trim()) return;

    setSubmittingRecheck(true);
    try {
      await api.submitStudentRecheck(rollNo, selectedExamId, {
        evaluation_id: recheckModalItem.evaluation_id,
        comment: recheckComment.trim()
      });
      setRecheckSuccessMsg(`Recheck request submitted for Question ${recheckModalItem.question_id}! A teacher will review it.`);
      setRecheckModalItem(null);
      await loadExamReport(selectedExamId);
    } catch (err) {
      alert('Failed to submit recheck request: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSubmittingRecheck(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">
      {/* Student Welcome Card */}
      <div className="bg-purple-100 border-3 border-slate-900 rounded-2xl p-6 shadow-[5px_5px_0px_0px_rgba(15,23,42,1)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="px-3 py-1 bg-purple-300 border-2 border-slate-900 rounded-lg text-xs font-black text-slate-900 neo-badge">
            🎓 STUDENT PORTAL
          </span>
          <h2 className="text-2xl font-black text-slate-900 mt-2">
            Welcome, {user.full_name || user.username}
          </h2>
          <p className="text-xs text-slate-700 font-bold mt-1">
            Roll Number: <span className="font-mono text-purple-900">{rollNo}</span>
          </p>
        </div>

        {report && (
          <div className="bg-white border-2 border-slate-900 rounded-xl px-5 py-3 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] text-right">
            <span className="text-[10px] uppercase font-black text-slate-600 block">Total Exam Score</span>
            <span className="text-2xl font-black text-emerald-800">
              {report.total_marks} <span className="text-xs text-slate-500 font-bold">/ {report.max_total_marks} Marks</span>
            </span>
          </div>
        )}
      </div>

      {recheckSuccessMsg && (
        <div className="bg-emerald-100 border-2 border-slate-900 rounded-xl p-4 flex items-center gap-3 text-xs font-bold text-slate-900 neo-badge">
          <CheckCircle2 className="w-5 h-5 text-emerald-700 flex-shrink-0" />
          <span>{recheckSuccessMsg}</span>
        </div>
      )}

      {/* Main Grid: Exam List & Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Column: List of Student's Evaluated Exams */}
        <div className="lg:col-span-1 space-y-4">
          <div className="neo-box p-5 space-y-4 bg-white">
            <h3 className="font-black text-sm uppercase text-slate-900 flex items-center gap-2 border-b-2 border-slate-900 pb-2">
              <BookOpen className="w-4 h-4" /> My Exam Papers
            </h3>

            {loading ? (
              <div className="text-center py-6 text-xs text-slate-600 font-bold flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading Exams...
              </div>
            ) : exams.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500 font-medium">
                No evaluated exams found for Roll No: <b>{rollNo}</b>.
              </div>
            ) : (
              <div className="space-y-2.5">
                {exams.map((ex) => {
                  const isSelected = selectedExamId === ex.exam_id;
                  return (
                    <button
                      key={ex.exam_id}
                      onClick={() => loadExamReport(ex.exam_id)}
                      className={`w-full text-left p-3 rounded-xl border-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-yellow-300 border-slate-900 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] translate-x-1 font-black text-slate-900'
                          : 'bg-slate-50 border-slate-900 hover:bg-slate-100 text-slate-700 font-bold'
                      }`}
                    >
                      <div className="text-xs">{ex.exam_name}</div>
                      <div className="text-[10px] text-slate-600 font-medium">{ex.subject}</div>
                      {ex.scored_marks !== null && (
                        <div className="text-xs font-black text-emerald-800 mt-1">
                          Score: {ex.scored_marks} / {ex.total_marks}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Detailed Side-by-Side Question Evaluation */}
        <div className="lg:col-span-3 space-y-6">
          {reportLoading ? (
            <div className="neo-box p-12 text-center text-slate-700 font-bold flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-purple-700" /> Loading Detailed Question Evaluation...
            </div>
          ) : !report ? (
            <div className="neo-box p-12 text-center text-slate-600 font-bold">
              Select an exam from the left panel to inspect your paper evaluation.
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Header Bar with Grade Report Download */}
              <div className="neo-box p-6 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-black text-slate-900">{report.exam_name} ({report.subject})</h3>
                  <p className="text-xs text-slate-600 font-bold mt-0.5">
                    Detailed Question-by-Question Evaluation Breakdown
                  </p>
                </div>

                <a
                  href={api.getDownloadPdfUrl(report.exam_id, rollNo)}
                  download
                  className="neo-button-primary px-4 py-2 text-xs flex items-center gap-2 inline-flex"
                >
                  <Download className="w-4 h-4" /> Download Official Grade Report PDF
                </a>
              </div>

              {/* Questions List (Side-by-Side View for Each Question) */}
              <div className="space-y-6">
                {report.questions.map((q, idx) => {
                  return (
                    <div key={idx} className="neo-box p-6 bg-white space-y-4">
                      
                      {/* Top Header of Question Card */}
                      <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
                        <div className="flex items-center gap-3">
                          <span className="px-3 py-1 bg-yellow-200 border-2 border-slate-900 text-xs font-black rounded-lg text-slate-900">
                            Question {q.question_id}
                          </span>
                          <span className="text-xs font-black text-slate-900">
                            Marks Awarded: <b className="text-emerald-800 text-sm">{q.marks_awarded}</b> / {q.max_marks}
                          </span>
                        </div>

                        {/* Recheck Status / Request Button */}
                        <div>
                          {q.recheck_requested ? (
                            <span className="px-3 py-1 bg-amber-200 border-2 border-slate-900 rounded-full text-xs font-black text-slate-900 flex items-center gap-1.5">
                              <HelpCircle className="w-3.5 h-3.5 text-amber-900" /> Under Teacher Recheck
                            </span>
                          ) : q.recheck_status === 'RESOLVED' ? (
                            <span className="px-3 py-1 bg-emerald-200 border-2 border-slate-900 rounded-full text-xs font-black text-slate-900 flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-900" /> Rechecked by Teacher
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenRecheckModal(q)}
                              className="neo-button-yellow px-3 py-1.5 text-xs flex items-center gap-1.5 cursor-pointer"
                            >
                              <MessageSquare className="w-3.5 h-3.5" /> Request Recheck
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Side-by-Side Comparison Panes */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* Left Pane: Extracted Student Answer Script */}
                        <div className="bg-slate-900 text-slate-100 rounded-xl p-4 border-2 border-slate-900 space-y-2">
                          <span className="text-[11px] font-black uppercase text-yellow-300 block flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5" /> Student Extracted OCR Text
                          </span>
                          <div className="font-mono text-xs leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                            {q.ocr_text_preview || 'No handwritten answer detected for this question.'}
                          </div>
                        </div>

                        {/* Right Pane: AI Evaluation Logic & Teacher Notes */}
                        <div className="bg-slate-50 border-2 border-slate-900 rounded-xl p-4 space-y-3">
                          <div>
                            <span className="text-[11px] font-black uppercase text-slate-900 block flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-purple-700" /> AI Evaluation Reasoning
                            </span>
                            <p className="text-xs text-slate-800 font-medium mt-1 leading-relaxed">
                              {q.ai_reasoning || 'Evaluated against marking rubric criteria.'}
                            </p>
                          </div>

                          {q.teacher_feedback && (
                            <div className="bg-emerald-100 border-2 border-slate-900 rounded-lg p-2.5 text-xs text-slate-900">
                              <b className="text-emerald-900">Teacher Override Note:</b> {q.teacher_feedback}
                            </div>
                          )}

                          {q.recheck_comment && (
                            <div className="bg-amber-100 border-2 border-slate-900 rounded-lg p-2.5 text-xs text-slate-900">
                              <b className="text-amber-900">Your Recheck Comment:</b> {q.recheck_comment}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Recheck Modal */}
      {recheckModalItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="neo-box p-6 bg-white max-w-lg w-full space-y-4 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]">
            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
              <h4 className="font-black text-base text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-amber-600" />
                Raise Recheck for Question {recheckModalItem.question_id}
              </h4>
              <span className="text-xs font-bold text-slate-600">Max: {recheckModalItem.max_marks} Marks</span>
            </div>

            <form onSubmit={handleSubmitRecheck} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-slate-900 mb-1.5">
                  Explain what needs to be reviewed by the Teacher
                </label>
                <textarea
                  value={recheckComment}
                  onChange={(e) => setRecheckComment(e.target.value)}
                  placeholder="e.g., I explained the derivation in point 2 with all required equations which was partially missed by OCR."
                  rows={4}
                  className="neo-input w-full p-3 text-xs font-medium resize-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRecheckModalItem(null)}
                  className="px-4 py-2 border-2 border-slate-900 rounded-xl font-bold text-xs hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submittingRecheck}
                  className="neo-button-primary px-5 py-2 text-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submittingRecheck ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {submittingRecheck ? 'Submitting...' : 'Submit to Teacher for HITL Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
