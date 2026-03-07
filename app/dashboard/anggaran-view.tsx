import { useState, useMemo } from "react";
import { ListOrdered, Wallet, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
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
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  BarListPlaceholder,
  CommonViewProps,
  KpiStat,
  DataModal,
  downloadCsv,
  type CsvRow,
} from "./common";
import { calculateUlpStats } from "./ulp-stats";

export function AnggaranView({ isLoading, data }: CommonViewProps) {
  const [activeModal, setActiveModal] = useState<
    "trend" | "unit" | "top-projects" | null
  >(null);

  const stats = useMemo(() => calculateUlpStats(data), [data]);

  const trendData = stats.trendData.map(d => ({
    label: d.date,
    pagu: d.pagu,
    hps: d.hps,
    saving: d.pagu - d.hps
  }));

  // Helper for rendering currency
  const fmtMoney = (val: number) => 
    "Rp " + (val / 1_000_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 }) + " M";

  // Calculate top savings projects
  const topSavings = useMemo(() => {
    return [...data]
      .map(d => ({
        name: d.namaPaketPbj || "Unnamed",
        unit: d.unitKerja || "-",
        pagu: d.paguAnggaranAktif || 0,
        hps: d.hps || 0,
        saving: (d.paguAnggaranAktif || 0) - (d.hps || 0)
      }))
      .sort((a, b) => b.saving - a.saving)
      .slice(0, 5);
  }, [data]);

  let modal = null;

  if (activeModal === "trend") {
    const headers = ["Tanggal", "Total Pagu", "Total HPS", "Selisih (Hemat)"];
    const rows = trendData.map((row) => [
      row.label,
      row.pagu.toLocaleString("id-ID"),
      row.hps.toLocaleString("id-ID"),
      row.saving.toLocaleString("id-ID"),
    ]);
    const handleExport = () => {
      const csvRows: CsvRow[] = trendData.map((row) => ({
        tanggal: row.label,
        pagu: row.pagu,
        hps: row.hps,
        selisih: row.saving,
      }));
      downloadCsv("ulp-trend-anggaran.csv", csvRows);
    };

    modal = (
      <DataModal
        title="Detail Trend Anggaran"
        description="Perbandingan Pagu vs HPS Harian."
        headers={headers}
        rows={rows}
        onClose={() => setActiveModal(null)}
        onExport={handleExport}
        exportLabel="Export CSV"
      />
    );
  } else if (activeModal === "unit") {
    const headers = ["Unit Kerja", "Total Pagu", "Jumlah Paket", "Share (%)"];
    const rows = stats.byUnitKerja.map((item) => [
      item.name,
      item.pagu.toLocaleString("id-ID"),
      item.count,
      item.share.toFixed(1),
    ]);
    const handleExport = () => {
      const csvRows: CsvRow[] = stats.byUnitKerja.map((item) => ({
        unitKerja: item.name,
        totalPagu: item.pagu,
        jumlahPaket: item.count,
        share: item.share,
      }));
      downloadCsv("ulp-anggaran-unit-kerja.csv", csvRows);
    };

    modal = (
      <DataModal
        title="Anggaran per Unit Kerja"
        description="Distribusi pagu anggaran berdasarkan unit kerja."
        headers={headers}
        rows={rows}
        onClose={() => setActiveModal(null)}
        onExport={handleExport}
        exportLabel="Export CSV"
      />
    );
  } else if (activeModal === "top-projects") {
    const headers = ["Nama Paket", "Unit Kerja", "Pagu", "HPS", "Selisih (Hemat)"];
    const rows = topSavings.map((item) => [
      item.name,
      item.unit,
      item.pagu.toLocaleString("id-ID"),
      item.hps.toLocaleString("id-ID"),
      item.saving.toLocaleString("id-ID"),
    ]);
    const handleExport = () => {
      const csvRows: CsvRow[] = topSavings.map((item) => ({
        namaPaket: item.name,
        unitKerja: item.unit,
        pagu: item.pagu,
        hps: item.hps,
        saving: item.saving,
      }));
      downloadCsv("ulp-top-efisiensi.csv", csvRows);
    };

    modal = (
      <DataModal
        title="Top Efisiensi Paket"
        description="Paket dengan selisih Pagu dan HPS terbesar."
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
        {/* Row 1: Budget Trend & KPIs */}
        <Card className="flex flex-col lg:col-span-8 lg:row-span-1">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <div>
              <CardTitle>Analisa Anggaran & Efisiensi</CardTitle>
              <CardDescription>
                Monitoring Pagu vs HPS dan potensi penghematan
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setActiveModal("trend")}
            >
              <ListOrdered className="mr-1 h-3 w-3" />
              Detail & Export
            </Button>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-2">
            <div className="grid gap-3 text-xs md:grid-cols-4">
              <KpiStat
                label="Total Pagu"
                value={fmtMoney(stats.totalPagu)}
                helper="Ceiling anggaran"
                tone="neutral"
                icon={Wallet}
              />
              <KpiStat
                label="Total HPS"
                value={fmtMoney(stats.totalHps)}
                helper="Harga Perkiraan"
                tone="neutral"
                icon={DollarSign}
              />
              <KpiStat
                label="Potensi Hemat"
                value={fmtMoney(stats.totalSavings)}
                helper="Selisih Pagu - HPS"
                tone="positive"
                icon={TrendingUp}
              />
              <KpiStat
                label="Rasio Efisiensi"
                value={`${stats.savingsPercentage.toFixed(1)}%`}
                helper="% Penghematan"
                tone={stats.savingsPercentage > 0 ? "positive" : "negative"}
                icon={stats.savingsPercentage > 0 ? TrendingUp : TrendingDown}
              />
            </div>
            {isLoading ? (
              <Skeleton className="mt-1 h-40 w-full" />
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs text-[#5B6B7F]">
                  <span>Grafik Perbandingan Pagu vs HPS</span>
                  <span>
                    {trendData.length > 0 ? `${trendData.length} hari data` : "Tidak ada data"}
                  </span>
                </div>
                <div className="h-40 overflow-hidden rounded-xl bg-[#F7FBFF] p-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={trendData}
                      margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid
                        stroke="#e5edff"
                        strokeDasharray="3 3"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="label"
                        tick={{ fill: "#64748b", fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        tick={{ fill: "#64748b", fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(val) => (val / 1_000_000_000).toFixed(0) + "M"}
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
                        formatter={(value: any) => ["Rp " + (Number(value) || 0).toLocaleString("id-ID"), ""]}
                      />
                      <Legend 
                        iconType="circle" 
                        wrapperStyle={{ fontSize: "11px", paddingTop: "5px" }}
                      />
                      <Bar
                        dataKey="pagu"
                        radius={[4, 4, 0, 0]}
                        name="Pagu Anggaran"
                        fill="#3b82f6"
                        barSize={20}
                      />
                      <Bar
                        dataKey="hps"
                        radius={[4, 4, 0, 0]}
                        name="HPS"
                        fill="#10b981"
                        barSize={20}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Row 1: Top Units by Pagu */}
        <Card className="flex flex-col lg:col-span-4 lg:row-span-1">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <div>
              <CardTitle>Unit Pagu Terbesar</CardTitle>
              <CardDescription>Top unit kerja by Pagu</CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setActiveModal("unit")}
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
                title="Unit Kerja"
                items={stats.byUnitKerja.map((item) => ({
                  label: item.name,
                  primary: parseFloat(item.share.toFixed(1)),
                  secondary: item.share,
                }))}
              />
            )}
          </CardContent>
        </Card>

        {/* Row 2: Top Savings Projects */}
        <Card className="flex flex-col lg:col-span-6 lg:row-span-1">
           <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <div>
              <CardTitle>Top Efisiensi (Hemat)</CardTitle>
              <CardDescription>Paket dengan selisih Pagu-HPS terbesar</CardDescription>
            </div>
             <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setActiveModal("top-projects")}
            >
              <ListOrdered className="mr-1 h-3 w-3" />
              Detail
            </Button>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto">
             {isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <div className="space-y-4">
                {topSavings.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex flex-col gap-0.5 max-w-[60%]">
                      <span className="font-medium text-[#0B1E33] truncate" title={item.name}>
                        {item.name}
                      </span>
                      <span className="text-[10px] text-[#5B6B7F] truncate">{item.unit}</span>
                    </div>
                    <div className="flex flex-col items-end gap-0.5">
                      <span className="font-bold text-emerald-600">
                        {fmtMoney(item.saving)}
                      </span>
                      <span className="text-[10px] text-[#5B6B7F]">
                        Pagu: {fmtMoney(item.pagu)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Row 2: Budget Composition (Method) */}
        <Card className="flex flex-col lg:col-span-6 lg:row-span-1">
          <CardHeader className="pb-2">
            <CardTitle>Distribusi Jenis Belanja</CardTitle>
            <CardDescription>
              Proporsi anggaran berdasarkan metode/jenis belanja
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden">
             {isLoading ? (
               <Skeleton className="h-full w-full" />
            ) : (
              <BarListPlaceholder
                title="Metode / MAK"
                items={stats.byMethod.slice(0, 5).map((item) => ({
                  label: item.name,
                  primary: parseFloat(item.share.toFixed(1)),
                  secondary: item.share,
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
