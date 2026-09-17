import React, { useState, useEffect, useMemo } from 'react';
import { ShortageRecord, MonthlySummary } from './types';
import { INITIAL_SHORTAGE_DATA } from './data/mockData';
import { Navbar } from './components/Navbar';
import { LeftSidebarDashboard } from './components/LeftSidebarDashboard';
import { ShortageCharts } from './components/ShortageCharts';
import { ShortageTable } from './components/ShortageTable';
import { RecordModal } from './components/RecordModal';
import { DetailModal } from './components/DetailModal';
import { ExcelUploadModal } from './components/ExcelUploadModal';
import { exportToCSV, formatDateIndo, formatKg, formatPercent, formatRupiah } from './utils/formatters';
import { downloadExcelTemplate } from './utils/excelHelper';
import { Info, Check, Sparkles } from 'lucide-react';

const STORAGE_KEY = 'feedmill_shortage_data_v1';

export default function App() {
  // 1. Data State with LocalStorage Persistence
  const [records, setRecords] = useState<ShortageRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse local storage records, using default', e);
    }
    return INITIAL_SHORTAGE_DATA;
  });

  // Save to localStorage when records change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }, [records]);

  // 2. Month Filter State
  const [selectedMonth, setSelectedMonth] = useState<string>('2024-09');

  // 3. Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ShortageRecord | null>(null);
  const [viewingRecord, setViewingRecord] = useState<ShortageRecord | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // 4. Calculate Available Months from Data
  const availableMonths = useMemo(() => {
    const monthMap = new Map<string, string>();
    records.forEach((r) => {
      const m = r.bulan; // "YYYY-MM"
      if (!monthMap.has(m)) {
        const [year, month] = m.split('-');
        const dateObj = new Date(parseInt(year), parseInt(month) - 1, 1);
        const label = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(dateObj);
        monthMap.set(m, label);
      }
    });

    return Array.from(monthMap.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => b.value.localeCompare(a.value));
  }, [records]);

  // Human readable label for currently selected month
  const selectedMonthLabel = useMemo(() => {
    if (selectedMonth === 'all') return 'Semua Periode';
    const found = availableMonths.find((m) => m.value === selectedMonth);
    if (found) return found.label;
    const [year, month] = selectedMonth.split('-');
    if (year && month) {
      const dateObj = new Date(parseInt(year), parseInt(month) - 1, 1);
      return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(dateObj);
    }
    return selectedMonth;
  }, [selectedMonth, availableMonths]);

  // 5. Filter records by Month
  const monthlyRecords = useMemo(() => {
    if (selectedMonth === 'all') {
      return records;
    }
    return records.filter((r) => r.bulan === selectedMonth);
  }, [records, selectedMonth]);

  // 6. Summary metrics calculation
  const monthlySummary = useMemo<MonthlySummary>(() => {
    const totalPenimbunanKg = monthlyRecords.reduce((sum, r) => sum + r.qtyPenimbunan, 0);
    const totalShortageKg = monthlyRecords.reduce((sum, r) => sum + r.shortageQty, 0);
    const totalShortageAmountRp = monthlyRecords.reduce((sum, r) => sum + r.shortageAmount, 0);
    const avgShortagePercentage = totalPenimbunanKg > 0 ? (totalShortageKg / totalPenimbunanKg) * 100 : 0;
    
    let criticalBatchesCount = 0;
    let warningBatchesCount = 0;
    let normalBatchesCount = 0;

    monthlyRecords.forEach((r) => {
      if (r.status === 'critical') criticalBatchesCount++;
      else if (r.status === 'warning') warningBatchesCount++;
      else normalBatchesCount++;
    });

    return {
      totalPenimbunanKg,
      totalShortageKg,
      totalShortageAmountRp,
      avgShortagePercentage,
      totalBatches: monthlyRecords.length,
      criticalBatchesCount,
      warningBatchesCount,
      normalBatchesCount,
    };
  }, [monthlyRecords]);

  // 7. Handlers for CRUD
  const handleSaveRecord = (record: ShortageRecord) => {
    if (editingRecord) {
      // Update
      setRecords((prev) => prev.map((r) => (r.id === record.id ? record : r)));
      showToast(`Data batch ${record.batch} berhasil diperbarui.`);
    } else {
      // Create new
      setRecords((prev) => [record, ...prev]);
      // If user created a record for a different month, switch to that month
      if (record.bulan !== selectedMonth && selectedMonth !== 'all') {
        setSelectedMonth(record.bulan);
      }
      showToast(`Data batch ${record.batch} berhasil ditambahkan.`);
    }
    setEditingRecord(null);
  };

  const handleDeleteRecord = (id: string) => {
    const target = records.find((r) => r.id === id);
    if (!target) return;

    if (window.confirm(`Yakin ingin menghapus catatan shortage untuk batch "${target.batch}" (${target.materialDescription})?`)) {
      setRecords((prev) => prev.filter((r) => r.id !== id));
      showToast(`Data batch ${target.batch} telah dihapus.`);
    }
  };

  const handleOpenAddModal = () => {
    setEditingRecord(null);
    setIsModalOpen(true);
  };

  const handleEditRecord = (record: ShortageRecord) => {
    setEditingRecord(record);
    setIsModalOpen(true);
  };

  const handleViewDetail = (record: ShortageRecord) => {
    setViewingRecord(record);
  };

  const handleResetData = () => {
    if (window.confirm('Kembalikan ke data bawaan simulasi pabrik pakan? Data kustom akan direset.')) {
      setRecords(INITIAL_SHORTAGE_DATA);
      setSelectedMonth('2024-09');
      localStorage.removeItem(STORAGE_KEY);
      showToast('Data dikembalikan ke data default pabrik feedmill.');
    }
  };

  // 8. Export CSV Handler
  const handleExportCSV = () => {
    const exportRows = monthlyRecords.map((r, index) => ({
      'No': index + 1,
      'Tanggal': r.tanggal,
      'Material Description': r.materialDescription,
      'Material Code': r.materialCode,
      'Sloc': r.sloc,
      'Batch': r.batch,
      'Qty Penimbunan (Kg)': r.qtyPenimbunan,
      'Shortage Qty (Kg)': r.shortageQty,
      'Shortage (%)': Number(r.shortagePercentage.toFixed(2)),
      'Shortage Amount (Rp)': r.shortageAmount,
      'Keterangan': r.keterangan,
      'Status Toleransi': r.status.toUpperCase(),
      'Petugas': r.reportedBy || '-',
      'Shift': r.shift || '-',
    }));

    const filename = `Shortage_Bahan_Baku_Feedmill_${selectedMonth === 'all' ? 'Semua' : selectedMonth}`;
    exportToCSV(filename, exportRows);
    showToast(`Laporan CSV berhasil diunduh (${monthlyRecords.length} baris).`);
  };

  // 9. Excel Import Handler
  const handleImportExcel = (importedRecords: ShortageRecord[], mode: 'append' | 'replace') => {
    if (mode === 'replace') {
      setRecords(importedRecords);
      if (importedRecords.length > 0) {
        setSelectedMonth(importedRecords[0].bulan);
      }
      showToast(`Berhasil mengimpor ${importedRecords.length} data baru dari Excel (Mode Gantikan).`);
    } else {
      setRecords((prev) => [...importedRecords, ...prev]);
      if (importedRecords.length > 0 && selectedMonth !== 'all') {
        setSelectedMonth(importedRecords[0].bulan);
      }
      showToast(`Berhasil menambahkan ${importedRecords.length} data dari Excel.`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl border border-slate-700 flex items-center gap-2.5 text-xs font-medium animate-in slide-in-from-bottom-3 duration-200">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Navbar */}
      <Navbar
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        availableMonths={availableMonths}
        onOpenAddModal={handleOpenAddModal}
        onOpenUploadExcel={() => setIsExcelModalOpen(true)}
        onExportCSV={handleExportCSV}
        onResetData={handleResetData}
        totalRecordsCount={records.length}
      />

      {/* Main Body - Left Dashboard & Right Workspace */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          
          {/* SEBELAH KIRI: Dashboard KPI & Panel Aksi */}
          <LeftSidebarDashboard
            summary={monthlySummary}
            selectedMonth={selectedMonth}
            selectedMonthLabel={selectedMonthLabel}
            availableMonths={availableMonths}
            onMonthChange={setSelectedMonth}
            onOpenAddModal={handleOpenAddModal}
            onOpenUploadExcel={() => setIsExcelModalOpen(true)}
            onDownloadTemplate={downloadExcelTemplate}
            onExportCSV={handleExportCSV}
            onResetData={handleResetData}
            totalFilteredRecords={monthlyRecords.length}
          />

          {/* SEBELAH KANAN: Workspace Analisis Grafik & Tabel Shortage (dengan Aksi di Sebelah Kiri) */}
          <section className="flex-1 min-w-0 w-full space-y-6">
            
            {/* Feedmill Operational Info Notice */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-start sm:items-center gap-2.5 text-amber-900">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
                <span>
                  <strong>Batas Toleransi Susut Bahan Baku Feedmill:</strong> Standar industri pakan adalah <strong>≤ 0.35%</strong> (Normal). Susut 0.36% - 0.8% masuk kategori <strong>Perhatian</strong>, dan &gt; 0.8% mewajibkan <strong>Investigasi Tim QC & Maintenance Silo</strong>.
                </span>
              </div>
              <div className="shrink-0 flex items-center gap-1.5 text-amber-800 font-semibold bg-amber-500/20 px-2.5 py-1 rounded-md">
                <span>Periode: {selectedMonthLabel}</span>
              </div>
            </div>

            {/* 1. Interactive Visual Charts (Grafik) */}
            <ShortageCharts
              records={monthlyRecords}
              selectedMonthLabel={selectedMonthLabel}
            />

            {/* 2. Monthly Detailed Shortage Table (Kolom Aksi di Sebelah Kiri) */}
            <ShortageTable
              records={monthlyRecords}
              onEdit={handleEditRecord}
              onDelete={handleDeleteRecord}
              onViewDetail={handleViewDetail}
              selectedMonthLabel={selectedMonthLabel}
              onOpenUploadExcel={() => setIsExcelModalOpen(true)}
            />

          </section>

        </div>
      </main>

      {/* Modals */}
      <RecordModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingRecord(null);
        }}
        onSave={handleSaveRecord}
        initialRecord={editingRecord}
        defaultMonth={selectedMonth}
      />

      <DetailModal
        record={viewingRecord}
        onClose={() => setViewingRecord(null)}
        onEdit={handleEditRecord}
      />

      <ExcelUploadModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        onImportComplete={handleImportExcel}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} Feedmill Warehouse Inventory & Quality Assurance System</p>
          <p className="text-slate-400">
            Sistem Pemantauan Susut Bobot Silo, Bahan Curah, & Gudang Karungan
          </p>
        </div>
      </footer>

    </div>
  );
}
