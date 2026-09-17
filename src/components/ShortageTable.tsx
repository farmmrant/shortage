import React, { useState, useMemo } from 'react';
import { 
  ArrowUpDown, 
  ChevronDown, 
  ChevronUp, 
  Edit3, 
  Eye, 
  FileSpreadsheet,
  Filter, 
  HelpCircle, 
  Search, 
  Trash2, 
  AlertCircle,
  Warehouse
} from 'lucide-react';
import { ShortageRecord } from '../types';
import { 
  formatDateIndo, 
  formatKg, 
  formatNumber, 
  formatPercent, 
  formatRupiah 
} from '../utils/formatters';

interface ShortageTableProps {
  records: ShortageRecord[];
  onEdit: (record: ShortageRecord) => void;
  onDelete: (id: string) => void;
  onViewDetail: (record: ShortageRecord) => void;
  selectedMonthLabel: string;
  onOpenUploadExcel?: () => void;
}

type SortField = 'tanggal' | 'materialDescription' | 'sloc' | 'batch' | 'qtyPenimbunan' | 'shortageQty' | 'shortagePercentage' | 'shortageAmount';
type SortOrder = 'asc' | 'desc';

export const ShortageTable: React.FC<ShortageTableProps> = ({
  records,
  onEdit,
  onDelete,
  onViewDetail,
  selectedMonthLabel,
  onOpenUploadExcel,
}) => {
  const [search, setSearch] = useState('');
  const [slocFilter, setSlocFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState<SortField>('tanggal');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Distinct Slocs for filter dropdown
  const uniqueSlocs = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => set.add(r.sloc));
    return Array.from(set).sort();
  }, [records]);

  // Handle Sort Toggle
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Filtered and Sorted Records
  const filteredRecords = useMemo(() => {
    return records
      .filter((item) => {
        // Search query
        const q = search.toLowerCase();
        const matchSearch =
          !q ||
          item.materialDescription.toLowerCase().includes(q) ||
          item.materialCode.toLowerCase().includes(q) ||
          item.batch.toLowerCase().includes(q) ||
          item.sloc.toLowerCase().includes(q) ||
          item.keterangan.toLowerCase().includes(q);

        // Sloc filter
        const matchSloc = slocFilter === 'all' || item.sloc === slocFilter;

        // Status filter
        const matchStatus = statusFilter === 'all' || item.status === statusFilter;

        return matchSearch && matchSloc && matchStatus;
      })
      .sort((a, b) => {
        let valA: any = a[sortField];
        let valB: any = b[sortField];

        if (typeof valA === 'string') {
          valA = valA.toLowerCase();
          valB = valB.toLowerCase();
        }

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [records, search, slocFilter, statusFilter, sortField, sortOrder]);

  // Aggregate stats for filtered rows
  const tableSummary = useMemo(() => {
    const totalPenimbunan = filteredRecords.reduce((acc, r) => acc + r.qtyPenimbunan, 0);
    const totalShortage = filteredRecords.reduce((acc, r) => acc + r.shortageQty, 0);
    const totalAmount = filteredRecords.reduce((acc, r) => acc + r.shortageAmount, 0);
    const avgPct = totalPenimbunan > 0 ? (totalShortage / totalPenimbunan) * 100 : 0;
    return { totalPenimbunan, totalShortage, totalAmount, avgPct };
  }, [filteredRecords]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      
      {/* Table Header Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/50">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Warehouse className="w-4 h-4 text-amber-500" />
              Tabel Data Bulanan Shortage Bahan Baku Feedmill
            </h2>
            <p className="text-xs text-slate-500">
              Menampilkan {filteredRecords.length} dari {records.length} batch bahan baku ({selectedMonthLabel})
            </p>
          </div>

          {/* Quick Stats Pill & Excel Button */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-2.5 py-1 bg-slate-200/80 rounded-md font-medium text-slate-700">
              Total Susut: <strong className="text-slate-900">{formatKg(tableSummary.totalShortage)}</strong>
            </span>
            <span className="px-2.5 py-1 bg-rose-100 rounded-md font-medium text-rose-800">
              Kerugian: <strong>{formatRupiah(tableSummary.totalAmount)}</strong>
            </span>
            {onOpenUploadExcel && (
              <button
                id="btn-table-upload-excel"
                type="button"
                onClick={onOpenUploadExcel}
                title="Impor data dari spreadsheet Excel"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-md font-semibold transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Upload Excel</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
          
          {/* Search Input */}
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="search-input-shortage"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari Material, Batch, Sloc, Keterangan..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all text-slate-900 placeholder:text-slate-400"
            />
          </div>

          {/* Sloc Filter */}
          <div className="sm:col-span-4 relative">
            <select
              id="filter-sloc"
              value={slocFilter}
              onChange={(e) => setSlocFilter(e.target.value)}
              className="w-full py-1.5 px-3 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800"
            >
              <option value="all">Semua Sloc (Silo & Gudang)</option>
              {uniqueSlocs.map((sloc) => (
                <option key={sloc} value={sloc}>
                  Lokasi: {sloc}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="sm:col-span-3">
            <select
              id="filter-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full py-1.5 px-3 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800"
            >
              <option value="all">Semua Status Susut</option>
              <option value="normal">Normal (≤ 0.35%)</option>
              <option value="warning">Perhatian (0.36% - 0.8%)</option>
              <option value="critical">Kritis (&gt; 0.8%)</option>
            </select>
          </div>

        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100/90 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <th className="py-3 px-3 text-center w-12">No</th>
              
              {/* Kolom Aksi di Sebelah Kiri */}
              <th className="py-3 px-3 text-center w-24 bg-amber-50/60 text-amber-900 border-r border-slate-200">
                <span>Aksi</span>
              </th>

              {/* Tanggal */}
              <th 
                onClick={() => handleSort('tanggal')}
                className="py-3 px-3.5 cursor-pointer hover:bg-slate-200/70 transition-colors whitespace-nowrap"
              >
                <div className="flex items-center gap-1">
                  <span>Tanggal</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              {/* Material Description */}
              <th 
                onClick={() => handleSort('materialDescription')}
                className="py-3 px-3.5 cursor-pointer hover:bg-slate-200/70 transition-colors min-w-[190px]"
              >
                <div className="flex items-center gap-1">
                  <span>Material Description</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              {/* Sloc */}
              <th 
                onClick={() => handleSort('sloc')}
                className="py-3 px-3.5 cursor-pointer hover:bg-slate-200/70 transition-colors whitespace-nowrap"
              >
                <div className="flex items-center gap-1">
                  <span>Sloc</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              {/* Batch */}
              <th 
                onClick={() => handleSort('batch')}
                className="py-3 px-3.5 cursor-pointer hover:bg-slate-200/70 transition-colors whitespace-nowrap"
              >
                <div className="flex items-center gap-1">
                  <span>Batch</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              {/* Qty Penimbunan (Kg) */}
              <th 
                onClick={() => handleSort('qtyPenimbunan')}
                className="py-3 px-3.5 text-right cursor-pointer hover:bg-slate-200/70 transition-colors whitespace-nowrap"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Qty Penimbunan (Kg)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              {/* Shortage Qty (Kg) */}
              <th 
                onClick={() => handleSort('shortageQty')}
                className="py-3 px-3.5 text-right cursor-pointer hover:bg-slate-200/70 transition-colors whitespace-nowrap"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Shortage Qty (Kg)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              {/* Shortage (%) */}
              <th 
                onClick={() => handleSort('shortagePercentage')}
                className="py-3 px-3.5 text-center cursor-pointer hover:bg-slate-200/70 transition-colors whitespace-nowrap"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Shortage (%)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              {/* Shortage Amount (Rp) */}
              <th 
                onClick={() => handleSort('shortageAmount')}
                className="py-3 px-3.5 text-right cursor-pointer hover:bg-slate-200/70 transition-colors whitespace-nowrap"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Shortage Amount (Rp)</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              {/* Keterangan */}
              <th className="py-3 px-3.5 min-w-[200px]">
                <span>Keterangan</span>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-10 text-center text-slate-400">
                  <AlertCircle className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="font-medium text-slate-600">Tidak ada data shortage yang sesuai filter.</p>
                  <p className="text-xs text-slate-400 mt-1">Coba ubah kata kunci pencarian atau reset filter.</p>
                </td>
              </tr>
            ) : (
              filteredRecords.map((item, idx) => {
                const isCritical = item.status === 'critical';
                const isWarning = item.status === 'warning';

                return (
                  <tr 
                    key={item.id}
                    className="hover:bg-amber-50/40 transition-colors group"
                  >
                    {/* No */}
                    <td className="py-2.5 px-3 text-center text-slate-400 font-mono">
                      {idx + 1}
                    </td>

                    {/* Aksi di Sebelah Kiri */}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap bg-amber-50/20 group-hover:bg-amber-100/30 transition-colors border-r border-slate-200/80">
                      <div className="flex items-center justify-center gap-1">
                        {/* Detail */}
                        <button
                          onClick={() => onViewDetail(item)}
                          title="Lihat Detail Tiket"
                          className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => onEdit(item)}
                          title="Edit Data"
                          className="p-1 rounded text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => onDelete(item.id)}
                          title="Hapus Data"
                          className="p-1 rounded text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    {/* Tanggal */}
                    <td className="py-2.5 px-3.5 whitespace-nowrap font-medium text-slate-700">
                      {formatDateIndo(item.tanggal)}
                    </td>

                    {/* Material Description */}
                    <td className="py-2.5 px-3.5">
                      <div className="font-semibold text-slate-900">{item.materialDescription}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{item.materialCode}</div>
                    </td>

                    {/* Sloc */}
                    <td className="py-2.5 px-3.5 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {item.sloc}
                      </span>
                    </td>

                    {/* Batch */}
                    <td className="py-2.5 px-3.5 whitespace-nowrap font-mono text-slate-800">
                      {item.batch}
                    </td>

                    {/* Qty Penimbunan (Kg) */}
                    <td className="py-2.5 px-3.5 text-right whitespace-nowrap font-medium text-slate-700">
                      {formatNumber(item.qtyPenimbunan)}
                    </td>

                    {/* Shortage Qty (Kg) */}
                    <td className="py-2.5 px-3.5 text-right whitespace-nowrap font-bold text-slate-900">
                      {formatNumber(item.shortageQty)}
                    </td>

                    {/* Shortage (%) */}
                    <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                        isCritical
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : isWarning
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}>
                        {formatPercent(item.shortagePercentage)}
                      </span>
                    </td>

                    {/* Shortage Amount (Rp) */}
                    <td className="py-2.5 px-3.5 text-right whitespace-nowrap font-semibold text-rose-600">
                      {formatRupiah(item.shortageAmount)}
                    </td>

                    {/* Keterangan */}
                    <td className="py-2.5 px-3.5 text-slate-600 text-[11px] max-w-xs truncate" title={item.keterangan}>
                      {item.keterangan}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

          {/* Table Summary Footer */}
          {filteredRecords.length > 0 && (
            <tfoot>
              <tr className="bg-slate-100/90 font-bold text-slate-900 border-t-2 border-slate-300">
                <td colSpan={6} className="py-3 px-3.5 text-right uppercase tracking-wider text-xs">
                  TOTAL BULANAN ({filteredRecords.length} BATCH):
                </td>
                <td className="py-3 px-3.5 text-right whitespace-nowrap text-slate-800">
                  {formatKg(tableSummary.totalPenimbunan)}
                </td>
                <td className="py-3 px-3.5 text-right whitespace-nowrap text-amber-700">
                  {formatKg(tableSummary.totalShortage)}
                </td>
                <td className="py-3 px-3.5 text-center whitespace-nowrap text-slate-800">
                  <span className="px-2 py-0.5 bg-slate-200 rounded font-bold">
                    {formatPercent(tableSummary.avgPct)}
                  </span>
                </td>
                <td className="py-3 px-3.5 text-right whitespace-nowrap text-rose-700 text-sm">
                  {formatRupiah(tableSummary.totalAmount)}
                </td>
                <td className="py-3 px-3.5 text-slate-500 text-[11px] font-normal">
                  Rata-rata susut bahan baku gudang
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

    </div>
  );
};
