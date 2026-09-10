export type ShortageStatus = 'normal' | 'warning' | 'critical';

export interface ShortageRecord {
  id: string;
  tanggal: string; // YYYY-MM-DD
  bulan: string; // YYYY-MM (e.g. "2024-09")
  materialDescription: string;
  materialCode: string;
  sloc: string; // Storage Location
  batch: string; // Batch / Lot No.
  qtyPenimbunan: number; // Qty Penimbunan (Kg)
  shortageQty: number; // Shortage Qty (Kg)
  unitPrice: number; // Harga per Kg (Rp)
  shortageAmount: number; // Shortage Amount (Rp) = shortageQty * unitPrice
  shortagePercentage: number; // Shortage (%) = (shortageQty / qtyPenimbunan) * 100
  keterangan: string; // Remarks / Root Cause
  status: ShortageStatus; // calculated based on tolerance (<0.3% normal, 0.3-0.8% warning, >0.8% critical)
  reportedBy?: string;
  shift?: string;
}

export interface MonthlySummary {
  totalPenimbunanKg: number;
  totalShortageKg: number;
  totalShortageAmountRp: number;
  avgShortagePercentage: number;
  totalBatches: number;
  criticalBatchesCount: number;
  warningBatchesCount: number;
  normalBatchesCount: number;
}

export interface FilterState {
  searchQuery: string;
  selectedMonth: string; // "all" or "YYYY-MM"
  selectedSloc: string; // "all" or specific
  selectedStatus: string; // "all" | "normal" | "warning" | "critical"
  selectedMaterial: string; // "all" or specific
}
