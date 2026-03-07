
export interface UlpData {
  no: string;
  tanggalDiterimaDpp: Date | null;
  noAgenda: string;
  kodeUnitKerjaPengendali: string;
  unitKerja: string;
  kodeEndUser: string;
  endUser: string;
  nomorSuratEndUser: string;
  tanggalSuratEndUser: Date | null;
  hal: string;
  kodePpk: string;
  namaPpk: string;
  nomorSuratPpk: string;
  tanggalDpp: Date | null;
  halPpk: string;
  namaPaketPbj: string;
  paguAnggaranNonAktif: number;
  paguAnggaranAktif: number;
  hps: number;
  kodeMak: string;
  noMak: string;
  uraianMakInduk: string;
  uraianMakRinci: string;
  pokjaBelanjaModal: string;
  pokjaBelanjaOprs: string;
  kaUlp: string;
  keteranganTambahan: string;
}

export async function loadUlpData(): Promise<UlpData[]> {
  try {
    const response = await fetch("/ulp-data-dharmais.csv");
    const text = await response.text();
    return parseCsv(text);
  } catch (error) {
    console.error("Failed to load ULP data:", error);
    return [];
  }
}

export async function saveUlpData(data: UlpData[]): Promise<boolean> {
  try {
    const response = await fetch("/api/ulp-data", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      console.error("Failed to save data");
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error saving data:", error);
    return false;
  }
}

function parseCsv(csvText: string): UlpData[] {
  const lines = csvText.split("\n").filter((line) => line.trim() !== "");
  const headers = lines[0].split(";"); // Semicolon delimiter
  const data: UlpData[] = [];

  for (let i = 1; i < lines.length; i++) {
    const currentLine = lines[i].split(";");
    if (currentLine.length < headers.length) continue;
    
    // Mapping based on index
    // 0: No.
    // 1: Tanggal Diterima DPP
    // 2: No. Agenda
    // 3: Kode unit kerja pengendali
    // 4: Unit Kerja
    // 5: Kode End User
    // 6: End User
    // 7: Nomor Surat End User
    // 8: Tanggal Surat End User
    // 9: Hal
    // 10: Kode PPK
    // 11: Nama PPK
    // 12: Nomor Surat PPK
    // 13: Tanggal DPP
    // 14: Hal PPK
    // 15: Nama Paket PBJ
    // 16: Pagu Anggaran (Non Aktif)
    // 17: Pagu Anggaran (Aktif)
    // 18: HPS
    // 19: Kode MAK
    // 20: No. MAK
    // 21: Uraian MAK (Induk)
    // 22: Uraian MAK (Rinci)
    // 23: Pokja Belanja Modal
    // 24: Pokja Belanja OPRS
    // 25: Ka.ULP
    // 26: Keterangan Tambahan (Apabila Ada)

    data.push({
      no: currentLine[0],
      tanggalDiterimaDpp: parseDate(currentLine[1]),
      noAgenda: currentLine[2],
      kodeUnitKerjaPengendali: currentLine[3],
      unitKerja: currentLine[4],
      kodeEndUser: currentLine[5],
      endUser: currentLine[6],
      nomorSuratEndUser: currentLine[7],
      tanggalSuratEndUser: parseDate(currentLine[8]),
      hal: currentLine[9],
      kodePpk: currentLine[10],
      namaPpk: currentLine[11],
      nomorSuratPpk: currentLine[12],
      tanggalDpp: parseDate(currentLine[13]),
      halPpk: currentLine[14],
      namaPaketPbj: currentLine[15],
      paguAnggaranNonAktif: parseCurrency(currentLine[16]),
      paguAnggaranAktif: parseCurrency(currentLine[17]),
      hps: parseCurrency(currentLine[18]),
      kodeMak: currentLine[19],
      noMak: currentLine[20],
      uraianMakInduk: currentLine[21],
      uraianMakRinci: currentLine[22],
      pokjaBelanjaModal: currentLine[23],
      pokjaBelanjaOprs: currentLine[24],
      kaUlp: currentLine[25],
      keteranganTambahan: currentLine[26],
    });
  }

  return data;
}

function parseDate(dateStr: string): Date | null {
  if (!dateStr || dateStr === "") return null;
  // Format: 20-Nov-24
  const parts = dateStr.split("-");
  if (parts.length !== 3) return null;

  const day = parseInt(parts[0], 10);
  const monthStr = parts[1];
  const yearShort = parseInt(parts[2], 10);
  const year = 2000 + yearShort; // Assuming 20xx

  const months: { [key: string]: number } = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
  };

  const month = months[monthStr];
  if (month === undefined) return null;

  return new Date(year, month, day);
}

function parseCurrency(currencyStr: string): number {
  if (!currencyStr || currencyStr === "") return 0;
  // Remove commas and parse
  const cleanStr = currencyStr.replace(/,/g, "");
  const val = parseFloat(cleanStr);
  return isNaN(val) ? 0 : val;
}
