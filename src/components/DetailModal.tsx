import React from 'react';
import { X, CheckCircle2, AlertTriangle, ShieldAlert, Printer, Warehouse, Calendar, Tag, Layers, Scale, DollarSign } from 'lucide-react';
import { ShortageRecord } from '../types';
import { formatDateIndo, formatKg, formatNumber, formatPercent, formatRupiah } from '../utils/formatters';

interface DetailModalProps {
  record: ShortageRecord | null;
  onClose: () => void;
  onEdit: (record: ShortageRecord) => void;
}

export const DetailModal: React.FC<DetailModalProps> = ({ record, onClose, onEdit }) => {
  if (!record) return null;

  const isCritical = record.status === 'critical';
  const isWarning = record.status === 'warning';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div 
        id="modal-detail-ticket"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isCritical ? 'bg-rose-500/20 text-rose-400' : isWarning ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
            }`}>
              {isCritical ? <ShieldAlert className="w-5 h-5" /> : isWarning ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Tiket Audit Shortage Gudang</h3>
              <p className="text-xs text-slate-400 font-mono">ID: {record.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          
          {/* Status Alert Banner */}
          <div className={`p-3.5 rounded-xl border flex items-start gap-3 ${
            isCritical
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : isWarning
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}>
            {isCritical ? (
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            ) : isWarning ? (
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            )}
            <div className="text-xs">
              <span className="font-bold block">
                {isCritical 
                  ? 'Status Kritis: Melebihi Batas Toleransi (>0.8%)' 
                  : isWarning 
                  ? 'Status Perhatian: Mendekati Batas Toleransi (0.36% - 0.8%)' 
                  : 'Status Normal: Dalam Batas Toleransi Feedmill (≤0.35%)'}
              </span>
              <p className="mt-0.5 text-slate-600">
                {isCritical
                  ? 'Disarankan melakukan kalibrasi jembatan timbang, pengecekan kebocoran bucket elevator atau audit susut kelembapan pada silo.'
                  : isWarning
                  ? 'Perlu pemantauan berkala pada batch berikutnya untuk mencegah kenaikan susut penanganan.'
                  : 'Susut tergolong susut wajar dalam operasional penyimpanan dan bongkar muat bahan baku pakan.'}
              </p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-500 block mb-0.5">Tanggal Pencatatan</span>
              <span className="font-semibold text-slate-900 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {formatDateIndo(record.tanggal)}
              </span>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-500 block mb-0.5">Storage Location (Sloc)</span>
              <span className="font-semibold text-slate-900 flex items-center gap-1">
                <Warehouse className="w-3.5 h-3.5 text-slate-400" />
                {record.sloc}
              </span>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-500 block mb-0.5">Nomor Batch / Lot</span>
              <span className="font-mono font-bold text-slate-900 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                {record.batch}
              </span>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-500 block mb-0.5">Shift & Petugas</span>
              <span className="font-semibold text-slate-900">
                {record.shift || 'Shift 1'} • {record.reportedBy || 'Staff Gudang'}
              </span>
            </div>
          </div>

          {/* Material Name */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-xs text-slate-500 block">Material Description</span>
            <div className="text-sm font-bold text-slate-900 mt-0.5">{record.materialDescription}</div>
            <span className="text-xs font-mono text-slate-500">{record.materialCode}</span>
          </div>

          {/* Numbers Comparison */}
          <div className="grid grid-cols-3 gap-2.5 text-center">
            <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-xl">
              <span className="text-[11px] text-blue-700 font-medium block">Qty Penimbunan</span>
              <span className="text-sm font-bold text-blue-900 block mt-1">
                {formatKg(record.qtyPenimbunan)}
              </span>
            </div>

            <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl">
              <span className="text-[11px] text-amber-700 font-medium block">Shortage Qty</span>
              <span className="text-sm font-bold text-amber-900 block mt-1">
                {formatKg(record.shortageQty)}
              </span>
            </div>

            <div className="p-2.5 bg-rose-50/70 border border-rose-200 rounded-xl">
              <span className="text-[11px] text-rose-700 font-medium block">Persentase</span>
              <span className="text-sm font-bold text-rose-900 block mt-1">
                {formatPercent(record.shortagePercentage)}
              </span>
            </div>
          </div>

          {/* Shortage Amount */}
          <div className="p-3 bg-rose-50/50 border border-rose-200 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-600 block">Total Shortage Amount (Rp)</span>
              <span className="text-xs text-slate-400">
                Estimasi harga: {formatRupiah(record.unitPrice)} / Kg
              </span>
            </div>
            <div className="text-base font-bold text-rose-600">
              {formatRupiah(record.shortageAmount)}
            </div>
          </div>

          {/* Remarks */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-xs font-semibold text-slate-700 block mb-1">Keterangan / Temuan:</span>
            <p className="text-xs text-slate-600 leading-relaxed">{record.keterangan || '-'}</p>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Tiket</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onEdit(record);
              }}
              className="px-3.5 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg transition-colors cursor-pointer"
            >
              Ubah Data Ini
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
