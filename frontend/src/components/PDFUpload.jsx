import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Upload, FileCheck, AlertCircle, ArrowRight, CheckCircle2, Files, Loader2 } from 'lucide-react';

export default function PDFUpload({ activeExam, onNext }) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

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

  const handleFilesSelected = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleBulkUpload = async (e) => {
    e.preventDefault();
    if (!activeExam) {
      alert('Please select or create an exam first.');
      return;
    }
    if (selectedFiles.length === 0) {
      alert('Please select one or more PDF answer scripts.');
      return;
    }

    setUploading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append('pdf_files', file);
      });

      const res = await api.bulkSubmitStudentPdfs(activeExam.id, formData);
      setSuccessMsg(`Successfully uploaded and linked ${res.data.uploaded_count} student answer copies!`);
      setSelectedFiles([]);
      const inputEl = document.getElementById('bulkPdfInput');
      if (inputEl) inputEl.value = '';
      await fetchSubmissions();
    } catch (err) {
      setErrorMsg('Bulk upload failed: ' + (err.response?.data?.detail || err.message));
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
              Bulk Upload Student Answer Copies
            </h2>
            <p className="text-xs text-slate-600 font-semibold mt-1">
              Upload multiple student PDFs at once for exam: <b className="text-slate-900">{activeExam.exam_name}</b>. Roll numbers are automatically detected from PDF filenames (e.g. <code>Student_1.pdf</code> &rarr; <b>Student_1</b>).
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

        {successMsg && (
          <div className="bg-emerald-200 border-2 border-slate-900 rounded-xl p-4 flex items-center gap-3 text-xs font-bold text-slate-900 neo-badge">
            <CheckCircle2 className="w-5 h-5 text-emerald-800 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleBulkUpload} className="space-y-6">
          <div className="bg-purple-50 border-2 border-dashed border-slate-900 rounded-2xl p-8 text-center space-y-4">
            <Files className="w-12 h-12 text-purple-700 mx-auto" />
            <div>
              <h4 className="font-black text-slate-900 text-base">Select Single or Multiple Student Answer PDFs</h4>
              <p className="text-xs text-slate-600 font-semibold mt-1">
                You can select all 37 student copies at once (e.g. Student_1.pdf to Student_37.pdf)
              </p>
            </div>

            <input
              id="bulkPdfInput"
              type="file"
              accept=".pdf"
              multiple
              onChange={handleFilesSelected}
              className="block mx-auto text-xs text-slate-700 file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-2 file:border-slate-900 file:text-xs file:font-black file:bg-yellow-300 file:text-slate-900 cursor-pointer"
              required
            />

            {selectedFiles.length > 0 && (
              <div className="bg-white border-2 border-slate-900 rounded-xl p-3 inline-block shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                <span className="text-xs font-black text-slate-900">
                  📁 {selectedFiles.length} PDF files selected for upload
                </span>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={uploading || selectedFiles.length === 0}
              className="neo-button-accent px-6 py-3 flex items-center gap-2 text-sm cursor-pointer disabled:opacity-50"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {uploading ? `Uploading ${selectedFiles.length} PDFs...` : `Upload ${selectedFiles.length || ''} Student Copies`}
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
                  <CheckCircle2 className="w-3 h-3" /> Linked
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
