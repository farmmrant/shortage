import React from 'react';
import { 
  Building2, 
  Calendar, 
  Download, 
  Plus, 
  Printer, 
  RotateCcw,
  Wheat
} from 'lucide-react';

interface NavbarProps {
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  availableMonths: { value: string; label: string }[];
  onOpenAddModal: () => void;
  onExportCSV: () => void;
  onResetData: () => void;
  totalRecordsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  selectedMonth,
  onMonthChange,
  availableMonths,
  onOpenAddModal,
  onExportCSV,
  onResetData,
  totalRecordsCount,
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3.5 gap-4">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Wheat className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                  Feedmill RM Shortage Tracker
                </h1>
                <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Gudang Bahan Baku
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Monitoring Bulanan Susut Bobot Silo & Gudang Curah Feedmill ({totalRecordsCount} Data Tercatat)
              </p>
            </div>
          </div>

          {/* Right Actions & Monthly Selector */}
          <div className="flex flex-wrap items-center gap-2.5">
            
            {/* Monthly Selector */}
            <div className="flex items-center bg-slate-800/90 border border-slate-700 rounded-lg px-3 py-1.5 shadow-inner">
              <Calendar className="w-4 h-4 text-amber-400 mr-2 shrink-0" />
              <span className="text-xs font-medium text-slate-300 mr-2 whitespace-nowrap">Periode:</span>
              <select
                id="period-monthly-selector"
                value={selectedMonth}
                onChange={(e) => onMonthChange(e.target.value)}
                className="bg-transparent text-sm font-semibold text-white focus:outline-none cursor-pointer pr-2"
              >
                <option value="all" className="bg-slate-900 text-white">Semua Periode</option>
                {availableMonths.map((m) => (
                  <option key={m.value} value={m.value} className="bg-slate-900 text-white">
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Print Button */}
            <button
              id="btn-print-report"
              onClick={handlePrint}
              title="Cetak Laporan Bulanan"
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-300" />
              <span>Cetak</span>
            </button>

            {/* Export CSV */}
            <button
              id="btn-export-csv"
              onClick={onExportCSV}
              title="Export data ke CSV"
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </button>

            {/* Reset Button */}
            <button
              id="btn-reset-data"
              onClick={onResetData}
              title="Reset ke Data Bawaan"
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Add Record Button */}
            <button
              id="btn-add-record"
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg shadow-sm transition-all cursor-pointer hover:shadow-amber-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Catat Shortage Baru</span>
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};
