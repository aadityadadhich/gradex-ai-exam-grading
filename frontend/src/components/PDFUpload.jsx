import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Upload, FileCheck, AlertCircle, ArrowRight, CheckCircle2, Files, Loader2, FileSpreadsheet } from 'lucide-react';

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
      alert('Please select an active examination session first.');
      return;
    }
    if (selectedFiles.length === 0) {
      alert('Please select one or more candidate response PDF files.');
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
      setSuccessMsg(`Successfully uploaded and indexed ${res.data.uploaded_count} candidate response scripts!`);
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
      <div className="academic-card p-12 text-center space-y-3 bg-white">
        <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
        <h3 className="text-base font-bold text-slate-900">No Examination Selected</h3>
        <p className="text-slate-500 text-xs max-w-md mx-auto">
          Please select an examination session in Step 1 before uploading candidate response scripts.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Upload Form */}
      <div className="academic-card p-6 bg-white space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2.5">
              <Upload className="w-5 h-5 text-blue-600" />
              Candidate Script Ingestion (Bulk Upload)
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Ingest scanned handwritten candidate response scripts for: <b className="text-slate-800">{activeExam.exam_name}</b>. Student roll numbers are automatically parsed from filenames (e.g. <code>Student_1.pdf</code> &rarr; <b>Student_1</b>).
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Ingested Scripts</span>
            <span className="text-xl font-bold text-slate-900">{submissions.length}</span>
          </div>
        </div>

        {errorMsg && (
          <div className="academic-badge badge-rose p-3 rounded-lg flex items-center gap-2 w-full text-xs">
            <AlertCircle className="w-4 h-4 text-rose-700 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="academic-badge badge-green p-3 rounded-lg flex items-center gap-2.5 w-full text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleBulkUpload} className="space-y-5">
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-8 text-center space-y-3">
            <Files className="w-10 h-10 text-blue-600 mx-auto" />
            <div>
              <h4 className="font-semibold text-slate-800 text-xs">Select Candidate Response Sheets (PDF)</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Multi-file selection supported (Upload up to 100+ student copies in a single batch)
              </p>
            </div>

            <input
              id="bulkPdfInput"
              type="file"
              accept=".pdf"
              multiple
              onChange={handleFilesSelected}
              className="block mx-auto text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border file:border-slate-300 file:text-xs file:font-semibold file:bg-white file:text-slate-700 cursor-pointer"
              required
            />

            {selectedFiles.length > 0 && (
              <div className="academic-badge badge-blue py-1.5 px-3">
                <span>📁 {selectedFiles.length} PDF script files queued for ingestion</span>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={uploading || selectedFiles.length === 0}
              className="academic-button-primary px-5 py-2.5 flex items-center gap-2 text-xs font-semibold cursor-pointer disabled:opacity-50"
            >
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              {uploading ? `Ingesting ${selectedFiles.length} Scripts...` : `Ingest ${selectedFiles.length || ''} Candidate Scripts`}
            </button>
          </div>
        </form>
      </div>

      {/* Ingested List */}
      {submissions.length > 0 && (
        <div className="academic-card p-5 bg-white space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-600" />
              Indexed Ingestion Queue ({submissions.length} Scripts)
            </h3>

            <button
              onClick={onNext}
              className="academic-button-primary px-4 py-1.5 flex items-center gap-2 text-xs font-semibold cursor-pointer"
            >
              Proceed to Assessment Pipeline <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
            {submissions.map((sub) => (
              <div key={sub.id} className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-center space-y-0.5">
                <span className="text-xs font-bold text-slate-800 block font-mono">{sub.roll_no}</span>
                <span className="text-[10px] text-emerald-700 font-semibold flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5" /> Indexed
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
