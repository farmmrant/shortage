import * as XLSX from 'xlsx';
import { ShortageRecord } from '../types';
import { FEEDMILL_MATERIALS, SLOC_OPTIONS } from '../data/mockData';
import { getShortageStatus } from './formatters';

// Column mapping dictionaries to handle various Indonesian and English header variations
const HEADER_MAPPINGS: Record<string, keyof ShortageRecord | 'skip'> = {
  // Tanggal
  'tanggal': 'tanggal',
  'tgl': 'tanggal',
  'date': 'tanggal',
  'posting date': 'tanggal',
  'tgl penimbunan': 'tanggal',

  // Batch
  'batch': 'batch',
  'batch no': 'batch',
  'no batch': 'batch',
  'lot': 'batch',
  'lot no': 'batch',
  'no tiket': 'batch',
  'tiket': 'batch',

  // Material Description
  'material': 'materialDescription',
  'nama material': 'materialDescription',
  'nama bahan': 'materialDescription',
  'nama bahan baku': 'materialDescription',
  'material description': 'materialDescription',
  'deskripsi material': 'materialDescription',
  'deskripsi': 'materialDescription',
  'raw material': 'materialDescription',

  // Material Code
  'kode': 'materialCode',
  'kode material': 'materialCode',
  'material code': 'materialCode',
  'kode item': 'materialCode',
  'item code': 'materialCode',
  'kode barang': 'materialCode',

  // Sloc
  'sloc': 'sloc',
  'storage location': 'sloc',
  'lokasi': 'sloc',
  'lokasi simpan': 'sloc',
  'gudang': 'sloc',
  'silo': 'sloc',

  // Qty Penimbunan
  'qty penimbunan': 'qtyPenimbunan',
  'qty penimbunan (kg)': 'qtyPenimbunan',
  'penimbunan (kg)': 'qtyPenimbunan',
  'qty timbang': 'qtyPenimbunan',
  'berat timbang (kg)': 'qtyPenimbunan',
  'qty masuk': 'qtyPenimbunan',
  'penimbunan': 'qtyPenimbunan',
  'timbang masuk (kg)': 'qtyPenimbunan',
  'qty (kg)': 'qtyPenimbunan',

  // Shortage Qty
  'shortage qty': 'shortageQty',
  'shortage qty (kg)': 'shortageQty',
  'shortage (kg)': 'shortageQty',
  'qty susut': 'shortageQty',
  'qty susut (kg)': 'shortageQty',
  'susut (kg)': 'shortageQty',
  'susut': 'shortageQty',
  'selisih (kg)': 'shortageQty',
  'selisih': 'shortageQty',
  'shortage': 'shortageQty',

  // Unit Price
  'harga': 'unitPrice',
  'harga satuan': 'unitPrice',
  'harga per kg': 'unitPrice',
  'unit price': 'unitPrice',
  'price': 'unitPrice',
  'harga (rp)': 'unitPrice',
  'harga/kg': 'unitPrice',

  // Shortage Amount
  'shortage amount': 'shortageAmount',
  'shortage amount (rp)': 'shortageAmount',
  'nilai susut': 'shortageAmount',
  'nilai susut (rp)': 'shortageAmount',
  'total susut (rp)': 'shortageAmount',
  'amount (rp)': 'shortageAmount',
  'amount': 'shortageAmount',

  // Keterangan
  'keterangan': 'keterangan',
  'remarks': 'keterangan',
  'catatan': 'keterangan',
  'root cause': 'keterangan',
  'penyebab': 'keterangan',
  'alasan': 'keterangan',

  // Petugas & Shift
  'petugas': 'reportedBy',
  'pic': 'reportedBy',
  'operator': 'reportedBy',
  'reported by': 'reportedBy',
  'shift': 'shift',
};

// Normalize date to YYYY-MM-DD
function parseDateValue(val: any): string {
  if (!val) {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  // If already a JS Date
  if (val instanceof Date) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // If Excel serial number (e.g. 45540)
  if (typeof val === 'number') {
    const dateObj = XLSX.SSF.parse_date_code(val);
    if (dateObj) {
      const y = dateObj.y;
      const m = String(dateObj.m).padStart(2, '0');
      const d = String(dateObj.d).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }

  const str = String(val).trim();

  // If format DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmyMatch) {
    const d = dmyMatch[1].padStart(2, '0');
    const m = dmyMatch[2].padStart(2, '0');
    const y = dmyMatch[3];
    return `${y}-${m}-${d}`;
  }

  // If format YYYY-MM-DD
  const ymdMatch = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (ymdMatch) {
    const y = ymdMatch[1];
    const m = ymdMatch[2].padStart(2, '0');
    const d = ymdMatch[3].padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // Fallback try Date.parse
  const parsed = Date.parse(str);
  if (!isNaN(parsed)) {
    const d = new Date(parsed);
    return d.toISOString().split('T')[0];
  }

  const today = new Date();
  return today.toISOString().split('T')[0];
}

// Clean number
function parseNumberValue(val: any): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;
  // Strip currency symbols, spaces, commas if thousands separators
  const str = String(val)
    .replace(/Rp\.?/gi, '')
    .replace(/\s+/g, '')
    .replace(/\./g, '') // remove indonesian thousands separator
    .replace(/,/g, '.'); // replace indonesian decimal comma with dot
  const num = parseFloat(str);
  return isNaN(num) ? 0 : Math.abs(num);
}

export interface ParseExcelResult {
  records: ShortageRecord[];
  totalRows: number;
  errors: string[];
}

/**
 * Parse an uploaded Excel / CSV File buffer into ShortageRecord array
 */
export async function parseExcelFile(file: File): Promise<ParseExcelResult> {
  const errors: string[] = [];
  const buffer = await file.arrayBuffer();
  
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error('File Excel tidak memiliki sheet yang dapat dibaca.');
  }

  const worksheet = workbook.Sheets[sheetName];
  // Parse rows as raw array of arrays or objects
  const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

  if (!rawRows || rawRows.length < 2) {
    throw new Error('File Excel kosong atau tidak memiliki baris data setelah header.');
  }

  // Find header row (usually first non-empty row)
  let headerIndex = -1;
  let headerRow: string[] = [];

  for (let i = 0; i < Math.min(rawRows.length, 10); i++) {
    const row = rawRows[i];
    if (Array.isArray(row) && row.some(cell => typeof cell === 'string' && cell.trim() !== '')) {
      const normalizedCells = row.map(c => String(c).toLowerCase().trim());
      // Check if this row looks like a header (contains "tanggal", "material", "batch", or "shortage")
      const matchesHeader = normalizedCells.some(c => 
        c.includes('tanggal') || c.includes('date') || c.includes('material') || 
        c.includes('batch') || c.includes('shortage') || c.includes('penimbunan') || c.includes('susut')
      );
      if (matchesHeader) {
        headerIndex = i;
        headerRow = row.map(c => String(c).trim());
        break;
      }
    }
  }

  if (headerIndex === -1) {
    // Fallback: assume row 0 is header
    headerIndex = 0;
    headerRow = (rawRows[0] as any[]).map(c => String(c).trim());
  }

  // Map column index to field
  const colMap: Map<number, keyof ShortageRecord> = new Map();
  headerRow.forEach((h, colIdx) => {
    const cleanHeader = h.toLowerCase().replace(/[_\r\n\t]+/g, ' ').trim();
    if (HEADER_MAPPINGS[cleanHeader]) {
      const target = HEADER_MAPPINGS[cleanHeader];
      if (target !== 'skip') {
        colMap.set(colIdx, target);
      }
    } else {
      // Fuzzy contains match
      for (const [key, target] of Object.entries(HEADER_MAPPINGS)) {
        if (target !== 'skip' && cleanHeader.includes(key)) {
          colMap.set(colIdx, target);
          break;
        }
      }
    }
  });

  const records: ShortageRecord[] = [];
  const now = Date.now();

  for (let r = headerIndex + 1; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!Array.isArray(row)) continue;

    // Check if entire row is empty
    const hasData = row.some(cell => cell !== '' && cell !== null && cell !== undefined);
    if (!hasData) continue;

    const rowObj: Partial<ShortageRecord> = {};

    colMap.forEach((field, colIdx) => {
      const rawVal = row[colIdx];
      if (field === 'tanggal') {
        rowObj.tanggal = parseDateValue(rawVal);
      } else if (field === 'qtyPenimbunan' || field === 'shortageQty' || field === 'unitPrice' || field === 'shortageAmount') {
        rowObj[field] = parseNumberValue(rawVal);
      } else if (typeof rawVal === 'string' || typeof rawVal === 'number') {
        (rowObj as any)[field] = String(rawVal).trim();
      }
    });

    // Validations & Defaults
    const tanggal = rowObj.tanggal || parseDateValue(null);
    const bulan = tanggal.substring(0, 7); // "YYYY-MM"

    // Material logic
    let materialDescription = rowObj.materialDescription || '';
    let materialCode = rowObj.materialCode || '';
    let sloc = rowObj.sloc || '';
    let unitPrice = rowObj.unitPrice || 0;

    // Match material with FEEDMILL_MATERIALS catalog if available
    if (materialDescription && !materialCode) {
      const match = FEEDMILL_MATERIALS.find(m => 
        m.name.toLowerCase().includes(materialDescription.toLowerCase()) ||
        materialDescription.toLowerCase().includes(m.name.toLowerCase())
      );
      if (match) {
        materialCode = match.code;
        if (!sloc) sloc = match.defaultSloc;
        if (!unitPrice) unitPrice = match.pricePerKg;
      }
    } else if (materialCode && !materialDescription) {
      const match = FEEDMILL_MATERIALS.find(m => m.code.toLowerCase() === materialCode.toLowerCase());
      if (match) {
        materialDescription = match.name;
        if (!sloc) sloc = match.defaultSloc;
        if (!unitPrice) unitPrice = match.pricePerKg;
      }
    }

    if (!materialDescription) {
      materialDescription = 'Bahan Baku Feedmill Campuran';
    }
    if (!materialCode) {
      materialCode = 'RM-GEN-01';
    }
    if (!sloc) {
      sloc = SLOC_OPTIONS[0].code;
    }
    if (!unitPrice || unitPrice <= 0) {
      const match = FEEDMILL_MATERIALS.find(m => m.code === materialCode);
      unitPrice = match ? match.pricePerKg : 5500;
    }

    const qtyPenimbunan = Math.max(1, rowObj.qtyPenimbunan || 1000);
    const shortageQty = Math.max(0, rowObj.shortageQty || 0);
    const shortagePercentage = (shortageQty / qtyPenimbunan) * 100;
    const shortageAmount = rowObj.shortageAmount && rowObj.shortageAmount > 0 
      ? rowObj.shortageAmount 
      : Math.round(shortageQty * unitPrice);

    const status = getShortageStatus(shortagePercentage);
    const batch = rowObj.batch || `B${tanggal.replace(/-/g, '').substring(2)}-${materialCode.replace('RM-', '')}-${r}`;
    const keterangan = rowObj.keterangan || (
      shortagePercentage > 0.8 
        ? 'Susut melebihi toleransi standar pakan, perlu verifikasi QC' 
        : 'Susut wajar penanganan bahan baku & aerasi silo'
    );

    const record: ShortageRecord = {
      id: `SH-IMP-${now}-${r}`,
      tanggal,
      bulan,
      materialDescription,
      materialCode,
      sloc,
      batch,
      qtyPenimbunan,
      shortageQty,
      unitPrice,
      shortageAmount,
      shortagePercentage,
      keterangan,
      status,
      reportedBy: rowObj.reportedBy || 'Petugas Gudang',
      shift: rowObj.shift || 'Shift 1',
    };

    records.push(record);
  }

  return {
    records,
    totalRows: records.length,
    errors,
  };
}

/**
 * Generate and download a structured Excel template for Feedmill Shortage records
 */
export function downloadExcelTemplate() {
  const templateData = [
    {
      'Tanggal': '2024-09-25',
      'Batch / No Tiket': 'B2409-CRN-99',
      'Kode Material': 'RM-CRN-01',
      'Nama Bahan Baku': 'Jagung Pipil Kadar Air 14% (Yellow Corn)',
      'Sloc (Lokasi)': 'SILO-01',
      'Qty Penimbunan (Kg)': 180000,
      'Shortage Qty (Kg)': 520,
      'Harga per Kg (Rp)': 5800,
      'Keterangan': 'Susut kelembapan / moisture loss aerasi silo',
      'Petugas': 'Sutrisno',
      'Shift': 'Shift 1',
    },
    {
      'Tanggal': '2024-09-26',
      'Batch / No Tiket': 'B2409-SBM-55',
      'Kode Material': 'RM-SBM-01',
      'Nama Bahan Baku': 'Bungkil Kedelai Import 46% (SBM)',
      'Sloc (Lokasi)': 'SILO-03',
      'Qty Penimbunan (Kg)': 95000,
      'Shortage Qty (Kg)': 320,
      'Harga per Kg (Rp)': 8900,
      'Keterangan': 'Pembersihan intake pit dedusting cyclone',
      'Petugas': 'Bambang Irawan',
      'Shift': 'Shift 2',
    },
    {
      'Tanggal': '2024-09-27',
      'Batch / No Tiket': 'B2409-MBM-12',
      'Kode Material': 'RM-MBM-01',
      'Nama Bahan Baku': 'Meat and Bone Meal 50% (MBM)',
      'Sloc (Lokasi)': 'WH-BULK-A',
      'Qty Penimbunan (Kg)': 45000,
      'Shortage Qty (Kg)': 410,
      'Harga per Kg (Rp)': 11200,
      'Keterangan': 'Selisih tara truk timbang & tumpahan unloading loader',
      'Petugas': 'Wahyu Hidayat',
      'Shift': 'Shift 1',
    },
    {
      'Tanggal': '2024-09-28',
      'Batch / No Tiket': 'B2409-DDK-33',
      'Kode Material': 'RM-DDK-01',
      'Nama Bahan Baku': 'Dedak Padi Halus Super (Rice Bran D1)',
      'Sloc (Lokasi)': 'WH-BULK-B',
      'Qty Penimbunan (Kg)': 60000,
      'Shortage Qty (Kg)': 190,
      'Harga per Kg (Rp)': 4100,
      'Keterangan': 'Susut normal handling conveyor belt',
      'Petugas': 'Agus Salim',
      'Shift': 'Shift 3',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(templateData);

  // Set column widths
  ws['!cols'] = [
    { wch: 14 }, // Tanggal
    { wch: 18 }, // Batch
    { wch: 16 }, // Kode
    { wch: 40 }, // Nama
    { wch: 16 }, // Sloc
    { wch: 22 }, // Qty Penimbunan
    { wch: 18 }, // Shortage Qty
    { wch: 18 }, // Harga Satuan
    { wch: 45 }, // Keterangan
    { wch: 18 }, // Petugas
    { wch: 12 }, // Shift
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template_Shortage_Feedmill');

  // Also add reference sheet for Material Catalog
  const refMaterials = FEEDMILL_MATERIALS.map(m => ({
    'Kode Material': m.code,
    'Nama Bahan Baku Feedmill': m.name,
    'Default Sloc': m.defaultSloc,
    'Harga Estimasi (Rp/Kg)': m.pricePerKg,
  }));
  const wsRef = XLSX.utils.json_to_sheet(refMaterials);
  wsRef['!cols'] = [{ wch: 16 }, { wch: 40 }, { wch: 16 }, { wch: 22 }];
  XLSX.utils.book_append_sheet(wb, wsRef, 'Daftar_Bahan_Baku');

  // Write file
  XLSX.writeFile(wb, 'Template_Upload_Shortage_Feedmill.xlsx');
}
