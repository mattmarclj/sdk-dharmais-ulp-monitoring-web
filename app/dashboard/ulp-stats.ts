import { UlpData } from "./data-loader";

export interface UlpOverviewStats {
  totalPackages: number;
  totalPagu: number;
  totalHps: number;
  totalSavings: number;
  savingsPercentage: number;
  
  trendData: {
    date: string; // "YYYY-MM-DD" or "DD MMM"
    pagu: number;
    hps: number;
    count: number;
  }[];

  byUnitKerja: {
    name: string;
    pagu: number;
    count: number;
    share: number;
  }[];

  byMethod: {
    name: string;
    pagu: number;
    count: number;
    share: number;
  }[];

  topProjects: {
    name: string;
    pagu: number;
    hps: number;
    unit: string;
  }[];
}

export function calculateUlpStats(data: UlpData[]): UlpOverviewStats {
  const stats: UlpOverviewStats = {
    totalPackages: 0,
    totalPagu: 0,
    totalHps: 0,
    totalSavings: 0,
    savingsPercentage: 0,
    trendData: [],
    byUnitKerja: [],
    byMethod: [],
    topProjects: [],
  };

  if (!data || data.length === 0) return stats;

  // 1. Basic Totals
  stats.totalPackages = data.length;
  stats.totalPagu = data.reduce((sum, item) => sum + (item.paguAnggaranAktif || 0), 0);
  stats.totalHps = data.reduce((sum, item) => sum + (item.hps || 0), 0);
  stats.totalSavings = stats.totalPagu - stats.totalHps;
  stats.savingsPercentage = stats.totalPagu > 0 
    ? (stats.totalSavings / stats.totalPagu) * 100 
    : 0;

  // 2. Trend Data (Daily)
  const trendMap = new Map<string, { pagu: number; hps: number; count: number }>();
  
  // Sort by date first
  const sortedData = [...data].sort((a, b) => {
    const dateA = a.tanggalDpp?.getTime() ?? 0;
    const dateB = b.tanggalDpp?.getTime() ?? 0;
    return dateA - dateB;
  });

  sortedData.forEach(item => {
    if (!item.tanggalDpp) return;
    
    // Format date as DD MMM
    const day = item.tanggalDpp.getDate();
    const month = item.tanggalDpp.toLocaleString('id-ID', { month: 'short' });
    const key = `${day} ${month}`; // e.g., "20 Nov"

    const current = trendMap.get(key) || { pagu: 0, hps: 0, count: 0 };
    current.pagu += item.paguAnggaranAktif || 0;
    current.hps += item.hps || 0;
    current.count += 1;
    trendMap.set(key, current);
  });

  stats.trendData = Array.from(trendMap.entries()).map(([date, val]) => ({
    date,
    pagu: val.pagu,
    hps: val.hps,
    count: val.count
  }));

  // 3. Breakdown by Unit Kerja
  const unitMap = new Map<string, { pagu: number; count: number }>();
  data.forEach(item => {
    const unit = item.unitKerja || "Unknown";
    const current = unitMap.get(unit) || { pagu: 0, count: 0 };
    current.pagu += item.paguAnggaranAktif || 0;
    current.count += 1;
    unitMap.set(unit, current);
  });

  stats.byUnitKerja = Array.from(unitMap.entries())
    .map(([name, val]) => ({
      name,
      pagu: val.pagu,
      count: val.count,
      share: stats.totalPagu > 0 ? (val.pagu / stats.totalPagu) * 100 : 0
    }))
    .sort((a, b) => b.pagu - a.pagu)
    .slice(0, 5); // Top 5

  // 4. Breakdown by Method (using Uraian Mak Induk as proxy for category)
  const methodMap = new Map<string, { pagu: number; count: number }>();
  data.forEach(item => {
    const method = item.uraianMakInduk || "Lainnya";
    const current = methodMap.get(method) || { pagu: 0, count: 0 };
    current.pagu += item.paguAnggaranAktif || 0;
    current.count += 1;
    methodMap.set(method, current);
  });

  stats.byMethod = Array.from(methodMap.entries())
    .map(([name, val]) => ({
      name,
      pagu: val.pagu,
      count: val.count,
      share: stats.totalPagu > 0 ? (val.pagu / stats.totalPagu) * 100 : 0
    }))
    .sort((a, b) => b.pagu - a.pagu);

  // 5. Top Projects
  stats.topProjects = [...data]
    .sort((a, b) => (b.paguAnggaranAktif || 0) - (a.paguAnggaranAktif || 0))
    .slice(0, 5)
    .map(item => ({
      name: item.namaPaketPbj || "Unnamed Package",
      pagu: item.paguAnggaranAktif || 0,
      hps: item.hps || 0,
      unit: item.unitKerja || "-"
    }));

  return stats;
}
