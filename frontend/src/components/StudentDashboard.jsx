import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { BookOpen, FileText, CheckCircle2, AlertCircle, Download, HelpCircle, MessageSquare, ArrowRight, Loader2, Sparkles, Send, GraduationCap, ShieldCheck } from 'lucide-react';

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
      setRecheckSuccessMsg(`Verification request submitted for Question ${recheckModalItem.question_id}. A faculty examiner will review your submission.`);
      setRecheckModalItem(null);
      await loadExamReport(selectedExamId);
    } catch (err) {
      alert('Failed to submit verification request: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSubmittingRecheck(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Student Welcome Header Card */}
      <div className="academic-card p-6 bg-white border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="academic-badge badge-blue">
              <GraduationCap className="w-3.5 h-3.5 text-blue-700" /> CANDIDATE ASSESSMENT PROFILE
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-2">
            {user.full_name || user.username}
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Student Enrollment / Roll No: <span className="font-mono text-slate-800 font-bold">{rollNo}</span>
          </p>
        </div>

        {report && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg px-5 py-3 text-right">
            <span className="text-[11px] uppercase font-bold text-slate-500 block">Overall Exam Score</span>
            <span className="text-2xl font-bold text-slate-900">
              {report.total_marks} <span className="text-xs text-slate-400 font-medium">/ {report.max_total_marks} Marks</span>
            </span>
          </div>
        )}
      </div>

      {recheckSuccessMsg && (
        <div className="academic-badge badge-green p-3 rounded-lg flex items-center gap-2.5 w-full text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
          <span>{recheckSuccessMsg}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Column: Registered Exams */}
        <div className="lg:col-span-1 space-y-4">
          <div className="academic-card p-4 bg-white space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-2 border-b border-slate-100 pb-2">
              <BookOpen className="w-4 h-4 text-blue-600" /> Completed Examinations
            </h3>

            {loading ? (
              <div className="text-center py-6 text-xs text-slate-500 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" /> Loading records...
              </div>
            ) : exams.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500">
                No evaluated examinations found for Roll No: <b>{rollNo}</b>.
              </div>
            ) : (
              <div className="space-y-2">
                {exams.map((ex) => {
                  const isSelected = selectedExamId === ex.exam_id;
                  return (
                    <button
                      key={ex.exam_id}
                      onClick={() => loadExamReport(ex.exam_id)}
                      className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50 border-blue-300 text-blue-900 font-bold'
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="text-xs font-semibold">{ex.exam_name}</div>
                      <div className="text-[11px] text-slate-500 font-medium">{ex.subject}</div>
                      {ex.scored_marks !== null && (
                        <div className="text-xs font-bold text-emerald-700 mt-1.5 flex items-center justify-between">
                          <span>Score: {ex.scored_marks} / {ex.total_marks}</span>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">Evaluated</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Question-by-Question Evaluation */}
        <div className="lg:col-span-3 space-y-6">
          {reportLoading ? (
            <div className="academic-card p-12 text-center text-slate-600 text-xs font-medium flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" /> Loading examination evaluation details...
            </div>
          ) : !report ? (
            <div className="academic-card p-12 text-center text-slate-500 text-xs font-medium">
              Select an examination from the left panel to inspect your evaluated response sheet.
            </div>
          ) : (
            <div className="space-y-5">
              
              {/* Header Bar */}
              <div className="academic-card p-5 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{report.exam_name}</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Subject: {report.subject} • Official Question-by-Question Assessment
                  </p>
                </div>

                <a
                  href={api.getDownloadPdfUrl(report.exam_id, rollNo)}
                  download
                  className="academic-button-primary px-3.5 py-2 text-xs flex items-center gap-2 inline-flex"
                >
                  <Download className="w-3.5 h-3.5" /> Official Grade Sheet PDF
                </a>
              </div>

              {/* Questions List */}
              <div className="space-y-4">
                {report.questions.map((q, idx) => {
                  return (
                    <div key={idx} className="academic-card p-5 bg-white space-y-4">
                      
                      {/* Top Question Row */}
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-3">
                          <span className="academic-badge badge-slate font-bold">
                            Question {q.question_id}
                          </span>
                          <span className="text-xs text-slate-600">
                            Marks Awarded: <b className="text-slate-900 font-bold">{q.marks_awarded}</b> / {q.max_marks}
                          </span>
                        </div>

                        <div>
                          {q.recheck_requested ? (
                            <span className="academic-badge badge-amber">
                              <HelpCircle className="w-3 h-3 text-amber-700" /> Under Faculty Review
                            </span>
                          ) : q.recheck_status === 'RESOLVED' ? (
                            <span className="academic-badge badge-green">
                              <CheckCircle2 className="w-3 h-3 text-emerald-700" /> Rechecked by Faculty
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenRecheckModal(q)}
                              className="academic-button-secondary px-2.5 py-1 text-xs flex items-center gap-1.5 cursor-pointer text-slate-600 hover:text-slate-900"
                            >
                              <MessageSquare className="w-3.5 h-3.5" /> Request Recheck
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Side-by-Side Comparison Panes */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* Left Pane: Student OCR Extract */}
                        <div className="bg-slate-900 text-slate-100 rounded-lg p-4 space-y-2">
                          <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-blue-400" /> Student Answer Script (OCR Extract)
                          </span>
                          <div className="font-mono text-xs text-slate-200 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                            {q.ocr_text_preview || 'No handwritten response detected.'}
                          </div>
                        </div>

                        {/* Right Pane: AI & Faculty Reasoning */}
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
                          <div>
                            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Automated Assessment Logic
                            </span>
                            <p className="text-xs text-slate-700 font-medium mt-1 leading-relaxed">
                              {q.ai_reasoning || 'Evaluated against marking rubric criteria.'}
                            </p>
                          </div>

                          {q.teacher_feedback && (
                            <div className="academic-badge badge-green w-full p-2.5 rounded text-xs block">
                              <b>Faculty Note:</b> {q.teacher_feedback}
                            </div>
                          )}

                          {q.recheck_comment && (
                            <div className="academic-badge badge-amber w-full p-2.5 rounded text-xs block">
                              <b>Your Verification Request:</b> "{q.recheck_comment}"
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

      {/* Verification Request Modal */}
      {recheckModalItem && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="academic-card p-6 bg-white max-w-lg w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-blue-600" />
                Submit Verification Request — Question {recheckModalItem.question_id}
              </h4>
              <span className="text-xs text-slate-500 font-medium">Max: {recheckModalItem.max_marks} Marks</span>
            </div>

            <form onSubmit={handleSubmitRecheck} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Explanation / Clarification for Faculty Examiner
                </label>
                <textarea
                  value={recheckComment}
                  onChange={(e) => setRecheckComment(e.target.value)}
                  placeholder="State specifically which part of your response requires re-evaluation..."
                  rows={4}
                  className="academic-input w-full p-3 text-xs resize-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setRecheckModalItem(null)}
                  className="academic-button-secondary px-3.5 py-2 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submittingRecheck}
                  className="academic-button-primary px-4 py-2 text-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submittingRecheck ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  {submittingRecheck ? 'Submitting...' : 'Submit to Faculty Queue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
