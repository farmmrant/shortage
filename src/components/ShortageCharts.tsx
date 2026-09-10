import React, { useState } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  ReferenceLine
} from 'recharts';
import { ShortageRecord } from '../types';
import { formatKg, formatNumber, formatPercent, formatRupiah, formatDateIndo } from '../utils/formatters';
import { BarChart3, TrendingUp, PieChart as PieIcon, HelpCircle } from 'lucide-react';

interface ShortageChartsProps {
  records: ShortageRecord[];
  selectedMonthLabel: string;
}

const COLORS = [
  '#f59e0b', // amber-500
  '#3b82f6', // blue-500
  '#ef4444', // red-500
  '#10b981', // emerald-500
  '#8b5cf6', // purple-500
  '#ec4899', // pink-500
  '#06b6d4', // cyan-500
  '#84cc16', // lime-500
  '#f97316', // orange-500
];

export const ShortageCharts: React.FC<ShortageChartsProps> = ({ records, selectedMonthLabel }) => {
  const [activeTab, setActiveTab] = useState<'trend' | 'material' | 'sloc'>('trend');

  if (!records.length) {
    return (
      <div className="bg-white rounded-xl p-8 border border-slate-200 text-center text-slate-500">
        <p>Tidak ada data untuk ditampilkan pada grafik periode ini.</p>
      </div>
    );
  }

  // 1. Data for Trend (sorted chronologically)
  const trendData = [...records]
    .sort((a, b) => a.tanggal.localeCompare(b.tanggal))
    .map((r) => ({
      date: formatDateIndo(r.tanggal),
      shortageQty: r.shortageQty,
      shortagePct: Number(r.shortagePercentage.toFixed(2)),
      material: r.materialDescription,
      batch: r.batch,
      amount: r.shortageAmount,
    }));

  // 2. Data grouped by Material
  const materialMap = new Map<string, { material: string; shortageKg: number; amountRp: number; penimbunanKg: number; count: number }>();
  records.forEach((r) => {
    const key = r.materialDescription;
    const existing = materialMap.get(key) || {
      material: key,
      shortageKg: 0,
      amountRp: 0,
      penimbunanKg: 0,
      count: 0,
    };
    existing.shortageKg += r.shortageQty;
    existing.amountRp += r.shortageAmount;
    existing.penimbunanKg += r.qtyPenimbunan;
    existing.count += 1;
    materialMap.set(key, existing);
  });

  const materialData = Array.from(materialMap.values())
    .map((m) => ({
      ...m,
      avgPct: Number(((m.shortageKg / m.penimbunanKg) * 100).toFixed(2)),
      // Short label for chart readability
      shortName: m.material.length > 22 ? m.material.substring(0, 20) + '...' : m.material,
    }))
    .sort((a, b) => b.shortageKg - a.shortageKg);

  // 3. Data grouped by Sloc
  const slocMap = new Map<string, { sloc: string; shortageKg: number; amountRp: number }>();
  records.forEach((r) => {
    const key = r.sloc;
    const existing = slocMap.get(key) || { sloc: key, shortageKg: 0, amountRp: 0 };
    existing.shortageKg += r.shortageQty;
    existing.amountRp += r.shortageAmount;
    slocMap.set(key, existing);
  });

  const slocData = Array.from(slocMap.values())
    .sort((a, b) => b.shortageKg - a.shortageKg);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      
      {/* Header with Chart Switcher Tabs */}
      <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-amber-500" />
            Visualisasi Grafik Shortage Bahan Baku ({selectedMonthLabel})
          </h2>
          <p className="text-xs text-slate-500">
            Analisis susut kuantitas (Kg), nominal kerugian (Rp), dan persentase terhadap penimbunan
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-lg self-start sm:self-auto">
          <button
            id="tab-chart-trend"
            onClick={() => setActiveTab('trend')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              activeTab === 'trend'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Tren Tanggal</span>
          </button>
          <button
            id="tab-chart-material"
            onClick={() => setActiveTab('material')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              activeTab === 'material'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Per Material</span>
          </button>
          <button
            id="tab-chart-sloc"
            onClick={() => setActiveTab('sloc')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              activeTab === 'sloc'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PieIcon className="w-3.5 h-3.5" />
            <span>Per Sloc (Silo/WH)</span>
          </button>
        </div>
      </div>

      {/* Chart Body */}
      <div className="p-5">
        
        {/* TAB 1: Chronological Trend (Shortage Kg & Shortage %) */}
        {activeTab === 'trend' && (
          <div>
            <div className="flex flex-wrap items-center justify-between mb-3 text-xs text-slate-500">
              <span className="font-medium text-slate-700">
                Grafik Batang: Shortage Qty (Kg) & Garis: Shortage (%)
              </span>
              <span className="flex items-center gap-1 text-slate-400">
                <span className="w-2.5 h-0.5 bg-rose-500 inline-block border-b-2 border-dashed"></span>
                Garis merah putus-putus = Ambang Batas Toleransi Feedmill (0.35%)
              </span>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={trendData} margin={{ top: 10, right: 20, left: 10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 11, fill: '#64748b' }} 
                    angle={-20}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis 
                    yAxisId="left" 
                    orientation="left"
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickFormatter={(v) => `${v} Kg`}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    domain={[0, (max: number) => Math.max(1.2, Math.ceil(max * 1.2))]}
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-3 rounded-lg shadow-lg text-xs space-y-1 border border-slate-700 max-w-xs">
                            <p className="font-semibold text-amber-400">{data.material}</p>
                            <p className="text-slate-300">Batch: <span className="text-white font-mono">{data.batch}</span></p>
                            <p className="text-slate-300">Tanggal: <span className="text-white">{data.date}</span></p>
                            <div className="pt-1.5 mt-1 border-t border-slate-800 space-y-1">
                              <p className="flex justify-between gap-3 text-slate-300">
                                <span>Shortage:</span>
                                <span className="font-bold text-amber-300">{formatKg(data.shortageQty)}</span>
                              </p>
                              <p className="flex justify-between gap-3 text-slate-300">
                                <span>Persentase:</span>
                                <span className={`font-bold ${data.shortagePct > 0.35 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                  {data.shortagePct}%
                                </span>
                              </p>
                              <p className="flex justify-between gap-3 text-slate-300">
                                <span>Kerugian (Rp):</span>
                                <span className="font-bold text-rose-300">{formatRupiah(data.amount)}</span>
                              </p>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend 
                    verticalAlign="top" 
                    align="right" 
                    wrapperStyle={{ fontSize: '11px', paddingBottom: '8px' }} 
                  />
                  <ReferenceLine 
                    yAxisId="right" 
                    y={0.35} 
                    stroke="#ef4444" 
                    strokeDasharray="4 4" 
                    label={{ value: 'Limit 0.35%', fill: '#ef4444', fontSize: 10, position: 'right' }} 
                  />
                  <Bar 
                    yAxisId="left" 
                    dataKey="shortageQty" 
                    name="Shortage Qty (Kg)" 
                    fill="#3b82f6" 
                    radius={[4, 4, 0, 0]} 
                    maxBarSize={40}
                  />
                  <Line 
                    yAxisId="right" 
                    type="monotone" 
                    dataKey="shortagePct" 
                    name="Shortage (%)" 
                    stroke="#f59e0b" 
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#f59e0b' }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* TAB 2: Shortage Per Material */}
        {activeTab === 'material' && (
          <div>
            <div className="flex items-center justify-between mb-3 text-xs text-slate-500">
              <span className="font-medium text-slate-700">
                Peringkat Kuantitas Shortage (Kg) per Deskripsi Bahan Baku
              </span>
              <span>Total {materialData.length} Jenis Bahan Baku</span>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={materialData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis 
                    type="number" 
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickFormatter={(v) => `${v} Kg`}
                  />
                  <YAxis 
                    dataKey="shortName" 
                    type="category" 
                    tick={{ fontSize: 11, fill: '#334155' }}
                    width={115}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-3 rounded-lg shadow-lg text-xs space-y-1.5 border border-slate-700 max-w-xs">
                            <p className="font-semibold text-amber-400">{data.material}</p>
                            <p className="text-slate-300">Total Penimbunan: <span className="text-white">{formatKg(data.penimbunanKg)}</span></p>
                            <p className="text-slate-300">Total Shortage: <span className="text-amber-300 font-bold">{formatKg(data.shortageKg)}</span></p>
                            <p className="text-slate-300">Rata-rata Susut: <span className="text-emerald-400 font-bold">{data.avgPct}%</span></p>
                            <p className="text-slate-300">Nominal Kerugian: <span className="text-rose-400 font-bold">{formatRupiah(data.amountRp)}</span></p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="shortageKg" name="Shortage Qty (Kg)" radius={[0, 4, 4, 0]}>
                    {materialData.map((_, index) => (
                      <Cell key={`cell-mat-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* TAB 3: Shortage Per Sloc (Storage Location) */}
        {activeTab === 'sloc' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            
            {/* Pie Chart */}
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={slocData}
                    dataKey="shortageKg"
                    nameKey="sloc"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={45}
                    paddingAngle={3}
                  >
                    {slocData.map((_, index) => (
                      <Cell key={`cell-sloc-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-2.5 rounded-md shadow-md text-xs">
                            <p className="font-bold text-amber-400">{data.sloc}</p>
                            <p className="text-slate-300">Shortage: {formatKg(data.shortageKg)}</p>
                            <p className="text-slate-300">Kerugian: {formatRupiah(data.amountRp)}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Sloc Summary List */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
              <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Peringkat Susut per Lokasi Simpan (Sloc)
              </h3>
              {slocData.map((item, idx) => {
                const totalShortageAll = slocData.reduce((acc, c) => acc + c.shortageKg, 0);
                const pct = totalShortageAll > 0 ? (item.shortageKg / totalShortageAll) * 100 : 0;
                return (
                  <div key={item.sloc} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-2">
                      <span 
                        className="w-3 h-3 rounded-full shrink-0" 
                        style={{ backgroundColor: COLORS[idx % COLORS.length] }} 
                      />
                      <span className="font-semibold text-slate-800">{item.sloc}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-900">{formatKg(item.shortageKg)}</span>
                      <span className="text-slate-500 ml-1.5 text-[11px]">({pct.toFixed(1)}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}

      </div>

    </div>
  );
};
