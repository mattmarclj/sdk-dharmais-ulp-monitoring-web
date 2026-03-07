
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const CSV_FILE_PATH = path.join(process.cwd(), "public", "ulp-data-dharmais.csv");

// Helper to escape CSV values
const toCsvValue = (value: any) => {
  if (value === null || value === undefined) return "";
  const stringValue = String(value);
  if (stringValue.includes('"') || stringValue.includes(";") || stringValue.includes("\n")) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

// Helper to format Date to dd-Mon-yy (e.g. 20-Nov-24)
const formatDate = (dateStr: string | Date | null) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  
  const day = d.getDate();
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = months[d.getMonth()];
  const year = d.getFullYear().toString().slice(-2);
  
  return `${day}-${month}-${year}`;
};

// Helper to format Currency (remove formatting for CSV storage if needed, or keep as is? 
// The original CSV has numbers like "6,876,713,444". Let's try to keep that format or just raw numbers.
// The data-loader parses "6,876,713,444" by removing commas. 
// So when writing back, we should probably format it back to "6,876,713,444" or just write raw number?
// Let's write raw number or formatted? The original file has formatted numbers. 
// To match original style, let's format it.
const formatCurrency = (val: number | string) => {
  if (!val) return "0";
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num)) return "0";
  return num.toLocaleString('en-US'); // en-US uses commas for thousands
};

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    
    if (!Array.isArray(data)) {
      return NextResponse.json({ error: "Invalid data format. Expected array." }, { status: 400 });
    }

    const headers = [
      "No.", "Tanggal Diterima DPP", "No. Agenda", "Kode unit kerja pengendali", "Unit Kerja", 
      "Kode End User", "End User", "Nomor Surat End User", "Tanggal Surat End User", "Hal", 
      "Kode PPK", "Nama PPK", "Nomor Surat PPK", "Tanggal DPP", "Hal PPK", "Nama Paket PBJ", 
      "Pagu Anggaran (Non Aktif)", "Pagu Anggaran (Aktif)", "HPS", "Kode MAK", "No. MAK", 
      "Uraian MAK (Induk)", "Uraian MAK (Rinci)", "Pokja Belanja Modal", "Pokja Belanja OPRS", 
      "Ka.ULP", "Keterangan Tambahan (Apabila Ada)"
    ];

    const csvLines = [headers.join(";")];

    data.forEach((item: any) => {
      const row = [
        item.no,
        formatDate(item.tanggalDiterimaDpp),
        item.noAgenda,
        item.kodeUnitKerjaPengendali,
        item.unitKerja,
        item.kodeEndUser,
        item.endUser,
        item.nomorSuratEndUser,
        formatDate(item.tanggalSuratEndUser),
        item.hal,
        item.kodePpk,
        item.namaPpk,
        item.nomorSuratPpk,
        formatDate(item.tanggalDpp),
        item.halPpk,
        item.namaPaketPbj,
        formatCurrency(item.paguAnggaranNonAktif),
        formatCurrency(item.paguAnggaranAktif),
        formatCurrency(item.hps),
        item.kodeMak,
        item.noMak,
        item.uraianMakInduk,
        item.uraianMakRinci,
        item.pokjaBelanjaModal,
        item.pokjaBelanjaOprs,
        item.kaUlp,
        item.keteranganTambahan
      ].map(toCsvValue);
      
      csvLines.push(row.join(";"));
    });

    const csvContent = csvLines.join("\n");
    
    fs.writeFileSync(CSV_FILE_PATH, csvContent, "utf-8");

    return NextResponse.json({ success: true, message: "Data saved successfully" });
  } catch (error) {
    console.error("Error saving CSV:", error);
    return NextResponse.json({ error: "Failed to save data" }, { status: 500 });
  }
}
