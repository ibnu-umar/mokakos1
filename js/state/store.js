/* =========================================
   MOKA KOST — Central State Store
   ========================================= */

import { initialResidents } from "../data/residents.js";
import { initialPaymentHistory } from "../data/paymentHistory.js";

const STORAGE_KEY = "mokakos_residents_data_v2";
const STORAGE_KEY_HISTORY = "mokakos_payment_history_v1";

class Store {
    constructor() {
        this.residents = this.loadResidents();
        this.paymentHistory = this.loadPaymentHistory();
        this.currentFilter = "all";
        this.currentView = "dashboard"; // 'dashboard' | 'history' | 'directory'
        this.ktpFilter = "all"; // 'all' | 'has_ktp' | 'no_ktp'
        this.searchQuery = "";
        
        // History filters
        this.historySearchQuery = "";
        this.historyPeriodFilter = "all";
        this.historyMethodFilter = "all";
        this.historySort = "desc"; // 'desc' | 'asc'
        
        this.listeners = [];
    }

    /**
     * Load residents from localStorage and smart-sync with config.js
     * (ensures edits in config.js immediately reflect in the app)
     */
    loadResidents() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    const configMap = new Map(initialResidents.map(r => [r.id, r]));
                    
                    const merged = parsed.map(savedItem => {
                        const configItem = configMap.get(savedItem.id);
                        if (configItem) {
                            configMap.delete(savedItem.id);
                            return {
                                ...savedItem,
                                name: configItem.name,
                                room: configItem.room,
                                phone: configItem.phone,
                                amount: configItem.amount,
                                period: configItem.period,
                                dueDate: configItem.dueDate,
                                avatar: configItem.avatar || savedItem.avatar,
                                ...(savedItem.status === configItem.status ? {
                                    paidDate: configItem.paidDate,
                                    method: configItem.method
                                } : {})
                            };
                        }
                        return savedItem;
                    });

                    // Append any new residents added to config.js
                    for (const [, newConfigItem] of configMap) {
                        merged.push({ ...newConfigItem });
                    }

                    return merged;
                }
            }
        } catch (e) {
            console.error("Failed to load residents from localStorage:", e);
        }
        return [...initialResidents];
    }

    /**
     * Persist residents to localStorage
     */
    saveResidents() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.residents));
        } catch (e) {
            console.error("Failed to save residents to localStorage:", e);
        }
    }

    /**
     * Load payment history from localStorage and sync with config.js
     */
    loadPaymentHistory() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY_HISTORY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) {
                    const configMap = new Map(initialPaymentHistory.map(p => [p.id, p]));
                    const merged = parsed.map(item => {
                        const configItem = configMap.get(item.id);
                        if (configItem) {
                            return {
                                ...item,
                                name: configItem.name,
                                room: configItem.room,
                                phone: configItem.phone,
                                amount: configItem.amount,
                                period: configItem.period,
                                dueDate: configItem.dueDate,
                                avatar: configItem.avatar || item.avatar
                            };
                        }
                        return item;
                    });
                    return merged;
                }
            }
        } catch (e) {
            console.error("Failed to load payment history from localStorage:", e);
        }
        return [...initialPaymentHistory];
    }

    /**
     * Persist payment history to localStorage
     */
    savePaymentHistory() {
        try {
            localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(this.paymentHistory));
        } catch (e) {
            console.error("Failed to save payment history to localStorage:", e);
        }
    }

    /**
     * Hard reset data to initial config values
     */
    resetToDefault() {
        this.residents = [...initialResidents];
        this.paymentHistory = [...initialPaymentHistory];
        this.saveResidents();
        this.savePaymentHistory();
        this.notify();
    }

    /**
     * Set active main view ('dashboard' | 'history' | 'directory')
     */
    setView(view) {
        this.currentView = view;
        this.notify();
    }

    getView() {
        return this.currentView;
    }

    /**
     * Set search query for resident directory
     */
    setSearchQuery(query) {
        this.searchQuery = (query || "").toLowerCase().trim();
        this.notify();
    }

    getSearchQuery() {
        return this.searchQuery;
    }

    /**
     * Set KTP filter ('all' | 'has_ktp' | 'no_ktp')
     */
    setKtpFilter(filter) {
        this.ktpFilter = filter;
        this.notify();
    }

    getKtpFilter() {
        return this.ktpFilter;
    }

    /**
     * Set History filter params
     */
    setHistoryFilter(type, value) {
        if (type === "search") {
            this.historySearchQuery = (value || "").toLowerCase().trim();
        } else if (type === "period") {
            this.historyPeriodFilter = value || "all";
        } else if (type === "method") {
            this.historyMethodFilter = value || "all";
        } else if (type === "sort") {
            this.historySort = value || "desc";
        }
        this.notify();
    }

    resetHistoryFilters() {
        this.historySearchQuery = "";
        this.historyPeriodFilter = "all";
        this.historyMethodFilter = "all";
        this.historySort = "desc";
        this.notify();
    }

    /**
     * Get list of residents with active payment filter
     */
    getResidents(filter = this.currentFilter) {
        if (filter === "all") return this.residents;
        return this.residents.filter(r => r.status === filter);
    }

    /**
     * Get list of residents filtered for directory (search & KTP status)
     */
    getDirectoryResidents() {
        let list = [...this.residents];

        if (this.ktpFilter === "has_ktp") {
            list = list.filter(r => Boolean(r.ktpImage));
        } else if (this.ktpFilter === "no_ktp") {
            list = list.filter(r => !r.ktpImage);
        }

        if (this.searchQuery) {
            list = list.filter(r => 
                (r.name && r.name.toLowerCase().includes(this.searchQuery)) ||
                (r.room && r.room.toLowerCase().includes(this.searchQuery)) ||
                (r.phone && r.phone.includes(this.searchQuery)) ||
                (r.nik && r.nik.includes(this.searchQuery))
            );
        }

        return list;
    }

    /**
     * Get resident by ID
     * @param {string} id 
     */
    getResidentById(id) {
        return this.residents.find(r => r.id === id) || null;
    }

    /**
     * Add new resident
     */
    addResident(residentData) {
        const count = this.residents.length + 1;
        const id = `MK-2026-${String(count).padStart(3, "0")}`;
        const name = residentData.name || "Penghuni Baru";
        const initials = name.split(" ").filter(Boolean).map(w => w[0]).slice(0, 2).join("").toUpperCase() || "MK";
        
        const newResident = {
            id,
            name: name,
            room: residentData.room || "Kamar Kost",
            phone: residentData.phone || "",
            amount: Number(residentData.amount) || 1500000,
            period: residentData.period || "Oktober 2026",
            dueDate: residentData.dueDate || new Date().toISOString().split("T")[0],
            paidDate: null,
            method: null,
            status: "unpaid",
            avatar: initials,
            nik: residentData.nik || "",
            ktpImage: residentData.ktpImage || null,
            ktpUploadedAt: residentData.ktpImage ? new Date().toISOString() : null,
            emergencyContact: residentData.emergencyContact || "",
            occupation: residentData.occupation || "",
            notes: residentData.notes || ""
        };

        this.residents.unshift(newResident);
        this.saveResidents();
        this.notify();
        return newResident;
    }

    /**
     * Update resident fields
     * @param {string} id 
     * @param {Object} updatedData 
     */
    updateResident(id, updatedData) {
        const index = this.residents.findIndex(r => r.id === id);
        if (index !== -1) {
            // Update avatar initials if name changed
            let avatar = this.residents[index].avatar;
            if (updatedData.name && updatedData.name !== this.residents[index].name) {
                avatar = updatedData.name.split(" ").filter(Boolean).map(w => w[0]).slice(0, 2).join("").toUpperCase() || avatar;
            }

            this.residents[index] = { 
                ...this.residents[index], 
                ...updatedData,
                avatar: updatedData.avatar || avatar
            };
            this.saveResidents();
            this.notify();
            return this.residents[index];
        }
        return null;
    }

    /**
     * Update KTP for resident
     */
    updateKtp(residentId, { ktpImage, nik }) {
        return this.updateResident(residentId, {
            ktpImage: ktpImage,
            nik: nik || "",
            ktpUploadedAt: ktpImage ? new Date().toISOString() : null
        });
    }

    /**
     * Delete KTP from resident
     */
    removeKtp(residentId) {
        return this.updateResident(residentId, {
            ktpImage: null,
            ktpUploadedAt: null
        });
    }

    /**
     * Delete resident entirely
     */
    deleteResident(id) {
        this.residents = this.residents.filter(r => r.id !== id);
        this.saveResidents();
        this.notify();
    }

    /**
     * Set active filter (all, paid, unpaid)
     * @param {'all'|'paid'|'unpaid'} filter 
     */
    setFilter(filter) {
        this.currentFilter = filter;
        this.notify();
    }

    getFilter() {
        return this.currentFilter;
    }

    // =========================================
    // Payment History Methods
    // =========================================

    /**
     * Add a record to payment history
     * @param {Object} paymentData 
     */
    addPaymentHistory(paymentData) {
        const timestamp = new Date().toISOString();
        const id = paymentData.id || `TRX-${Date.now().toString(36).toUpperCase()}`;
        
        const record = {
            id,
            receiptNo: paymentData.receiptNo || paymentData.residentId || id,
            residentId: paymentData.residentId || "",
            name: paymentData.name || "Penghuni",
            room: paymentData.room || "Kamar Kost",
            phone: paymentData.phone || "",
            amount: Number(paymentData.amount) || 0,
            period: paymentData.period || "Bulan Ini",
            dueDate: paymentData.dueDate || timestamp.split("T")[0],
            paidDate: paymentData.paidDate || timestamp.split("T")[0],
            method: paymentData.method || "Transfer BCA",
            notes: paymentData.notes || paymentData.paymentNote || "",
            status: "paid",
            avatar: paymentData.avatar || "MK",
            createdAt: timestamp
        };

        this.paymentHistory.unshift(record);
        this.savePaymentHistory();
        this.notify();
        return record;
    }

    /**
     * Delete single payment history record
     * @param {string} id 
     */
    deletePaymentHistory(id) {
        this.paymentHistory = this.paymentHistory.filter(item => item.id !== id);
        this.savePaymentHistory();
        this.notify();
    }

    /**
     * Get single history item by ID or Receipt No
     * @param {string} id 
     */
    getPaymentHistoryById(id) {
        return this.paymentHistory.find(item => item.id === id || item.receiptNo === id) || null;
    }

    /**
     * Get all payment history for a specific resident
     * @param {string} residentId 
     */
    getResidentPaymentHistory(residentId) {
        return this.paymentHistory.filter(item => item.residentId === residentId);
    }

    /**
     * Get all available unique periods in payment history
     */
    getHistoryPeriods() {
        const periods = new Set();
        this.paymentHistory.forEach(item => {
            if (item.period) periods.add(item.period);
        });
        return Array.from(periods);
    }

    /**
     * Get all available unique payment methods in history
     */
    getHistoryMethods() {
        const methods = new Set();
        this.paymentHistory.forEach(item => {
            if (item.method) methods.add(item.method);
        });
        return Array.from(methods);
    }

    /**
     * Get filtered & sorted payment history list
     */
    getFilteredPaymentHistory() {
        let list = [...this.paymentHistory];

        if (this.historyPeriodFilter && this.historyPeriodFilter !== "all") {
            list = list.filter(item => item.period === this.historyPeriodFilter);
        }

        if (this.historyMethodFilter && this.historyMethodFilter !== "all") {
            list = list.filter(item => item.method === this.historyMethodFilter);
        }

        if (this.historySearchQuery) {
            const q = this.historySearchQuery;
            list = list.filter(item => 
                (item.name && item.name.toLowerCase().includes(q)) ||
                (item.room && item.room.toLowerCase().includes(q)) ||
                (item.phone && item.phone.includes(q)) ||
                (item.id && item.id.toLowerCase().includes(q)) ||
                (item.receiptNo && item.receiptNo.toLowerCase().includes(q)) ||
                (item.method && item.method.toLowerCase().includes(q)) ||
                (item.notes && item.notes.toLowerCase().includes(q))
            );
        }

        // Sort by paidDate or createdAt
        list.sort((a, b) => {
            const dateA = new Date(a.paidDate || a.createdAt).getTime();
            const dateB = new Date(b.paidDate || b.createdAt).getTime();
            return this.historySort === "asc" ? dateA - dateB : dateB - dateA;
        });

        return list;
    }

    /**
     * Calculate summary stats for payment history
     */
    getHistoryStats() {
        const totalCount = this.paymentHistory.length;
        const totalAmount = this.paymentHistory.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
        const avgAmount = totalCount > 0 ? Math.round(totalAmount / totalCount) : 0;

        // Count method frequency
        const methodCounts = {};
        this.paymentHistory.forEach(item => {
            const m = item.method || "Transfer BCA";
            methodCounts[m] = (methodCounts[m] || 0) + 1;
        });

        let topMethod = "Belum Ada";
        let maxCount = 0;
        for (const [m, count] of Object.entries(methodCounts)) {
            if (count > maxCount) {
                maxCount = count;
                topMethod = m;
            }
        }

        return {
            totalTransactions: totalCount,
            totalRevenue: totalAmount,
            averageTransaction: avgAmount,
            topPaymentMethod: topMethod,
            topMethodCount: maxCount
        };
    }

    /**
     * Calculate financial and KTP summary stats for dashboard
     */
    getStats() {
        const paid = this.residents.filter(r => r.status === "paid");
        const unpaid = this.residents.filter(r => r.status === "unpaid");
        const withKtp = this.residents.filter(r => Boolean(r.ktpImage));
        const totalRevenue = paid.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

        return {
            total: this.residents.length,
            paidCount: paid.length,
            unpaidCount: unpaid.length,
            withKtpCount: withKtp.length,
            withoutKtpCount: this.residents.length - withKtp.length,
            totalRevenue
        };
    }

    /**
     * Subscribe to state changes
     * @param {Function} listener 
     */
    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    notify() {
        this.listeners.forEach(listener => {
            try {
                listener(this);
            } catch (err) {
                console.error("Store listener error:", err);
            }
        });
    }
}

export const store = new Store();
