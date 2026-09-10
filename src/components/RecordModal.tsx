import React, { useState, useEffect } from 'react';
import { X, Calculator, AlertCircle, Save, Check } from 'lucide-react';
import { ShortageRecord } from '../types';
import { FEEDMILL_MATERIALS, SLOC_OPTIONS, COMMON_REMARKS } from '../data/mockData';
import { getShortageStatus, formatRupiah, formatPercent, formatKg } from '../utils/formatters';

interface RecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: ShortageRecord) => void;
  initialRecord?: ShortageRecord | null;
  defaultMonth: string;
}

export const RecordModal: React.FC<RecordModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialRecord,
  defaultMonth,
}) => {
  const isEditing = !!initialRecord;

  // Form State
  const [tanggal, setTanggal] = useState('');
  const [materialDescription, setMaterialDescription] = useState('');
  const [materialCode, setMaterialCode] = useState('');
  const [sloc, setSloc] = useState('');
  const [batch, setBatch] = useState('');
  const [qtyPenimbunan, setQtyPenimbunan] = useState<number | ''>('');
  const [shortageQty, setShortageQty] = useState<number | ''>('');
  const [unitPrice, setUnitPrice] = useState<number | ''>('');
  const [keterangan, setKeterangan] = useState('');
  const [reportedBy, setReportedBy] = useState('');
  const [shift, setShift] = useState('Shift 1');
  const [errorMsg, setErrorMsg] = useState('');

  // Auto-calculated fields
  const penimbunanNum = typeof qtyPenimbunan === 'number' ? qtyPenimbunan : 0;
  const shortageNum = typeof shortageQty === 'number' ? shortageQty : 0;
  const unitPriceNum = typeof unitPrice === 'number' ? unitPrice : 0;

  const calculatedPercentage = penimbunanNum > 0 ? (shortageNum / penimbunanNum) * 100 : 0;
  const calculatedAmount = shortageNum * unitPriceNum;
  const status = getShortageStatus(calculatedPercentage);

  // Initialize or reset when modal opens
  useEffect(() => {
    if (initialRecord) {
      setTanggal(initialRecord.tanggal);
      setMaterialDescription(initialRecord.materialDescription);
      setMaterialCode(initialRecord.materialCode);
      setSloc(initialRecord.sloc);
      setBatch(initialRecord.batch);
      setQtyPenimbunan(initialRecord.qtyPenimbunan);
      setShortageQty(initialRecord.shortageQty);
      setUnitPrice(initialRecord.unitPrice);
      setKeterangan(initialRecord.keterangan);
      setReportedBy(initialRecord.reportedBy || '');
      setShift(initialRecord.shift || 'Shift 1');
    } else {
      const today = new Date().toISOString().split('T')[0];
      setTanggal(today);
      const defaultMat = FEEDMILL_MATERIALS[0];
      setMaterialDescription(defaultMat.name);
      setMaterialCode(defaultMat.code);
      setSloc(defaultMat.defaultSloc);
      setUnitPrice(defaultMat.pricePerKg);
      setBatch(`B${today.replace(/-/g, '').substring(2, 6)}-01`);
      setQtyPenimbunan(100000);
      setShortageQty(300);
      setKeterangan(COMMON_REMARKS[0]);
      setReportedBy('Staff Gudang');
      setShift('Shift 1');
    }
    setErrorMsg('');
  }, [initialRecord, isOpen]);

  // Handle Preset Material Change
  const handleMaterialPreset = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = FEEDMILL_MATERIALS.find((m) => m.name === e.target.value);
    if (selected) {
      setMaterialDescription(selected.name);
      setMaterialCode(selected.code);
      setSloc(selected.defaultSloc);
      setUnitPrice(selected.pricePerKg);
    } else {
      setMaterialDescription(e.target.value);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!tanggal) {
      setErrorMsg('Tanggal wajib diisi.');
      return;
    }
    if (!materialDescription.trim()) {
      setErrorMsg('Material Description wajib diisi.');
      return;
    }
    if (!sloc.trim()) {
      setErrorMsg('Storage Location (Sloc) wajib dipilih.');
      return;
    }
    if (!batch.trim()) {
      setErrorMsg('Nomor Batch wajib diisi.');
      return;
    }
    if (!penimbunanNum || penimbunanNum <= 0) {
      setErrorMsg('Qty Penimbunan (Kg) harus lebih besar dari 0.');
      return;
    }
    if (shortageNum < 0) {
      setErrorMsg('Shortage Qty (Kg) tidak boleh bernilai negatif.');
      return;
    }

    const monthStr = tanggal.substring(0, 7); // "YYYY-MM"

    const newRecord: ShortageRecord = {
      id: initialRecord?.id || `SH-${Date.now()}`,
      tanggal,
      bulan: monthStr,
      materialDescription: materialDescription.trim(),
      materialCode: materialCode.trim() || 'RM-CUSTOM',
      sloc: sloc.trim(),
      batch: batch.trim(),
      qtyPenimbunan: penimbunanNum,
      shortageQty: shortageNum,
      unitPrice: unitPriceNum,
      shortageAmount: calculatedAmount,
      shortagePercentage: calculatedPercentage,
      keterangan: keterangan.trim() || 'Susut operasional normal',
      status,
      reportedBy: reportedBy.trim(),
      shift,
    };

    onSave(newRecord);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div 
        id="modal-record-form"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              {isEditing ? 'Ubah Data Shortage Bahan Baku' : 'Input Catatan Shortage Bahan Baku'}
            </h2>
            <p className="text-xs text-slate-400">
              Form pencatatan susut timbang dan penimbunan silo/gudang feedmill
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Row 1: Tanggal & Shift */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tanggal Pencatatan *
              </label>
              <input
                id="input-tanggal"
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Shift Kerja
              </label>
              <select
                id="input-shift"
                value={shift}
                onChange={(e) => setShift(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-slate-900"
              >
                <option value="Shift 1">Shift 1 (Pagi)</option>
                <option value="Shift 2">Shift 2 (Siang)</option>
                <option value="Shift 3">Shift 3 (Malam)</option>
              </select>
            </div>
          </div>

          {/* Row 2: Material Description Preset & Code */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Material Description (Bahan Baku) *
              </label>
              <select
                id="select-material-preset"
                value={materialDescription}
                onChange={handleMaterialPreset}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-slate-900 mb-1.5"
              >
                <option value="">-- Pilih dari Katalog Bahan Baku Feedmill --</option>
                {FEEDMILL_MATERIALS.map((m) => (
                  <option key={m.code} value={m.name}>
                    {m.name} ({m.code})
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Atau ketik nama bahan baku kustom..."
                value={materialDescription}
                onChange={(e) => setMaterialDescription(e.target.value)}
                required
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Material Code
              </label>
              <input
                id="input-material-code"
                type="text"
                placeholder="Contoh: RM-CRN-01"
                value={materialCode}
                onChange={(e) => setMaterialCode(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 font-mono text-slate-900"
              />
            </div>
          </div>

          {/* Row 3: Sloc & Batch */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Storage Location (Sloc) *
              </label>
              <select
                id="input-sloc"
                value={sloc}
                onChange={(e) => setSloc(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-slate-900"
              >
                <option value="">-- Pilih Sloc Silo / Gudang --</option>
                {SLOC_OPTIONS.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.code} - {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nomor Batch / Lot *
              </label>
              <input
                id="input-batch"
                type="text"
                placeholder="Contoh: B2409-CRN-05"
                value={batch}
                onChange={(e) => setBatch(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 font-mono text-slate-900"
              />
            </div>
          </div>

          {/* Row 4: Qty Penimbunan, Shortage Qty, Harga Satuan */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5 text-amber-600" />
              Kalkulasi Kuantitas & Nilai Kerugian
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Qty Penimbunan (Kg) *
                </label>
                <input
                  id="input-qty-penimbunan"
                  type="number"
                  min="1"
                  step="any"
                  placeholder="e.g. 250000"
                  value={qtyPenimbunan}
                  onChange={(e) => setQtyPenimbunan(e.target.value ? parseFloat(e.target.value) : '')}
                  required
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Shortage Qty (Kg) *
                </label>
                <input
                  id="input-shortage-qty"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="e.g. 680"
                  value={shortageQty}
                  onChange={(e) => setShortageQty(e.target.value ? parseFloat(e.target.value) : '')}
                  required
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Estimasi Harga (Rp/Kg)
                </label>
                <input
                  id="input-unit-price"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="e.g. 5800"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value ? parseFloat(e.target.value) : '')}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-slate-900"
                />
              </div>
            </div>

            {/* Live Auto Calculation Banner */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500 block">Shortage (%) Terhitung:</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-base font-bold text-slate-900">
                    {formatPercent(calculatedPercentage)}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                    status === 'critical'
                      ? 'bg-rose-100 text-rose-800'
                      : status === 'warning'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {status === 'critical' ? 'Kritis (>0.8%)' : status === 'warning' ? 'Perhatian (0.36-0.8%)' : 'Normal (≤0.35%)'}
                  </span>
                </div>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-[11px] text-slate-500 block">Shortage Amount (Rp):</span>
                <span className="text-base font-bold text-rose-600 block mt-0.5">
                  {formatRupiah(calculatedAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Row 5: Keterangan / Remarks */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Keterangan (Penyebab Susut / Catatan QC)
            </label>
            <select
              id="select-keterangan-preset"
              onChange={(e) => {
                if (e.target.value) setKeterangan(e.target.value);
              }}
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-slate-700 mb-1.5"
            >
              <option value="">-- Pilih Penyebab Umum Feedmill --</option>
              {COMMON_REMARKS.map((remark, idx) => (
                <option key={idx} value={remark}>
                  {remark}
                </option>
              ))}
            </select>
            <textarea
              id="input-keterangan"
              rows={2}
              placeholder="Catatan penyebab selisih timbangan, susut aerasi, atau investigasi batch..."
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-slate-900"
            />
          </div>

          {/* Row 6: Pelapor */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Petugas Pencatat / Operator
            </label>
            <input
              id="input-reported-by"
              type="text"
              placeholder="Nama staff gudang / QC"
              value={reportedBy}
              onChange={(e) => setReportedBy(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-slate-900"
            />
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              id="btn-save-record"
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isEditing ? 'Simpan Perubahan' : 'Simpan Data Shortage'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
