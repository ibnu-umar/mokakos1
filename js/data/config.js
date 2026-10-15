/* =========================================
   MOKA KOST — KONFIGURASI DATA
   =========================================
   
   ✏️  FILE INI BERISI SEMUA DATA YANG BISA ANDA EDIT:
       - Informasi Kost (nama, alamat, telepon)
       - Rekening Pembayaran
       - Data Penghuni
       - Riwayat Pembayaran Awal

   Cukup ubah nilai di bawah ini, lalu simpan.
   Tidak perlu mengubah file lain.
   ========================================= */


// ─── INFO KOST ──────────────────────────────────────────
export const KOST_INFO = {
    nama: "Moka Kost",
    alamat: "Jl. Mulawarman IV RT 03 RW 01 Kramas, Kec.Tembalang, Kota Semarang",
    telepon: "0851-7545-0467",
    logoFile: "logo.jpg",
};


// ─── REKENING PEMBAYARAN ────────────────────────────────
// Ditampilkan di struk, tagihan, dan pesan WhatsApp
export const REKENING = [
    { bank: "BCA", noRek: "8830-123-456", atasNama: "Moka Kost" },
    { bank: "Mandiri", noRek: "137-00-1234567-8", atasNama: "Moka Kost" },
];


// ─── DATA PENGHUNI ──────────────────────────────────────
// Setiap penghuni harus punya id unik (format: MK-2026-XXX).
// avatar = 2 huruf inisial yang tampil di kartu.
//
// STATUS:
//   "paid"   → sudah lunas (isi paidDate & method)
//   "dp"     → sudah bayar DP / uang muka (isi dpAmount, paidDate, method)
//   "unpaid" → belum bayar (paidDate & method = null)
export const PENGHUNI = [
    {
        id: "MK-2026-001",
        name: "Muhammad Kholil Fathurrochman",
        room: "Kamar 04",
        phone: "081211810727",
        amount: 1500000,
        period: "Oktober 2026",
        dueDate: "2026-10-05",
        paidDate: null,
        method: null,
        status: "unpaid",
        avatar: "MK"
    },
    {
        id: "MK-2026-002",
        name: "valen",
        room: "Kamar 01",
        phone: "0813-3333-4444",
        amount: 1500000,
        period: "Oktober 2026",
        dueDate: "2026-10-05",
        paidDate: null,
        method: null,
        status: "unpaid",
        avatar: "VL"
    },
    {
        id: "MK-2026-003",
        name: "Dewi",
        room: "Kamar 02",
        phone: "0857-5555-6666",
        amount: 1700000,
        period: "Oktober 2026",
        dueDate: "2026-10-05",
        paidDate: null,
        method: null,
        status: "unpaid",
        avatar: "DW"
    },
    {
        id: "MK-2026-004",
        name: "Dimas",
        room: "Kamar 03",
        phone: "0878-7777-8888",
        amount: 1700000,
        period: "Oktober 2026",
        dueDate: "2026-10-05",
        paidDate: null,
        method: null,
        status: "unpaid",
        avatar: "DM"
    },
    {
        id: "MK-2026-005",
        name: "Ega Prastyo",
        room: "Kamar 05",
        phone: "085935668103",
        amount: 1800000,
        period: "Oktober 2026",
        dueDate: "2026-10-05",
        paidDate: null,
        method: null,
        status: "unpaid",
        avatar: "EK"
    },
    {
        id: "MK-2026-006",
        name: "Maulana",
        room: "Kamar 06",
        phone: "0856-1234-5678",
        amount: 1800000,
        period: "Oktober 2026",
        dueDate: "2026-10-05",
        paidDate: null,
        method: null,
        status: "unpaid",
        avatar: "ML"
    }
];


// ─── RIWAYAT PEMBAYARAN AWAL ────────────────────────────
// Data transaksi yang sudah pernah tercatat sebelumnya.
// Akan ditambah otomatis oleh sistem saat penghuni membayar.
export const RIWAYAT_PEMBAYARAN = [];


// ─── HELPER: Format teks rekening ───────────────────────
// Dipakai oleh struk PDF, tagihan, dan pesan WhatsApp

/** Format HTML untuk struk/tagihan */
export function rekeningHTML() {
    return REKENING.map(r =>
        `<div>• ${r.bank}: <strong>${r.noRek}</strong> (a/n ${r.atasNama})</div>`
    ).join("\n");
}

/** Format teks WhatsApp (bold markdown) */
export function rekeningWA() {
    return REKENING.map(r =>
        `• ${r.bank}: *${r.noRek}* (a/n ${r.atasNama})`
    ).join("\n");
}
