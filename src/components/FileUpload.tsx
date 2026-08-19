import React, { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, AlertCircle, Loader2 } from 'lucide-react';
import { parseAttendanceFile } from '../utils/excelParser';
import { ParsedMonthData } from '../types/attendance';

interface FileUploadProps {
  onDataLoaded: (data: ParsedMonthData) => void;
  onOpenPolicy: () => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onDataLoaded, onOpenPolicy }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.xlsx') && !file.name.toLowerCase().endsWith('.xls')) {
      setErrorMessage('Please upload a valid Excel spreadsheet (.xlsx or .xls file).');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setLoadingMessage(`Reading "${file.name}"...`);

    try {
      await new Promise(r => setTimeout(r, 150));
      setLoadingMessage('Parsing raw 2D sheet layout & shift windows...');
      const parsedData = await parseAttendanceFile(file);
      setLoadingMessage('Computing monthly rollups, deductions, and anomaly flags...');
      await new Promise(r => setTimeout(r, 100));
      onDataLoaded(parsedData);
    } catch (err: any) {
      console.error('File parsing error:', err);
      setErrorMessage(
        err.message || 'Failed to parse the attendance Excel file. Please ensure it follows the standard monthly structure.'
      );
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4 md:p-8 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-xl w-full space-y-6">
        {/* Upload Card / Dropzone */}
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => !isLoading && fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-10 sm:p-12 text-center cursor-pointer transition-all duration-200 ${
            isDragging
              ? 'border-indigo-500 bg-indigo-950/30 scale-[1.01]'
              : 'border-slate-700/80 bg-slate-900/60 hover:border-slate-600 hover:bg-slate-900/90 shadow-xl'
          } ${isLoading ? 'pointer-events-none opacity-80' : ''}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={onFileInputChange}
            className="hidden"
          />

          <div className="flex flex-col items-center space-y-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-transform duration-200 ${
              isDragging ? 'bg-indigo-600 text-white scale-110' : 'bg-slate-800 text-indigo-400'
            }`}>
              {isLoading ? (
                <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
              ) : (
                <UploadCloud className="w-8 h-8" />
              )}
            </div>

            <div className="space-y-1.5">
              {isLoading ? (
                <div>
                  <p className="text-sm font-semibold text-slate-200">{loadingMessage || 'Processing workbook...'}</p>
                  <p className="text-xs text-slate-400 mt-1">Computing shift windows &amp; rollups</p>
                </div>
              ) : (
                <>
                  <p className="text-base font-semibold text-slate-200">
                    <span className="text-indigo-400 hover:underline">Click to browse</span> or drag and drop
                  </p>
                  <p className="text-xs text-slate-400">
                    Upload your monthly attendance Excel file (<code className="font-mono text-slate-300">.xlsx</code>) to compute punctuality, overtime, and deductions.
                  </p>
                </>
              )}
            </div>

            {!isLoading && (
              <div className="flex items-center gap-2 pt-2 text-[11px] text-slate-500">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>All parsing &amp; computations run 100% locally in your browser</span>
              </div>
            )}
          </div>
        </div>

        {/* Error Alert if parsing fails */}
        {errorMessage && (
          <div className="bg-red-950/40 border border-red-800/80 rounded-xl p-4 flex items-start gap-3 text-xs text-red-200 animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-red-300">Failed to Parse Workbook</p>
              <p className="text-slate-300 leading-relaxed">{errorMessage}</p>
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={onOpenPolicy}
                  className="text-indigo-400 hover:underline font-medium"
                >
                  Review expected layout &amp; rules &rarr;
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

