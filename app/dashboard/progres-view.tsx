import { useState, useMemo } from "react";
import { ListOrdered, Clock, CheckCircle2, AlertCircle, Users } from "lucide-react";
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
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Legend
} from "recharts";

import {
  BarListPlaceholder,
  CommonViewProps,
  KpiStat,
  DataModal,
  downloadCsv,
  type CsvRow,
} from "./common";

export function ProgresView({ isLoading, data }: CommonViewProps) {
  const [activeModal, setActiveModal] = useState<
    "aging" | "pokja" | "status" | null
  >(null);

  const stats = useMemo(() => {
    let hasHps = 0;
    let noHps = 0;
    let totalDays = 0;
    let validDates = 0;
    const agingBuckets = { "< 7 Hari": 0, "7-14 Hari": 0, "15-30 Hari": 0, "> 30 Hari": 0 };
    const pokjaMap = new Map<string, number>();

    data.forEach(d => {
      // HPS Status
      if ((d.hps || 0) > 0) hasHps++; else noHps++;

      // Duration (Surat End User -> Diterima DPP)
      if (d.tanggalDiterimaDpp && d.tanggalSuratEndUser) {
        const diffTime = d.tanggalDiterimaDpp.getTime() - d.tanggalSuratEndUser.getTime();
        const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        totalDays += diffDays;
        validDates++;

        if (diffDays < 7) agingBuckets["< 7 Hari"]++;
        else if (diffDays <= 14) agingBuckets["7-14 Hari"]++;
        else if (diffDays <= 30) agingBuckets["15-30 Hari"]++;
        else agingBuckets["> 30 Hari"]++;
      }

      // Pokja
      const pokja = d.pokjaBelanjaModal || d.pokjaBelanjaOprs || "Belum Ditunjuk";
      // Split multiple pokja if separated by comma or semicolon? Assuming single string for now.
      // Clean up pokja name
      const cleanPokja = pokja.trim().replace(/^Pokja\s+/i, "");
      pokjaMap.set(cleanPokja, (pokjaMap.get(cleanPokja) || 0) + 1);
    });

    const avgDuration = validDates > 0 ? totalDays / validDates : 0;
    
    // Sort Pokja
    const pokjaList = Array.from(pokjaMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return { hasHps, noHps, avgDuration, agingBuckets, pokjaList, total: data.length };
  }, [data]);

  const agingData = [
    { label: "< 7 Hari", value: stats.agingBuckets["< 7 Hari"], fill: "#10b981" },
    { label: "7-14 Hari", value: stats.agingBuckets["7-14 Hari"], fill: "#3b82f6" },
    { label: "15-30 Hari", value: stats.agingBuckets["15-30 Hari"], fill: "#f59e0b" },
    { label: "> 30 Hari", value: stats.agingBuckets["> 30 Hari"], fill: "#ef4444" },
  ];

  const statusData = [
    { name: "Lengkap (Ada HPS)", value: stats.hasHps, color: "#10b981" },
    { name: "Belum Ada HPS", value: stats.noHps, color: "#f59e0b" },
  ];

  let modal = null;

  if (activeModal === "aging") {
    const headers = ["Durasi Proses", "Jumlah Paket"];
    const rows = agingData.map((row) => [
      row.label,
      row.value,
    ]);
    const handleExport = () => {
      const csvRows: CsvRow[] = agingData.map((row) => ({
        durasi: row.label,
        jumlahPaket: row.value,
      }));
      downloadCsv("ulp-durasi-proses.csv", csvRows);
    };

    modal = (
      <DataModal
        title="Detail Durasi Proses"
        description="Distribusi durasi dari Surat End User hingga Diterima DPP."
        headers={headers}
        rows={rows}
        onClose={() => setActiveModal(null)}
        onExport={handleExport}
        exportLabel="Export CSV"
      />
    );
  } else if (activeModal === "pokja") {
    const headers = ["Nama Pokja / Tim", "Jumlah Paket", "Share (%)"];
    const rows = stats.pokjaList.map((item) => [
      item.name,
      item.count,
      ((item.count / stats.total) * 100).toFixed(1),
    ]);
    const handleExport = () => {
      const csvRows: CsvRow[] = stats.pokjaList.map((item) => ({
        pokja: item.name,
        jumlahPaket: item.count,
        share: ((item.count / stats.total) * 100).toFixed(1),
      }));
      downloadCsv("ulp-beban-kerja-pokja.csv", csvRows);
    };

    modal = (
      <DataModal
        title="Beban Kerja Pokja"
        description="Jumlah paket yang ditangani oleh masing-masing Pokja."
        headers={headers}
        rows={rows}
        onClose={() => setActiveModal(null)}
        onExport={handleExport}
        exportLabel="Export CSV"
      />
    );
  } else if (activeModal === "status") {
    const headers = ["Status Kelengkapan", "Jumlah Paket"];
    const rows = statusData.map((item) => [
      item.name,
      item.value,
    ]);
    const handleExport = () => {
      const csvRows: CsvRow[] = statusData.map((item) => ({
        status: item.name,
        jumlahPaket: item.value,
      }));
      downloadCsv("ulp-status-kelengkapan.csv", csvRows);
    };

    modal = (
      <DataModal
        title="Status Kelengkapan Data"
        description="Proporsi paket berdasarkan ketersediaan HPS."
        headers={headers}
        rows={rows}
        onClose={() => setActiveModal(null)}
        onExport={handleExport}
        exportLabel="Export CSV"
      />
    );
  }

  return (
    <>
      <div className="grid h-full gap-3 lg:grid-cols-12 lg:grid-rows-[0.55fr_0.45fr] overflow-y-auto pb-4">
        {/* Row 1: Aging Analysis */}
        <Card className="flex flex-col lg:col-span-8 lg:row-span-1">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <div>
              <CardTitle>Analisa Status & Durasi</CardTitle>
              <CardDescription>
                Monitoring lead time dan kelengkapan berkas
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setActiveModal("aging")}
            >
              <ListOrdered className="mr-1 h-3 w-3" />
              Detail & Export
            </Button>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-2">
            <div className="grid gap-3 text-xs md:grid-cols-4">
              <KpiStat
                label="Total Permohonan"
                value={stats.total.toLocaleString("id-ID")}
                helper="Paket masuk"
                tone="neutral"
                icon={ListOrdered}
              />
              <KpiStat
                label="Siap Proses"
                value={stats.hasHps.toLocaleString("id-ID")}
                helper="Lengkap (Ada HPS)"
                tone="positive"
                icon={CheckCircle2}
              />
              <KpiStat
                label="Belum Lengkap"
                value={stats.noHps.toLocaleString("id-ID")}
                helper="Tanpa HPS"
                tone="warning"
                icon={AlertCircle}
              />
              <KpiStat
                label="Rata-rata Durasi"
                value={`${stats.avgDuration.toFixed(0)} Hari`}
                helper="End User ke DPP"
                tone="neutral"
                icon={Clock}
              />
            </div>
            {isLoading ? (
              <Skeleton className="mt-1 h-40 w-full" />
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs text-[#5B6B7F]">
                  <span>Distribusi Durasi Proses (Hari)</span>
                  <span>Total {stats.total} paket</span>
                </div>
                <div className="h-40 overflow-hidden rounded-xl bg-[#F7FBFF] p-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={agingData}
                      layout="vertical"
                      margin={{ top: 0, right: 30, left: 20, bottom: 0 }}
                    >
                      <CartesianGrid
                        stroke="#e5edff"
                        strokeDasharray="3 3"
                        horizontal={false}
                      />
                      <XAxis
                        type="number"
                        tick={{ fill: "#64748b", fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="label"
                        tick={{ fill: "#64748b", fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                        width={70}
                      />
                      <Tooltip
                        cursor={{ fill: "#e5edff66" }}
                        contentStyle={{
                          backgroundColor: "#0B1E33",
                          borderRadius: 12,
                          border: "1px solid #1E3A8A",
                          fontSize: 11,
                          color: "#E5EEFF",
                        }}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {agingData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Row 1: Status Distribution (Pie) */}
        <Card className="flex flex-col lg:col-span-4 lg:row-span-1">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <div>
              <CardTitle>Status Kelengkapan</CardTitle>
              <CardDescription>Rasio paket dengan HPS</CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setActiveModal("status")}
            >
              <ListOrdered className="mr-1 h-3 w-3" />
              Detail
            </Button>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            {isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <div className="relative h-full w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: "#0B1E33",
                        borderRadius: 12,
                        border: "1px solid #1E3A8A",
                        fontSize: 11,
                        color: "#E5EEFF",
                      }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36} 
                      wrapperStyle={{ fontSize: "11px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <span className="text-2xl font-bold text-[#0B1E33]">
                      {((stats.hasHps / stats.total) * 100).toFixed(0)}%
                    </span>
                    <p className="text-[10px] text-[#5B6B7F]">Siap Proses</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Row 2: Pokja Workload */}
        <Card className="flex flex-col lg:col-span-12 lg:row-span-1">
           <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <div>
              <CardTitle>Beban Kerja Pokja / Tim</CardTitle>
              <CardDescription>Distribusi paket per tim pengadaan</CardDescription>
            </div>
             <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setActiveModal("pokja")}
            >
              <ListOrdered className="mr-1 h-3 w-3" />
              Detail
            </Button>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto">
             {isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <BarListPlaceholder
                title="Tim Pokja"
                items={stats.pokjaList.slice(0, 10).map((item) => ({
                  label: item.name || "Belum Ditunjuk",
                  primary: parseFloat(((item.count / stats.total) * 100).toFixed(1)),
                  secondary: ((item.count / stats.total) * 100),
                }))}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {modal}
    </>
  );
}
