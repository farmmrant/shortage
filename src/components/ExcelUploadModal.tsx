import React, { useState, useRef } from 'react';
import { 
  FileSpreadsheet, 
  UploadCloud, 
  Download, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  Scale, 
  Coins, 
  ArrowRight,
  RefreshCw,
  FileCheck
} from 'lucide-react';
import { ShortageRecord } from '../types';
import { parseExcelFile, downloadExcelTemplate } from '../utils/excelHelper';
import { formatKg, formatNumber, formatPercent, formatRupiah, formatDateIndo } from '../utils/formatters';

interface ExcelUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (records: ShortageRecord[], mode: 'append' | 'replace') => void;
}

export const ExcelUploadModal: React.FC<ExcelUploadModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [parsedRecords, setParsedRecords] = useState<ShortageRecord[]>([]);
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (file: File) => {
    // Validate extension
    const name = file.name.toLowerCase();
    if (!name.endsWith('.xlsx') && !name.endsWith('.xls') && !name.endsWith('.csv')) {
      setErrorMessage('Format file tidak didukung. Harap upload file Excel (.xlsx, .xls) atau .csv.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSelectedFile(file);

    try {
      const result = await parseExcelFile(file);
      if (result.records.length === 0) {
        setErrorMessage('Tidak ada data valid yang dapat dibaca dari file Excel tersebut.');
        setParsedRecords([]);
      } else {
        setParsedRecords(result.records);
      }
    } catch (err: any) {
      console.error('Error parsing excel:', err);
      setErrorMessage(err?.message || 'Gagal memproses file Excel. Pastikan format kolom sesuai.');
      setParsedRecords([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetFile = () => {
    setSelectedFile(null);
    setParsedRecords([]);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleConfirmImport = () => {
    if (parsedRecords.length === 0) return;
    onImportComplete(parsedRecords, importMode);
    handleResetFile();
    onClose();
  };

  // Preview totals
  const totalPenimbunan = parsedRecords.reduce((s, r) => s + r.qtyPenimbunan, 0);
  const totalShortage = parsedRecords.reduce((s, r) => s + r.shortageQty, 0);
  const totalAmount = parsedRecords.reduce((s, r) => s + r.shortageAmount, 0);
  const avgShortagePct = totalPenimbunan > 0 ? (totalShortage / totalPenimbunan) * 100 : 0;
  const criticalCount = parsedRecords.filter(r => r.status === 'critical').length;
  const warningCount = parsedRecords.filter(r => r.status === 'warning').length;
  const normalCount = parsedRecords.filter(r => r.status === 'normal').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div 
        id="modal-upload-excel"
        className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto max-h-[92vh]"
      >
        {/* Header Modal */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Upload & Import Data Excel
              </h2>
              <p className="text-xs text-slate-500">
                Impor catatan penimbunan & shortage bahan baku dari spreadsheet Excel (.xlsx, .xls) atau CSV
              </p>
            </div>
          </div>
          <button
            id="btn-close-excel-modal"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* Download Template Banner */}
          <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900">
            <div className="space-y-0.5">
              <span className="font-bold flex items-center gap-1.5 text-amber-950">
                <Download className="w-3.5 h-3.5 text-amber-600" />
                Belum punya format Excel yang sesuai?
              </span>
              <p className="text-amber-800/80 text-[11px]">
                Unduh template resmi dengan kolom Tanggal, Batch, Kode Material, Qty Penimbunan, Shortage, dsb.
              </p>
            </div>
            <button
              id="btn-download-template-excel"
              type="button"
              onClick={downloadExcelTemplate}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white hover:bg-amber-100/60 text-amber-900 font-semibold border border-amber-300 rounded-lg shadow-2xs transition-colors shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-amber-700" />
              <span>Unduh Template (.xlsx)</span>
            </button>
          </div>

          {/* Upload Dropzone (if no file parsed yet) */}
          {parsedRecords.length === 0 ? (
            <div className="space-y-3">
              <div
                id="dropzone-excel"
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center transition-all cursor-pointer ${
                  dragActive 
                    ? 'border-amber-500 bg-amber-50/60 scale-[0.99]' 
                    : 'border-slate-300 hover:border-amber-400 bg-slate-50/50 hover:bg-amber-50/20'
                }`}
              >
                <input
                  ref={fileInputRef}
                  id="input-file-excel"
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="flex flex-col items-center justify-center space-y-3">
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 text-amber-600 ring-8 ring-amber-500/5">
                    {isLoading ? (
                      <RefreshCw className="w-8 h-8 animate-spin text-amber-600" />
                    ) : (
                      <UploadCloud className="w-8 h-8 text-amber-600" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-800">
                      {isLoading ? 'Sedang membaca dan memvalidasi file Excel...' : 'Klik untuk pilih file atau tarik file ke sini'}
                    </p>
                    <p className="text-xs text-slate-500">
                      Mendukung format Microsoft Excel (.xlsx, .xls) dan CSV (maksimal 20MB)
                    </p>
                  </div>
                  <button
                    type="button"
                    className="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 shadow-2xs cursor-pointer"
                  >
                    Pilih File dari Perangkat
                  </button>
                </div>
              </div>

              {/* Error Box */}
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-bold">Gagal Mengimpor File</span>
                    <p className="text-rose-700">{errorMessage}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* PREVIEW OF PARSED EXCEL DATA */
            <div className="space-y-4">
              
              {/* File Info Bar */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800 truncate">
                        {selectedFile?.name || 'File Excel'}
                      </span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                        {parsedRecords.length} Data Terbaca
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      {selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : ''} • Kolom feedmill berhasil dipetakan otomatis
                    </span>
                  </div>
                </div>

                <button
                  id="btn-reupload-excel"
                  type="button"
                  onClick={handleResetFile}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-100 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Ganti File</span>
                </button>
              </div>

              {/* Summary KPIs of the parsed Excel */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-2.5 rounded-xl bg-blue-50/60 border border-blue-200/70">
                  <div className="flex items-center justify-between text-blue-800 text-[11px] font-medium mb-0.5">
                    <span>Total Penimbunan</span>
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <div className="text-sm font-bold text-blue-950">
                    {formatKg(totalPenimbunan)}
                  </div>
                  <span className="text-[10px] text-blue-700">{formatNumber(totalPenimbunan / 1000, 1)} Ton</span>
                </div>

                <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/70">
                  <div className="flex items-center justify-between text-amber-800 text-[11px] font-medium mb-0.5">
                    <span>Total Susut</span>
                    <Scale className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                  <div className="text-sm font-bold text-amber-950">
                    {formatKg(totalShortage)}
                  </div>
                  <span className="text-[10px] text-amber-700">Rata-rata: {formatPercent(avgShortagePct)}</span>
                </div>

                <div className="p-2.5 rounded-xl bg-rose-50/60 border border-rose-200/70">
                  <div className="flex items-center justify-between text-rose-800 text-[11px] font-medium mb-0.5">
                    <span>Shortage Amount</span>
                    <Coins className="w-3.5 h-3.5 text-rose-600" />
                  </div>
                  <div className="text-sm font-bold text-rose-700 truncate">
                    {formatRupiah(totalAmount)}
                  </div>
                  <span className="text-[10px] text-rose-600">Estimasi Kerugian</span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200/80">
                  <div className="text-[11px] font-medium text-slate-700 mb-1">
                    Status Toleransi
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold">
                    <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                      {normalCount} Normal
                    </span>
                    <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                      {warningCount} Warning
                    </span>
                    {criticalCount > 0 && (
                      <span className="bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded">
                        {criticalCount} Kritis
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Import Mode Selector */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-800 block">
                  Metode Penyimpanan Data:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label 
                    className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                      importMode === 'append' 
                        ? 'border-amber-500 bg-amber-50/50 text-amber-950 font-medium' 
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100/60'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      value="append"
                      checked={importMode === 'append'}
                      onChange={() => setImportMode('append')}
                      className="mt-0.5 text-amber-600 focus:ring-amber-500"
                    />
                    <div>
                      <span className="font-bold block">Tambahkan ke Data yang Ada</span>
                      <span className="text-[11px] text-slate-500 leading-tight">
                        Menggabungkan {parsedRecords.length} data baru tanpa menghapus data sebelumnya.
                      </span>
                    </div>
                  </label>

                  <label 
                    className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                      importMode === 'replace' 
                        ? 'border-rose-500 bg-rose-50/50 text-rose-950 font-medium' 
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100/60'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      value="replace"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="mt-0.5 text-rose-600 focus:ring-rose-500"
                    />
                    <div>
                      <span className="font-bold block text-rose-900">Gantikan Seluruh Data</span>
                      <span className="text-[11px] text-slate-500 leading-tight">
                        Menghapus data sebelumnya dan hanya menggunakan data dari file Excel ini.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Table Preview */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="bg-slate-100/80 px-3 py-2 border-b border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span>Pratinjau Data ({parsedRecords.length} Baris)</span>
                  <span className="text-[11px] text-slate-500 font-normal">Menampilkan 10 baris pertama</span>
                </div>
                <div className="overflow-x-auto max-h-56">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-600 text-[11px] uppercase border-b border-slate-200 sticky top-0">
                      <tr>
                        <th className="py-2 px-2.5 text-center">No</th>
                        <th className="py-2 px-2.5">Tanggal</th>
                        <th className="py-2 px-2.5">Batch</th>
                        <th className="py-2 px-2.5">Bahan Baku</th>
                        <th className="py-2 px-2.5 text-right">Penimbunan (Kg)</th>
                        <th className="py-2 px-2.5 text-right">Susut (Kg)</th>
                        <th className="py-2 px-2.5 text-right">Susut (%)</th>
                        <th className="py-2 px-2.5 text-right">Nilai (Rp)</th>
                        <th className="py-2 px-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedRecords.slice(0, 10).map((r, i) => (
                        <tr key={r.id} className="hover:bg-slate-50/80">
                          <td className="py-2 px-2.5 text-center text-slate-400 font-mono">{i + 1}</td>
                          <td className="py-2 px-2.5 whitespace-nowrap font-medium text-slate-700">{formatDateIndo(r.tanggal)}</td>
                          <td className="py-2 px-2.5 whitespace-nowrap font-mono text-slate-800">{r.batch}</td>
                          <td className="py-2 px-2.5 max-w-[180px] truncate text-slate-900 font-medium" title={r.materialDescription}>{r.materialDescription}</td>
                          <td className="py-2 px-2.5 text-right whitespace-nowrap">{formatKg(r.qtyPenimbunan)}</td>
                          <td className="py-2 px-2.5 text-right whitespace-nowrap font-semibold text-amber-900">{formatKg(r.shortageQty)}</td>
                          <td className="py-2 px-2.5 text-right whitespace-nowrap">{formatPercent(r.shortagePercentage)}</td>
                          <td className="py-2 px-2.5 text-right whitespace-nowrap text-rose-600 font-medium">{formatRupiah(r.shortageAmount)}</td>
                          <td className="py-2 px-2.5 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              r.status === 'normal' 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : r.status === 'warning' 
                                  ? 'bg-amber-100 text-amber-800' 
                                  : 'bg-rose-100 text-rose-800'
                            }`}>
                              {r.status.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            id="btn-cancel-excel-modal"
            type="button"
            onClick={() => {
              handleResetFile();
              onClose();
            }}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200/70 rounded-lg transition-colors cursor-pointer"
          >
            Batal
          </button>

          <div className="flex items-center gap-2">
            {parsedRecords.length > 0 && (
              <button
                id="btn-confirm-import-excel"
                type="button"
                onClick={handleConfirmImport}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-bold text-xs rounded-lg shadow-sm hover:shadow-amber-500/20 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Impor {parsedRecords.length} Data Sekarang</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
