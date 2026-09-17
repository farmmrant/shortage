import React from 'react';
import { 
  AlertTriangle, 
  ArrowDownRight, 
  Calendar, 
  CheckCircle2, 
  Coins, 
  Download, 
  FileSpreadsheet,
  Info, 
  Layers, 
  Plus, 
  Printer, 
  RotateCcw, 
  Scale, 
  ShieldAlert, 
  SlidersHorizontal,
  Upload
} from 'lucide-react';
import { MonthlySummary } from '../types';
import { formatKg, formatNumber, formatPercent, formatRupiah } from '../utils/formatters';

interface LeftSidebarDashboardProps {
  summary: MonthlySummary;
  selectedMonth: string;
  selectedMonthLabel: string;
  availableMonths: { value: string; label: string }[];
  onMonthChange: (month: string) => void;
  onOpenAddModal: () => void;
  onOpenUploadExcel: () => void;
  onDownloadTemplate?: () => void;
  onExportCSV: () => void;
  onResetData: () => void;
  totalFilteredRecords: number;
}

export const LeftSidebarDashboard: React.FC<LeftSidebarDashboardProps> = ({
  summary,
  selectedMonth,
  selectedMonthLabel,
  availableMonths,
  onMonthChange,
  onOpenAddModal,
  onOpenUploadExcel,
  onDownloadTemplate,
  onExportCSV,
  onResetData,
  totalFilteredRecords,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const isNormal = summary.avgShortagePercentage <= 0.35;
  const isWarning = summary.avgShortagePercentage > 0.35 && summary.avgShortagePercentage <= 0.8;

  // Percentage calculations for progress bar
  const totalBatches = summary.totalBatches || 1;
  const normalPct = Math.round((summary.normalBatchesCount / totalBatches) * 100);
  const warningPct = Math.round((summary.warningBatchesCount / totalBatches) * 100);
  const criticalPct = Math.round((summary.criticalBatchesCount / totalBatches) * 100);

  return (
    <aside className="w-full lg:w-[320px] xl:w-[360px] shrink-0 space-y-4 lg:sticky lg:top-20 self-start">
      
      {/* 1. PANEL AKSI UTAMA (Action Center) */}
      <div 
        id="panel-aksi-kiri"
        className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-sm"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
            <SlidersHorizontal className="w-4 h-4 text-amber-600" />
            <span>Panel Aksi & Operasional</span>
          </div>
          <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
            {totalFilteredRecords} Data
          </span>
        </div>

        {/* Tombol Utama 1: Catat Shortage Baru */}
        <button
          id="btn-sidebar-add-record"
          onClick={onOpenAddModal}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-bold text-xs rounded-lg shadow-sm hover:shadow-amber-500/20 transition-all cursor-pointer mb-2"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>+ Catat Shortage Baru</span>
        </button>

        {/* Tombol Utama 2: Upload Excel / Spreadsheet */}
        <button
          id="btn-sidebar-upload-excel"
          onClick={onOpenUploadExcel}
          className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow-sm hover:shadow-emerald-600/20 transition-all cursor-pointer mb-2.5"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Upload File Excel (.xlsx)</span>
        </button>

        {/* Tombol Sekunder: Export, Print */}
        <div className="grid grid-cols-2 gap-2">
          <button
            id="btn-sidebar-export-csv"
            onClick={onExportCSV}
            title="Export data saat ini ke CSV Excel"
            className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export CSV</span>
          </button>

          <button
            id="btn-sidebar-print"
            onClick={handlePrint}
            title="Cetak Laporan"
            className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Cetak PDF</span>
          </button>
        </div>

        {/* Template & Reset Data */}
        <div className="pt-2.5 mt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
          {onDownloadTemplate ? (
            <button
              id="btn-sidebar-download-template"
              onClick={onDownloadTemplate}
              className="inline-flex items-center gap-1 text-slate-500 hover:text-amber-700 transition-colors cursor-pointer"
            >
              <Download className="w-3 h-3 text-amber-600" />
              <span>Unduh Format Excel</span>
            </button>
          ) : (
            <span className="text-slate-400">Feedmill Storage</span>
          )}

          <button
            id="btn-sidebar-reset"
            onClick={onResetData}
            className="inline-flex items-center gap-1 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Sample</span>
          </button>
        </div>
      </div>

      {/* 2. FILTER PERIODE BULAN */}
      <div 
        id="panel-filter-periode"
        className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-sm"
      >
        <label htmlFor="sidebar-month-select" className="flex items-center gap-2 text-xs font-semibold text-slate-700 mb-2">
          <Calendar className="w-4 h-4 text-amber-600" />
          <span>Periode Laporan Bulanan</span>
        </label>
        <select
          id="sidebar-month-select"
          value={selectedMonth}
          onChange={(e) => onMonthChange(e.target.value)}
          className="w-full py-2 px-3 text-xs bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold text-slate-900 cursor-pointer transition-colors"
        >
          <option value="all">Semua Periode Historis</option>
          {availableMonths.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
          <span>Periode aktif:</span>
          <span className="font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60">
            {selectedMonthLabel}
          </span>
        </div>
      </div>

      {/* 3. DASHBOARD KPI SUMMARY (Sebelah Kiri) */}
      <div 
        id="dashboard-kpi-kiri"
        className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-sm space-y-3.5"
      >
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Dashboard KPI Bulanan
          </span>
          <span className="text-[10px] font-mono text-slate-400">Gudang & Silo</span>
        </div>

        {/* KPI 1: Total Qty Penimbunan */}
        <div className="p-3 rounded-lg bg-slate-50/80 border border-slate-200/70">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-medium mb-1">
            <span>Total Qty Penimbunan</span>
            <Layers className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-lg font-bold text-slate-900 tracking-tight">
            {formatKg(summary.totalPenimbunanKg)}
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
            <span>{formatNumber(summary.totalPenimbunanKg / 1000, 2)} Ton</span>
            <span className="font-medium text-slate-700">{summary.totalBatches} Batch</span>
          </div>
        </div>

        {/* KPI 2: Total Shortage Qty */}
        <div className="p-3 rounded-lg bg-amber-50/50 border border-amber-200/60">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-medium mb-1">
            <span className="text-amber-900 font-semibold">Total Shortage Qty</span>
            <Scale className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-lg font-bold text-amber-950 tracking-tight flex items-baseline justify-between">
            <span>{formatKg(summary.totalShortageKg)}</span>
            <span className="text-[11px] font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded">
              {formatNumber(summary.totalShortageKg / 1000, 2)} Ton
            </span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-amber-800/80 mt-1">
            <ArrowDownRight className="w-3 h-3 text-amber-600" />
            <span>Susut aerasi, timbang & handling</span>
          </div>
        </div>

        {/* KPI 3: Shortage Amount (Rp) */}
        <div className="p-3 rounded-lg bg-rose-50/50 border border-rose-200/60">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-medium mb-1">
            <span className="text-rose-900 font-semibold">Shortage Amount (Rp)</span>
            <Coins className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <div className="text-lg font-bold text-rose-600 tracking-tight">
            {formatRupiah(summary.totalShortageAmountRp)}
          </div>
          <div className="text-[11px] text-rose-700/80 mt-1">
            Valuasi kerugian bahan baku
          </div>
        </div>

        {/* KPI 4: Rata-Rata Shortage (%) */}
        <div className="p-3 rounded-lg bg-slate-50/80 border border-slate-200/70">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-medium mb-1">
            <span>Rata-Rata Shortage (%)</span>
            {isNormal ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            ) : isWarning ? (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            ) : (
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            )}
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-900 tracking-tight">
              {formatPercent(summary.avgShortagePercentage)}
            </span>
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
              isNormal 
                ? 'bg-emerald-100 text-emerald-800' 
                : isWarning 
                  ? 'bg-amber-100 text-amber-800' 
                  : 'bg-rose-100 text-rose-800'
            }`}>
              {isNormal ? 'Aman (≤ 0.35%)' : isWarning ? 'Perhatian' : 'Kritis (> 0.8%)'}
            </span>
          </div>

          {/* Breakdown Status Bar */}
          <div className="mt-3 pt-2.5 border-t border-slate-200">
            <div className="text-[10px] uppercase font-bold text-slate-500 mb-1.5 flex justify-between">
              <span>Distribusi Toleransi</span>
              <span>{summary.totalBatches} Batch</span>
            </div>
            
            {/* Visual Bar */}
            <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden flex">
              <div style={{ width: `${normalPct}%` }} className="bg-emerald-500 h-full" title={`Normal: ${summary.normalBatchesCount}`} />
              <div style={{ width: `${warningPct}%` }} className="bg-amber-500 h-full" title={`Perhatian: ${summary.warningBatchesCount}`} />
              <div style={{ width: `${criticalPct}%` }} className="bg-rose-500 h-full" title={`Kritis: ${summary.criticalBatchesCount}`} />
            </div>

            {/* Legend & Counts */}
            <div className="grid grid-cols-3 gap-1 mt-2 text-[11px] font-medium text-center">
              <div className="bg-emerald-50 text-emerald-800 py-1 rounded border border-emerald-200/50">
                <span className="block text-xs font-bold">{summary.normalBatchesCount}</span>
                <span className="text-[9px] text-emerald-600 uppercase font-semibold">Normal</span>
              </div>
              <div className="bg-amber-50 text-amber-800 py-1 rounded border border-amber-200/50">
                <span className="block text-xs font-bold">{summary.warningBatchesCount}</span>
                <span className="text-[9px] text-amber-600 uppercase font-semibold">Perhatian</span>
              </div>
              <div className="bg-rose-50 text-rose-800 py-1 rounded border border-rose-200/50">
                <span className="block text-xs font-bold">{summary.criticalBatchesCount}</span>
                <span className="text-[9px] text-rose-600 uppercase font-semibold">Kritis</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 4. QC STANDARD & SOP NOTICE */}
      <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-slate-600 text-xs">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-[11px] leading-relaxed">
            <p className="font-semibold text-slate-800 mb-0.5">Standar Toleransi Feedmill:</p>
            <p className="text-slate-600">
              Maksimal susut standar <strong>≤ 0.35%</strong>. Batch di atas <strong>0.80%</strong> memerlukan investigasi fisik silo & kalibrasi jembatan timbang.
            </p>
          </div>
        </div>
      </div>

    </aside>
  );
};
