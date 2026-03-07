import { useState, useMemo } from "react";
import {
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  Activity,
  Layers
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
import {
  Area,
  Bar,
  BarChart,
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

type OverviewModalType = "trend" | "breakdown" | "risk" | null;

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#6366f1"];

export function OverviewView({ isLoading, data }: CommonViewProps) {
  const [activeModal, setActiveModal] = useState<OverviewModalType>(null);
  
  const stats = useMemo(() => calculateUlpStats(data), [data]);

  const trendData = useMemo(() => {
    return stats.trendData.map(d => ({
      label: d.date,
      paguM: d.pagu,
      hpsM: d.hps,
      count: d.count,
      efficiency: d.pagu > 0 ? ((d.pagu - d.hps) / d.pagu) * 100 : 0
    }));
  }, [stats.trendData]);

  // Handle Modal Logic
  let modal = null;
  if (activeModal === "trend") {
    const headers = ["Tanggal", "Pagu (Rp)", "HPS (Rp)", "Paket", "Efisiensi (%)"];
    const rows = trendData.map((row) => [
      row.label,
      row.paguM,
      row.hpsM,
      row.count,
      row.efficiency.toFixed(2),
    ]);
    const handleExport = () => {
      const csvRows: CsvRow[] = trendData.map((row) => ({
        tanggal: row.label,
        pagu: row.paguM,
        hps: row.hpsM,
        jumlahPaket: row.count,
        efisiensiPct: row.efficiency,
      }));
      downloadCsv("overview-trend.csv", csvRows);
    };
    modal = (
      <DataModal
        title="Detail Trend Harian"
        description="Data harian Pagu, HPS, dan Efisiensi."
        headers={headers}
        rows={rows}
        onClose={() => setActiveModal(null)}
        onExport={handleExport}
        exportLabel="Export CSV"
      />
    );
  } else if (activeModal === "breakdown") {
    const headers = ["Unit Kerja", "Pagu (Rp)", "Jumlah Paket", "Share (%)"];
    const rows = stats.byUnitKerja.map((item) => [
      item.name,
      item.pagu,
      item.count,
      item.share.toFixed(2),
    ]);
    const handleExport = () => {
      const csvRows: CsvRow[] = stats.byUnitKerja.map((item) => ({
        unitKerja: item.name,
        pagu: item.pagu,
        jumlahPaket: item.count,
        share: item.share,
      }));
      downloadCsv("overview-breakdown.csv", csvRows);
    };
    modal = (
      <DataModal
        title="Detail Breakdown Unit Kerja"
        description="Statistik per Unit Kerja."
        headers={headers}
        rows={rows}
        onClose={() => setActiveModal(null)}
        onExport={handleExport}
        exportLabel="Export CSV"
      />
    );
  } else if (activeModal === "risk") { // Top Projects
    const headers = ["Nama Paket", "Unit Kerja", "Pagu (Rp)", "HPS (Rp)"];
    const rows = stats.topProjects.map((item) => [
      item.name,
      item.unit,
      item.pagu,
      item.hps,
    ]);
    const handleExport = () => {
      const csvRows: CsvRow[] = stats.topProjects.map((item) => ({
        namaPaket: item.name,
        unit: item.unit,
        pagu: item.pagu,
        hps: item.hps,
      }));
      downloadCsv("overview-top-projects.csv", csvRows);
    };
    modal = (
      <DataModal
        title="Top 5 Paket Terbesar"
        description="Paket dengan nilai Pagu tertinggi."
        headers={headers}
        rows={rows}
        onClose={() => setActiveModal(null)}
        onExport={handleExport}
        exportLabel="Export CSV"
      />
    );
  }

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

  return (
    <div className="space-y-4 p-1">
      {/* 1. KPI Cards Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Pagu Anggaran
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-24" /> : (
              <>
                <div className="text-2xl font-bold">{formatLargeCurrency(stats.totalPagu)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Dari {stats.totalPackages} paket terdaftar
                </p>
              </>
            )}
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total HPS
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-24" /> : (
              <>
                <div className="text-2xl font-bold">{formatLargeCurrency(stats.totalHps)}</div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center">
                  <span className="text-emerald-600 font-medium mr-1">
                    {(stats.totalPagu > 0 ? (stats.totalHps/stats.totalPagu)*100 : 0).toFixed(1)}%
                  </span>
                  rasio terhadap Pagu
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Penghematan
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {isLoading ? <Skeleton className="h-8 w-24" /> : (
              <>
                <div className="text-2xl font-bold text-emerald-600">{formatLargeCurrency(stats.totalSavings)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.savingsPercentage.toFixed(1)}% efisiensi anggaran
                </p>
              </>
             )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Metode Terbanyak
            </CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {isLoading ? <Skeleton className="h-8 w-24" /> : (
              <>
                <div className="text-lg font-bold truncate" title={stats.byMethod[0]?.name}>
                  {stats.byMethod[0]?.name || "-"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.byMethod[0]?.count || 0} paket ({stats.byMethod[0]?.share.toFixed(1)}% share)
                </p>
              </>
             )}
          </CardContent>
        </Card>
      </div>

      {/* 2. Main Chart & Breakdown Section */}
      <div className="grid gap-4 lg:grid-cols-7 lg:h-[450px]">
        {/* Main Trend Chart (Left - 4 cols) */}
        <Card className="col-span-4 flex flex-col shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Trend Realisasi Anggaran</CardTitle>
              <CardDescription>
                Perbandingan Pagu vs HPS dan Tingkat Efisiensi Harian
              </CardDescription>
            </div>
            <Button variant="outline" size="icon" onClick={() => setActiveModal("trend")}>
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="flex-1 min-h-0">
            {isLoading ? <Skeleton className="h-full w-full" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPagu" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="label" 
                    tick={{fontSize: 11, fill: '#64748b'}} 
                    axisLine={false} 
                    tickLine={false} 
                    minTickGap={30}
                  />
                  <YAxis 
                    yAxisId="left" 
                    tick={{fontSize: 11, fill: '#64748b'}} 
                    axisLine={false} 
                    tickLine={false}
                    tickFormatter={(value) => `${(value / 1_000_000_000).toFixed(0)}M`}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    tick={{fontSize: 11, fill: '#64748b'}} 
                    axisLine={false} 
                    tickLine={false}
                    unit="%"
                    domain={[0, 'auto']}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: any, name: any) => {
                      if (name === "Efisiensi") return [`${Number(value).toFixed(2)}%`, name];
                      return [`Rp ${Number(value).toLocaleString('id-ID')}`, name];
                    }}
                    labelStyle={{ color: '#64748b', marginBottom: '0.5rem' }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Area 
                    yAxisId="left" 
                    type="monotone" 
                    dataKey="paguM" 
                    name="Pagu" 
                    stroke="#3b82f6" 
                    fillOpacity={1} 
                    fill="url(#colorPagu)" 
                    strokeWidth={2}
                  />
                  <Bar 
                    yAxisId="left" 
                    dataKey="hpsM" 
                    name="HPS" 
                    fill="#10b981" 
                    radius={[4, 4, 0, 0]} 
                    barSize={12} 
                    fillOpacity={0.8}
                  />
                  <Line 
                    yAxisId="right" 
                    type="monotone" 
                    dataKey="efficiency" 
                    name="Efisiensi" 
                    stroke="#f59e0b" 
                    strokeWidth={2} 
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Breakdown Charts (Right - 3 cols) */}
        <div className="col-span-3 grid grid-rows-2 gap-4">
          {/* Pie Chart: Method */}
          <Card className="shadow-sm flex flex-col">
            <CardHeader className="pb-2">
               <CardTitle className="text-sm">Komposisi Metode Pengadaan</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 flex items-center justify-center">
              {isLoading ? <Skeleton className="h-full w-full rounded-full" /> : (
                <div className="w-full h-full flex items-center">
                   <div className="w-1/2 h-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={stats.byMethod}
                            cx="50%"
                            cy="50%"
                            innerRadius={35}
                            outerRadius={55}
                            paddingAngle={2}
                            dataKey="pagu"
                          >
                            {stats.byMethod.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                             formatter={(value: any) => formatCurrency(value)}
                             contentStyle={{ fontSize: '12px', borderRadius: '8px' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                   </div>
                   <div className="w-1/2 text-xs space-y-1 overflow-y-auto max-h-[140px] pr-2">
                      {stats.byMethod.map((entry, index) => (
                        <div key={index} className="flex items-center justify-between">
                           <div className="flex items-center gap-1.5 truncate max-w-[100px]" title={entry.name}>
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                              <span className="truncate">{entry.name}</span>
                           </div>
                           <span className="font-medium">{entry.share.toFixed(0)}%</span>
                        </div>
                      ))}
                   </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bar Chart: Unit Kerja */}
          <Card className="shadow-sm flex flex-col">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
               <CardTitle className="text-sm">Top 5 Unit Kerja (by Pagu)</CardTitle>
               <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setActiveModal("breakdown")}>
                  <ArrowUpRight className="h-3 w-3" />
               </Button>
            </CardHeader>
            <CardContent className="flex-1 min-h-0">
               {isLoading ? <Skeleton className="h-full w-full" /> : (
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart
                      layout="vertical"
                      data={stats.byUnitKerja.slice(0, 5)}
                      margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
                      barSize={16}
                   >
                     <XAxis type="number" hide />
                     <YAxis 
                       type="category" 
                       dataKey="name" 
                       width={100} 
                       tick={{ fontSize: 10, fill: '#64748b' }}
                       tickFormatter={(val) => val.length > 15 ? val.substring(0, 15) + '...' : val}
                       interval={0}
                     />
                     <Tooltip 
                       cursor={{ fill: 'transparent' }}
                       contentStyle={{ fontSize: '12px', borderRadius: '8px' }}
                       formatter={(val: any) => formatCurrency(val)}
                     />
                     <Bar dataKey="pagu" radius={[0, 4, 4, 0]}>
                       {stats.byUnitKerja.slice(0, 5).map((_, index) => (
                         <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                       ))}
                     </Bar>
                   </BarChart>
                 </ResponsiveContainer>
               )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 3. Bottom Table Section */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>Top 5 Paket Terbesar</CardTitle>
            <CardDescription>Berdasarkan Nilai Pagu Anggaran</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => setActiveModal("risk")}>
            Lihat Semua
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? <Skeleton className="h-32 w-full" /> : (
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground">Nama Paket</th>
                    <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground">Unit Kerja</th>
                    <th className="h-10 px-2 text-right align-middle font-medium text-muted-foreground">Pagu</th>
                    <th className="h-10 px-2 text-right align-middle font-medium text-muted-foreground">HPS</th>
                    <th className="h-10 px-2 text-right align-middle font-medium text-muted-foreground">Efisiensi</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {stats.topProjects.map((project, idx) => {
                     const efficiency = project.pagu > 0 ? ((project.pagu - project.hps) / project.pagu) * 100 : 0;
                     return (
                      <tr key={idx} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                        <td className="p-2 align-middle font-medium max-w-[200px] truncate" title={project.name}>
                          {project.name}
                        </td>
                        <td className="p-2 align-middle max-w-[150px] truncate" title={project.unit}>
                          {project.unit}
                        </td>
                        <td className="p-2 align-middle text-right">{formatLargeCurrency(project.pagu)}</td>
                        <td className="p-2 align-middle text-right">{formatLargeCurrency(project.hps)}</td>
                        <td className="p-2 align-middle text-right">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${efficiency > 10 ? 'bg-emerald-100 text-emerald-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {efficiency.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
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
