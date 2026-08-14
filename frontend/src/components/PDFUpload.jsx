import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Upload, FileCheck, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function PDFUpload({ activeExam, onNext }) {
  const [rollNo, setRollNo] = useState('Student_1');
  const [pdfFile, setPdfFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (activeExam) {
      fetchSubmissions();
    }
  }, [activeExam]);

  const fetchSubmissions = async () => {
    try {
      const res = await api.listSubmissions(activeExam.id);
      setSubmissions(res.data);
    } catch (err) {
      console.error('Error fetching submissions:', err);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!activeExam) {
      alert('Please select or create an exam first.');
      return;
    }
    if (!rollNo.trim() || !pdfFile) {
      alert('Please enter a student Roll Number and select a PDF file.');
      return;
    }

    setUploading(true);
    setErrorMsg('');
    try {
      const formData = new FormData();
      formData.append('roll_no', rollNo.trim());
      formData.append('pdf_file', pdfFile);

      await api.submitStudentPdf(activeExam.id, formData);
      await fetchSubmissions();

      // Increment roll number automatically for rapid entry (Student_1 -> Student_2)
      const numMatch = rollNo.match(/(\d+)/);
      if (numMatch) {
        const nextNum = (parseInt(numMatch[1]) + 1).toString();
        const prefix = rollNo.substring(0, numMatch.index);
        setRollNo(`${prefix}${nextNum}`);
      }
      setPdfFile(null);
      const inputEl = document.getElementById('pdfInput');
      if (inputEl) inputEl.value = '';
    } catch (err) {
      setErrorMsg('Upload failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setUploading(false);
    }
  };

  if (!activeExam) {
    return (
      <div className="neo-box p-12 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
        <h3 className="text-xl font-black text-slate-900">No Active Exam Selected</h3>
        <p className="text-slate-600 text-sm max-w-md mx-auto font-medium">
          Please select an exam in Step 1 before uploading student submissions.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Upload Form */}
      <div className="neo-box p-8 space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b-2 border-slate-900 pb-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <Upload className="w-7 h-7 text-slate-900" />
              Upload Student Exam PDFs
            </h2>
            <p className="text-xs text-slate-600 font-semibold mt-1">
              Upload handwritten or digital student answer PDFs for exam: <b className="text-slate-900">{activeExam.exam_name}</b>
            </p>
          </div>

          <div className="bg-yellow-200 border-2 border-slate-900 rounded-xl px-4 py-2 text-right shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]">
            <span className="text-[10px] uppercase font-black text-slate-800 block">Uploaded Papers</span>
            <span className="text-2xl font-black text-slate-900">{submissions.length}</span>
          </div>
        </div>

        {errorMsg && (
          <div className="bg-rose-200 border-2 border-slate-900 rounded-xl p-4 flex items-center gap-3 text-xs font-bold text-slate-900 neo-badge">
            <AlertCircle className="w-5 h-5 text-rose-700 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleUpload} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-black uppercase text-slate-900 mb-2">Student Roll Number / Identifier</label>
              <input
                type="text"
                value={rollNo}
                onChange={(e) => setRollNo(e.target.value)}
                placeholder="e.g., Student_1"
                className="neo-input w-full px-4 py-3 text-sm font-black uppercase"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-slate-900 mb-2">Handwritten PDF File</label>
              <input
                id="pdfInput"
                type="file"
                accept=".pdf"
                onChange={(e) => setPdfFile(e.target.files[0])}
                className="block w-full text-xs text-slate-700 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-2 file:border-slate-900 file:text-xs file:font-black file:bg-yellow-300 file:text-slate-900 cursor-pointer"
                required
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={uploading || !pdfFile || !rollNo}
              className="neo-button-accent px-6 py-3 flex items-center gap-2 text-sm cursor-pointer disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              {uploading ? 'Uploading PDF...' : 'Upload Student PDF'}
            </button>
          </div>
        </form>
      </div>

      {/* Uploaded List */}
      {submissions.length > 0 && (
        <div className="neo-box p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase text-slate-900 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-emerald-600" />
              Uploaded Submissions Batch ({submissions.length})
            </h3>

            <button
              onClick={onNext}
              className="neo-button-primary px-5 py-2 flex items-center gap-2 text-xs cursor-pointer"
            >
              Proceed to AI Pipeline <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {submissions.map((sub) => (
              <div key={sub.id} className="bg-slate-50 border-2 border-slate-900 rounded-xl p-3 text-center space-y-1 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                <span className="text-xs font-black text-slate-900 block font-mono">{sub.roll_no}</span>
                <span className="text-[10px] text-emerald-700 font-bold flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Uploaded
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
