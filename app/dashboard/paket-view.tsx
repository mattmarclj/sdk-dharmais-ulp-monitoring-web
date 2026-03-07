import { useState, useMemo } from "react";
import {
  Search,
  ArrowUpRight,
  Package,
  DollarSign,
  TrendingUp,
  ArrowUpDown
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Bar,
  CartesianGrid,
  Cell,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ComposedChart,
  Legend,
  PieChart,
  Pie,
} from "recharts";

import {
  CommonViewProps,
  DataModal,
  downloadCsv,
  type CsvRow,
} from "./common";
import { calculateUlpStats } from "./ulp-stats";

type PaketModalType = "trend" | "range" | null;

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#6366f1"];

export function PaketView({ isLoading, data }: CommonViewProps) {
  const [activeModal, setActiveModal] = useState<PaketModalType>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const stats = useMemo(() => calculateUlpStats(data), [data]);

  // Monthly Trend Calculation
  const monthlyTrend = useMemo(() => {
    const map = new Map<string, { date: Date, count: number, pagu: number }>();
    data.forEach(item => {
      if (!item.tanggalDpp) return;
      const key = item.tanggalDpp.toLocaleString('id-ID', { month: 'short', year: 'numeric' });
      const current = map.get(key) || { date: item.tanggalDpp, count: 0, pagu: 0 };
      current.count += 1;
      current.pagu += item.paguAnggaranAktif || 0;
      map.set(key, current);
    });
    
    return Array.from(map.entries())
      .map(([label, val]) => ({
        label,
        date: val.date,
        count: val.count,
        pagu: val.pagu,
        avgPagu: val.count > 0 ? val.pagu / val.count : 0
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [data]);

  // Price Range Distribution
  const priceRanges = useMemo(() => {
    const ranges = [
      { name: "< 200 Juta", min: 0, max: 200_000_000, count: 0, pagu: 0 },
      { name: "200 Juta - 2.5 M", min: 200_000_000, max: 2_500_000_000, count: 0, pagu: 0 },
      { name: "2.5 M - 50 M", min: 2_500_000_000, max: 50_000_000_000, count: 0, pagu: 0 },
      { name: "> 50 M", min: 50_000_000_000, max: Infinity, count: 0, pagu: 0 },
    ];

    data.forEach(item => {
      const val = item.paguAnggaranAktif || 0;
      const range = ranges.find(r => val >= r.min && val < r.max);
      if (range) {
        range.count++;
        range.pagu += val;
      }
    });

    return ranges.filter(r => r.count > 0);
  }, [data]);

  // Filtered & Sorted List
  const filteredPackages = useMemo(() => {
    let result = [...data];
    
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(item => 
        (item.namaPaketPbj || "").toLowerCase().includes(lower) ||
        (item.unitKerja || "").toLowerCase().includes(lower) ||
        (item.noAgenda || "").toLowerCase().includes(lower)
      );
    }

    if (sortConfig) {
      result.sort((a, b) => {
        let valA: any = a[sortConfig.key as keyof typeof a];
        let valB: any = b[sortConfig.key as keyof typeof b];

        if (sortConfig.key === 'pagu') {
           valA = a.paguAnggaranAktif || 0;
           valB = b.paguAnggaranAktif || 0;
        }

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    } else {
      // Default sort by date desc
      result.sort((a, b) => (b.tanggalDpp?.getTime() || 0) - (a.tanggalDpp?.getTime() || 0));
    }

    return result.slice(0, 50); // Limit for performance
  }, [data, searchTerm, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig(current => {
      if (current?.key === key) {
        return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'desc' };
    });
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
      notation: "compact", 
      compactDisplay: "short"
    }).format(val);
  };

  const formatLargeCurrency = (val: number) => {
     return `Rp ${(val / 1_000_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} M`;
  }

  // Modals
  let modal = null;
  if (activeModal === "trend") {
    const headers = ["Bulan", "Jumlah Paket", "Total Pagu (Rp)", "Rata-rata (Rp)"];
    const rows = monthlyTrend.map(row => [
      row.label,
      row.count,
      row.pagu,
      row.avgPagu.toFixed(0)
    ]);
    const handleExport = () => {
       const csvRows: CsvRow[] = monthlyTrend.map(row => ({
          bulan: row.label,
          jumlah: row.count,
          pagu: row.pagu,
          rataRata: row.avgPagu
       }));
       downloadCsv("paket-trend-bulanan.csv", csvRows);
    };
    modal = (
       <DataModal 
          title="Trend Bulanan" 
          description="Statistik paket per bulan" 
          headers={headers} 
          rows={rows} 
          onClose={() => setActiveModal(null)} 
          onExport={handleExport}
          exportLabel="Export CSV"
       />
    );
  } else if (activeModal === "range") {
     const headers = ["Range Nilai", "Jumlah Paket", "Total Pagu (Rp)"];
     const rows = priceRanges.map(row => [
        row.name,
        row.count,
        row.pagu
     ]);
     const handleExport = () => {
        const csvRows: CsvRow[] = priceRanges.map(row => ({
           range: row.name,
           jumlah: row.count,
           pagu: row.pagu
        }));
        downloadCsv("paket-price-range.csv", csvRows);
     };
     modal = (
        <DataModal 
           title="Distribusi Nilai Paket" 
           description="Pengelompokan paket berdasarkan range nilai pagu" 
           headers={headers} 
           rows={rows} 
           onClose={() => setActiveModal(null)} 
           onExport={handleExport}
           exportLabel="Export CSV"
        />
     );
  }

  return (
    <div className="space-y-4 p-1">
      {/* 1. KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Paket</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-24" /> : (
              <>
                <div className="text-2xl font-bold">{stats.totalPackages}</div>
                <p className="text-xs text-muted-foreground mt-1">Paket terdaftar</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Nilai Pagu</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-24" /> : (
              <>
                <div className="text-2xl font-bold">{formatLargeCurrency(stats.totalPagu)}</div>
                <p className="text-xs text-muted-foreground mt-1">Akumulasi seluruh paket</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rata-rata Nilai</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-24" /> : (
              <>
                <div className="text-2xl font-bold">{formatCurrency(stats.totalPackages > 0 ? stats.totalPagu / stats.totalPackages : 0)}</div>
                <p className="text-xs text-muted-foreground mt-1">Per paket pengadaan</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Paket Terbesar</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-24" /> : (
              <>
                <div className="text-lg font-bold truncate" title={stats.topProjects[0]?.name}>
                   {formatLargeCurrency(stats.topProjects[0]?.pagu || 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1 truncate" title={stats.topProjects[0]?.name}>
                   {stats.topProjects[0]?.name || "-"}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 2. Charts Section */}
      <div className="grid gap-4 lg:grid-cols-7 lg:h-[400px]">
         {/* Monthly Trend */}
         <Card className="col-span-4 flex flex-col shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
               <div>
                  <CardTitle>Trend Bulanan</CardTitle>
                  <CardDescription>Volume dan Nilai Paket per Bulan</CardDescription>
               </div>
               <Button variant="outline" size="icon" onClick={() => setActiveModal("trend")}>
                  <ArrowUpRight className="h-4 w-4" />
               </Button>
            </CardHeader>
            <CardContent className="flex-1 min-h-0">
               {isLoading ? <Skeleton className="h-full w-full" /> : (
                  <ResponsiveContainer width="100%" height="100%">
                     <ComposedChart data={monthlyTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="label" tick={{fontSize: 11, fill: '#64748b'}} axisLine={false} tickLine={false} />
                        <YAxis yAxisId="left" tick={{fontSize: 11, fill: '#64748b'}} axisLine={false} tickLine={false} />
                        <YAxis yAxisId="right" orientation="right" tick={{fontSize: 11, fill: '#64748b'}} axisLine={false} tickLine={false} tickFormatter={(val) => formatCurrency(val)} />
                        <Tooltip 
                           contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                           formatter={(value: any, name: any) => {
                              if (name === "pagu") return [formatCurrency(value), "Total Pagu"];
                              return [value, "Jumlah Paket"];
                           }}
                        />
                        <Legend verticalAlign="top" height={36} iconType="circle" />
                        <Bar yAxisId="left" dataKey="count" name="count" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                        <Line yAxisId="right" type="monotone" dataKey="pagu" name="pagu" stroke="#f59e0b" strokeWidth={2} dot={{r: 3}} />
                     </ComposedChart>
                  </ResponsiveContainer>
               )}
            </CardContent>
         </Card>

         {/* Price Range Distribution */}
         <Card className="col-span-3 flex flex-col shadow-sm">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
               <CardTitle>Distribusi Nilai Paket</CardTitle>
               <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setActiveModal("range")}>
                  <ArrowUpRight className="h-3 w-3" />
               </Button>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 flex items-center justify-center">
               {isLoading ? <Skeleton className="h-full w-full" /> : (
                  <div className="w-full h-full flex items-center">
                     <div className="w-1/2 h-full">
                        <ResponsiveContainer width="100%" height="100%">
                           <PieChart>
                              <Pie
                                 data={priceRanges}
                                 cx="50%"
                                 cy="50%"
                                 innerRadius={40}
                                 outerRadius={60}
                                 paddingAngle={2}
                                 dataKey="count"
                              >
                                 {priceRanges.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                 ))}
                              </Pie>
                              <Tooltip formatter={(val: any) => val + " Paket"} contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
                           </PieChart>
                        </ResponsiveContainer>
                     </div>
                     <div className="w-1/2 text-xs space-y-2">
                        {priceRanges.map((entry, index) => (
                           <div key={index} className="flex items-center justify-between pr-4">
                              <div className="flex items-center gap-2">
                                 <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                 <span>{entry.name}</span>
                              </div>
                              <span className="font-semibold">{entry.count}</span>
                           </div>
                        ))}
                     </div>
                  </div>
               )}
            </CardContent>
         </Card>
      </div>

      {/* 3. Data Table Section */}
      <Card className="shadow-sm">
         <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
               <div>
                  <CardTitle>Daftar Paket Pengadaan</CardTitle>
                  <CardDescription>Menampilkan {filteredPackages.length} paket terbaru</CardDescription>
               </div>
               <div className="relative w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                     type="text"
                     placeholder="Cari nama paket, unit..."
                     className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 pl-8 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                  />
               </div>
            </div>
         </CardHeader>
         <CardContent>
            {isLoading ? <Skeleton className="h-48 w-full" /> : (
               <div className="relative w-full overflow-auto rounded-md border">
                  <table className="w-full caption-bottom text-sm">
                     <thead className="bg-muted/50 [&_tr]:border-b">
                        <tr className="border-b transition-colors data-[state=selected]:bg-muted">
                           <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => handleSort('tanggalDpp')}>
                              <div className="flex items-center gap-1">Tanggal <ArrowUpDown className="h-3 w-3" /></div>
                           </th>
                           <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Unit Kerja</th>
                           <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Nama Paket</th>
                           <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Metode</th>
                           <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => handleSort('pagu')}>
                              <div className="flex items-center justify-end gap-1">Pagu <ArrowUpDown className="h-3 w-3" /></div>
                           </th>
                        </tr>
                     </thead>
                     <tbody className="[&_tr:last-child]:border-0">
                        {filteredPackages.map((item, i) => (
                           <tr key={i} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                              <td className="p-4 align-middle whitespace-nowrap text-muted-foreground">
                                 {item.tanggalDpp?.toLocaleDateString("id-ID") || "-"}
                              </td>
                              <td className="p-4 align-middle font-medium text-emerald-700 whitespace-nowrap max-w-[150px] truncate" title={item.unitKerja}>
                                 {item.unitKerja}
                              </td>
                              <td className="p-4 align-middle font-medium max-w-[300px] truncate" title={item.namaPaketPbj}>
                                 {item.namaPaketPbj}
                                 <div className="text-[10px] text-muted-foreground mt-0.5">{item.noAgenda}</div>
                              </td>
                              <td className="p-4 align-middle text-muted-foreground max-w-[150px] truncate">
                                 <Badge variant="outline" className="text-[10px] font-normal">
                                    {item.uraianMakInduk || "Lainnya"}
                                 </Badge>
                              </td>
                              <td className="p-4 align-middle text-right font-medium">
                                 {formatCurrency(item.paguAnggaranAktif || 0)}
                              </td>
                           </tr>
                        ))}
                        {filteredPackages.length === 0 && (
                           <tr>
                              <td colSpan={5} className="p-8 text-center text-muted-foreground">
                                 Tidak ada paket ditemukan
                              </td>
                           </tr>
                        )}
                     </tbody>
                  </table>
               </div>
            )}
         </CardContent>
      </Card>
      
      {modal}
    </div>
  );
}
