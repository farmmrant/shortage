import React from 'react';
import { 
  AlertTriangle, 
  ArrowDownRight, 
  CheckCircle2, 
  Coins, 
  Layers, 
  Scale, 
  ShieldAlert 
} from 'lucide-react';
import { MonthlySummary } from '../types';
import { formatKg, formatNumber, formatPercent, formatRupiah } from '../utils/formatters';

interface MetricCardsProps {
  summary: MonthlySummary;
  selectedMonthLabel: string;
}

export const MetricCards: React.FC<MetricCardsProps> = ({ summary, selectedMonthLabel }) => {
  const isToleranceExceeded = summary.avgShortagePercentage > 0.40;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      
      {/* 1. Total Qty Penimbunan */}
      <div 
        id="card-qty-penimbunan"
        className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all"
      >
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Qty Penimbunan
          </span>
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight">
            {formatKg(summary.totalPenimbunanKg)}
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
            <span>Setara {formatNumber(summary.totalPenimbunanKg / 1000, 2)} Ton</span>
            <span>•</span>
            <span className="text-slate-600 font-medium">{summary.totalBatches} Batch Silo/Gudang</span>
          </div>
        </div>
      </div>

      {/* 2. Total Shortage Qty */}
      <div 
        id="card-shortage-qty"
        className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all"
      >
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Shortage Qty
          </span>
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Scale className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-bold text-slate-900 tracking-tight flex items-baseline gap-2">
            <span>{formatKg(summary.totalShortageKg)}</span>
            <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
              {formatNumber(summary.totalShortageKg / 1000, 2)} Ton
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
            <ArrowDownRight className="w-3.5 h-3.5 text-amber-600" />
            <span>Susut timbang, aerasi & handling</span>
          </div>
        </div>
      </div>

      {/* 3. Total Shortage Amount (Rp) */}
      <div 
        id="card-shortage-amount"
        className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all"
      >
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Shortage Amount (Rp)
          </span>
          <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
            <Coins className="w-4 h-4" />
          </div>
        </div>
        <div>
          <div className="text-2xl font-bold text-rose-600 tracking-tight">
            {formatRupiah(summary.totalShortageAmountRp)}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Valuasi kerugian bahan baku {selectedMonthLabel}
          </p>
        </div>
      </div>

      {/* 4. Rata-Rata Shortage (%) & KPI Status */}
      <div 
        id="card-shortage-pct"
        className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all"
      >
        <div className="flex items-center justify-between text-slate-500 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Rata-rata Shortage (%)
          </span>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            summary.avgShortagePercentage <= 0.35 
              ? 'bg-emerald-50 text-emerald-600' 
              : summary.avgShortagePercentage <= 0.8 
                ? 'bg-amber-50 text-amber-600' 
                : 'bg-rose-50 text-rose-600'
          }`}>
            {summary.avgShortagePercentage <= 0.35 ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : summary.avgShortagePercentage <= 0.8 ? (
              <AlertTriangle className="w-4 h-4" />
            ) : (
              <ShieldAlert className="w-4 h-4" />
            )}
          </div>
        </div>
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">
              {formatPercent(summary.avgShortagePercentage)}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              summary.avgShortagePercentage <= 0.35
                ? 'bg-emerald-100 text-emerald-800'
                : summary.avgShortagePercentage <= 0.8
                ? 'bg-amber-100 text-amber-800'
                : 'bg-rose-100 text-rose-800'
            }`}>
              {summary.avgShortagePercentage <= 0.35 ? 'Aman (≤ 0.35%)' : 'Perlu Evaluasi'}
            </span>
          </div>

          <div className="flex items-center gap-3 mt-2 pt-2 border-t border-slate-100 text-xs">
            <span className="flex items-center gap-1 text-emerald-700 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              {summary.normalBatchesCount} Normal
            </span>
            <span className="flex items-center gap-1 text-amber-700 font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              {summary.warningBatchesCount} Perhatian
            </span>
            {summary.criticalBatchesCount > 0 && (
              <span className="flex items-center gap-1 text-rose-700 font-medium">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                {summary.criticalBatchesCount} Kritis
              </span>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};
