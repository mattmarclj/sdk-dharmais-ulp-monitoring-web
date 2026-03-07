"use client";

import { useState, useMemo } from "react";
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit2, 
  X, 
  Save, 
  ChevronLeft, 
  ChevronRight,
  Loader2
} from "lucide-react";
import { UlpData, saveUlpData } from "./data-loader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface MasterDataViewProps {
  data: UlpData[];
  isLoading: boolean;
}

export function MasterDataView({ data: initialData, isLoading }: MasterDataViewProps) {
  const [data, setData] = useState<UlpData[]>(initialData);
  const [search, setSearch] = useState("");
  const [currentItem, setCurrentItem] = useState<Partial<UlpData>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number>(-1);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Sync with initialData when it changes (e.g. after first load)
  useMemo(() => {
    setData(initialData);
  }, [initialData]);

  const filteredData = useMemo(() => {
    if (!search) return data;
    const lowerSearch = search.toLowerCase();
    return data.filter((item) => 
      Object.values(item).some(val => 
        val !== null && 
        val !== undefined && 
        String(val).toLowerCase().includes(lowerSearch)
      )
    );
  }, [data, search]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  function handleEdit(item: UlpData) {
    setCurrentItem({...item});
    setEditIndex(data.indexOf(item));
    setIsModalOpen(true);
  }

  function handleDelete(item: UlpData) {
    if (confirm("Are you sure you want to delete this item?")) {
      const newData = data.filter(i => i !== item);
      setData(newData);
      saveUlpData(newData);
    }
  }

  function updateField(field: keyof UlpData, value: any) {
    setCurrentItem(prev => ({ ...prev, [field]: value }));
  }

  async function saveData() {
    setIsSaving(true);
    try {
        const newData = [...data];
        if (editIndex >= 0) {
            newData[editIndex] = currentItem as UlpData;
        } else {
            newData.push(currentItem as UlpData);
        }
        
        const success = await saveUlpData(newData);
        if (success) {
            setData(newData);
            setIsModalOpen(false);
        } else {
            alert("Failed to save data. Please try again.");
        }
    } catch (e) {
        console.error(e);
        alert("An error occurred.");
    } finally {
        setIsSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-white p-4 rounded-lg shadow-sm border border-slate-200">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search data..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button onClick={() => {
          setCurrentItem({});
          setEditIndex(-1);
          setIsModalOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" /> Add New
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 w-16">Actions</th>
                <th className="px-4 py-3 min-w-[50px]">No.</th>
                <th className="px-4 py-3 min-w-[120px]">Tgl Diterima DPP</th>
                <th className="px-4 py-3 min-w-[150px]">Unit Kerja</th>
                <th className="px-4 py-3 min-w-[200px]">Nama Paket PBJ</th>
                <th className="px-4 py-3 min-w-[150px]">Pagu (Aktif)</th>
                <th className="px-4 py-3 min-w-[100px]">Keterangan</th>
                <th className="px-4 py-3 min-w-[150px]">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Loading data...
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    No data found.
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleEdit(item)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(item)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium">{item.no}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {item.tanggalDiterimaDpp ? new Date(item.tanggalDiterimaDpp).toLocaleDateString("id-ID") : "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-600 truncate max-w-[150px]" title={item.unitKerja}>
                      {item.unitKerja}
                    </td>
                    <td className="px-4 py-3 text-slate-900 font-medium truncate max-w-[200px]" title={item.namaPaketPbj}>
                      {item.namaPaketPbj}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(item.paguAnggaranAktif)}
                    </td>
                    <td className="px-4 py-3">
                       <span className="truncate max-w-[100px] block" title={item.keteranganTambahan}>
                        {item.keteranganTambahan || "-"}
                       </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="soft">Active</Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
          <div className="text-sm text-slate-500">
            Showing {Math.min(filteredData.length, (currentPage - 1) * itemsPerPage + 1)} to {Math.min(filteredData.length, currentPage * itemsPerPage)} of {filteredData.length} entries
          </div>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Edit/Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">
                {editIndex >= 0 ? "Edit Data" : "Add New Data"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               <FormField label="No" value={currentItem.no} onChange={(v: string) => updateField("no", v)} />
               <FormField label="Tanggal Diterima DPP" type="date" value={dateToInput(currentItem.tanggalDiterimaDpp)} onChange={(v: string) => updateField("tanggalDiterimaDpp", inputToDate(v))} />
               <FormField label="No. Agenda" value={currentItem.noAgenda} onChange={(v: string) => updateField("noAgenda", v)} />
               
               <FormField label="Unit Kerja" value={currentItem.unitKerja} onChange={(v: string) => updateField("unitKerja", v)} />
               <FormField label="Kode Unit Kerja" value={currentItem.kodeUnitKerjaPengendali} onChange={(v: string) => updateField("kodeUnitKerjaPengendali", v)} />
               
               <FormField label="End User" value={currentItem.endUser} onChange={(v: string) => updateField("endUser", v)} />
               <FormField label="Kode End User" value={currentItem.kodeEndUser} onChange={(v: string) => updateField("kodeEndUser", v)} />
               
               <FormField label="Nama Paket PBJ" value={currentItem.namaPaketPbj} onChange={(v: string) => updateField("namaPaketPbj", v)} className="md:col-span-2" />
               
               <FormField label="Pagu Anggaran (Aktif)" type="number" value={currentItem.paguAnggaranAktif} onChange={(v: string) => updateField("paguAnggaranAktif", Number(v))} />
               <FormField label="Pagu Anggaran (Non Aktif)" type="number" value={currentItem.paguAnggaranNonAktif} onChange={(v: string) => updateField("paguAnggaranNonAktif", Number(v))} />
               <FormField label="HPS" type="number" value={currentItem.hps} onChange={(v: string) => updateField("hps", Number(v))} />
               
               <FormField label="Nama PPK" value={currentItem.namaPpk} onChange={(v: string) => updateField("namaPpk", v)} />
               <FormField label="Kode PPK" value={currentItem.kodePpk} onChange={(v: string) => updateField("kodePpk", v)} />
               
               <FormField label="Keterangan Tambahan" value={currentItem.keteranganTambahan} onChange={(v: string) => updateField("keteranganTambahan", v)} className="md:col-span-3" />
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button onClick={saveData} disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FormField({ label, value, onChange, type = "text", className = "" }: any) {
    return (
        <div className={`space-y-1 ${className}`}>
            <label className="text-xs font-medium text-slate-500 uppercase">{label}</label>
            <input 
                type={type}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={value || ""}
                onChange={e => onChange(e.target.value)}
            />
        </div>
    )
}

function dateToInput(date: Date | null | undefined): string {
    if (!date) return "";
    try {
        return new Date(date).toISOString().split('T')[0];
    } catch {
        return "";
    }
}

function inputToDate(str: string): Date | null {
    if (!str) return null;
    return new Date(str);
}
