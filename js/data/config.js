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
    { bank: "BCA",     noRek: "8830-123-456",      atasNama: "Moka Kost" },
    { bank: "Mandiri", noRek: "137-00-1234567-8",   atasNama: "Moka Kost" },
];


// ─── DATA PENGHUNI ──────────────────────────────────────
// Setiap penghuni harus punya id unik (format: MK-2026-XXX).
// avatar = 2 huruf inisial yang tampil di kartu.
//
// STATUS:
//   "paid"   → sudah lunas (isi paidDate & method)
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
        paidDate: "2026-10-02",
        method: "Transfer BCA",
        status: "paid",
        avatar: "AF"
    },
    {
        id: "MK-2026-002",
        name: "Budi Setiawan",
        room: "Kamar 102 — Lantai 1",
        phone: "0813-3333-4444",
        amount: 1500000,
        period: "Oktober 2026",
        dueDate: "2026-10-05",
        paidDate: "2026-10-03",
        method: "Transfer Mandiri",
        status: "paid",
        avatar: "BS"
    },
    {
        id: "MK-2026-003",
        name: "Citra Dewi",
        room: "Kamar 201 — Lantai 2",
        phone: "0857-5555-6666",
        amount: 1700000,
        period: "Oktober 2026",
        dueDate: "2026-10-05",
        paidDate: "2026-10-01",
        method: "GoPay",
        status: "paid",
        avatar: "CD"
    },
    {
        id: "MK-2026-004",
        name: "Dimas Prasetyo",
        room: "Kamar 202 — Lantai 2",
        phone: "0878-7777-8888",
        amount: 1700000,
        period: "Oktober 2026",
        dueDate: "2026-10-05",
        paidDate: null,
        method: null,
        status: "unpaid",
        avatar: "DP"
    },
    {
        id: "MK-2026-005",
        name: "Eka Putri Lestari",
        room: "Kamar 301 — Lantai 3",
        phone: "0821-9999-0000",
        amount: 1800000,
        period: "Oktober 2026",
        dueDate: "2026-10-05",
        paidDate: "2026-09-30",
        method: "Transfer BRI",
        status: "paid",
        avatar: "EP"
    },
    {
        id: "MK-2026-006",
        name: "Farhan Maulana",
        room: "Kamar 302 — Lantai 3",
        phone: "0856-1234-5678",
        amount: 1800000,
        period: "Oktober 2026",
        dueDate: "2026-10-05",
        paidDate: null,
        method: null,
        status: "unpaid",
        avatar: "FM"
    }
];


// ─── RIWAYAT PEMBAYARAN AWAL ────────────────────────────
// Data transaksi yang sudah pernah tercatat sebelumnya.
// Akan ditambah otomatis oleh sistem saat penghuni membayar.
export const RIWAYAT_PEMBAYARAN = [
    {
        id: "TRX-202610-001",
        receiptNo: "MK-2026-001",
        residentId: "MK-2026-001",
        name: "Muhammad Kholil Fathurrochman",
        room: "Kamar 04",
        phone: "081211810727",
        amount: 1500000,
        period: "Oktober 2026",
        dueDate: "2026-10-05",
        paidDate: "2026-10-02",
        method: "Transfer BCA",
        notes: "Lunas sewa kamar bulan Oktober 2026",
        status: "paid",
        avatar: "AF",
        createdAt: "2026-10-02T09:15:00.000Z"
    },
    {
        id: "TRX-202610-002",
        receiptNo: "MK-2026-002",
        residentId: "MK-2026-002",
        name: "Budi Setiawan",
        room: "Kamar 102 — Lantai 1",
        phone: "0813-3333-4444",
        amount: 1500000,
        period: "Oktober 2026",
        dueDate: "2026-10-05",
        paidDate: "2026-10-03",
        method: "Transfer Mandiri",
        notes: "Ref Mandiri #998231",
        status: "paid",
        avatar: "BS",
        createdAt: "2026-10-03T14:20:00.000Z"
    },
    {
        id: "TRX-202610-003",
        receiptNo: "MK-2026-003",
        residentId: "MK-2026-003",
        name: "Citra Dewi",
        room: "Kamar 201 — Lantai 2",
        phone: "0857-5555-6666",
        amount: 1700000,
        period: "Oktober 2026",
        dueDate: "2026-10-05",
        paidDate: "2026-10-01",
        method: "GoPay",
        notes: "Pembayaran via GoPay e-wallet",
        status: "paid",
        avatar: "CD",
        createdAt: "2026-10-01T11:05:00.000Z"
    },
    {
        id: "TRX-202610-005",
        receiptNo: "MK-2026-005",
        residentId: "MK-2026-005",
        name: "Eka Putri Lestari",
        room: "Kamar 301 — Lantai 3",
        phone: "0821-9999-0000",
        amount: 1800000,
        period: "Oktober 2026",
        dueDate: "2026-10-05",
        paidDate: "2026-09-30",
        method: "Transfer BRI",
        notes: "Transfer via BRImo",
        status: "paid",
        avatar: "EP",
        createdAt: "2026-09-30T16:45:00.000Z"
    }
];


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
