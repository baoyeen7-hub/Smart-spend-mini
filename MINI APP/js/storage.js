/**
 * SmartSpend Mini - Storage Service
 * Centralized AppState management via LocalStorage
 * Key: SMARTSPEND_DATA_V1
 */

const STORAGE_KEY = 'SMARTSPEND_DATA_V1';

// Default categories as defined in specification
const DEFAULT_CATEGORIES = [
  // Chi tiêu (Expenses)
  { id: 'CAT_EXP_FOOD', name: 'Ăn uống', type: 'EXPENSE', icon: '🍔', color: '#f97316', isDefault: true },
  { id: 'CAT_EXP_TRANS', name: 'Đi lại', type: 'EXPENSE', icon: '🚗', color: '#06b6d4', isDefault: true },
  { id: 'CAT_EXP_EDU', name: 'Học tập', type: 'EXPENSE', icon: '📚', color: '#8b5cf6', isDefault: true },
  { id: 'CAT_EXP_ENT', name: 'Giải trí', type: 'EXPENSE', icon: '🎮', color: '#ec4899', isDefault: true },
  { id: 'CAT_EXP_HOUSE', name: 'Nhà ở', type: 'EXPENSE', icon: '🏠', color: '#6366f1', isDefault: true },
  { id: 'CAT_EXP_SHOP', name: 'Mua sắm', type: 'EXPENSE', icon: '🛍️', color: '#e11d48', isDefault: true },
  { id: 'CAT_EXP_HEALTH', name: 'Sức khỏe', type: 'EXPENSE', icon: '💊', color: '#14b8a6', isDefault: true },
  { id: 'CAT_EXP_OTHER', name: 'Khác', type: 'EXPENSE', icon: '📦', color: '#64748b', isDefault: true },
  
  // Thu nhập (Incomes)
  { id: 'CAT_INC_SALARY', name: 'Lương', type: 'INCOME', icon: '💰', color: '#10b981', isDefault: true },
  { id: 'CAT_INC_SALE', name: 'Bán hàng / Livestream', type: 'INCOME', icon: '📱', color: '#3b82f6', isDefault: true },
  { id: 'CAT_INC_BONUS', name: 'Thưởng', type: 'INCOME', icon: '🎁', color: '#f59e0b', isDefault: true },
  { id: 'CAT_INC_OTHER', name: 'Thu nhập khác', type: 'INCOME', icon: '💵', color: '#84cc16', isDefault: true },
];

// Default Wallets (Initial balance = 0 VNĐ for clean start)
const DEFAULT_WALLETS = [
  { id: 'WAL_CASH', name: 'Tiền mặt', icon: '💵', initialBalance: 0 },
  { id: 'WAL_BANK', name: 'Ngân hàng', icon: '🏦', initialBalance: 0 },
  { id: 'WAL_EWALLET', name: 'Ví điện tử', icon: '📱', initialBalance: 0 },
];

// Default Profile
const DEFAULT_PROFILE = {
  name: 'Bạn mới',
  role: 'Quản lý tài chính',
  avatarType: 'emoji', // 'emoji' | 'image'
  avatarValue: '🧑‍💼',
  updatedAt: new Date().toISOString()
};

// Seed Transactions generator for testing on demand
function generateSampleTransactions() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  
  return [
    {
      id: `TX_${Date.now() - 86400000 * 18}`,
      type: 'INCOME',
      amount: 18000000,
      date: `${year}-${month}-01`,
      categoryId: 'CAT_INC_SALARY',
      walletId: 'WAL_BANK',
      note: 'Nhận lương tháng'
    },
    {
      id: `TX_${Date.now() - 86400000 * 16}`,
      type: 'EXPENSE',
      amount: 4500000,
      date: `${year}-${month}-02`,
      categoryId: 'CAT_EXP_HOUSE',
      walletId: 'WAL_BANK',
      note: 'Tiền thuê nhà'
    },
    {
      id: `TX_${Date.now() - 86400000 * 12}`,
      type: 'INCOME',
      amount: 2500000,
      date: `${year}-${month}-05`,
      categoryId: 'CAT_INC_SALE',
      walletId: 'WAL_EWALLET',
      note: 'Bán hàng online & livestream'
    },
    {
      id: `TX_${Date.now() - 86400000 * 9}`,
      type: 'EXPENSE',
      amount: 85000,
      date: `${year}-${month}-08`,
      categoryId: 'CAT_EXP_FOOD',
      walletId: 'WAL_CASH',
      note: 'Ăn trưa phở bò'
    },
    {
      id: `TX_${Date.now() - 86400000 * 7}`,
      type: 'EXPENSE',
      amount: 150000,
      date: `${year}-${month}-10`,
      categoryId: 'CAT_EXP_TRANS',
      walletId: 'WAL_EWALLET',
      note: 'Đổ xăng xe máy'
    },
    {
      id: `TX_${Date.now() - 86400000 * 5}`,
      type: 'EXPENSE',
      amount: 450000,
      date: `${year}-${month}-12`,
      categoryId: 'CAT_EXP_SHOP',
      walletId: 'WAL_BANK',
      note: 'Mua sắm đồ gia dụng'
    },
    {
      id: `TX_${Date.now() - 86400000 * 3}`,
      type: 'INCOME',
      amount: 1000000,
      date: `${year}-${month}-15`,
      categoryId: 'CAT_INC_BONUS',
      walletId: 'WAL_BANK',
      note: 'Tiền thưởng hiệu quả công việc'
    },
    {
      id: `TX_${Date.now() - 86400000 * 1}`,
      type: 'EXPENSE',
      amount: 120000,
      date: `${year}-${month}-18`,
      categoryId: 'CAT_EXP_FOOD',
      walletId: 'WAL_CASH',
      note: 'Cà phê & trà sữa cùng bạn bè'
    },
    {
      id: `TX_${Date.now()}`,
      type: 'EXPENSE',
      amount: 75000,
      date: `${year}-${month}-${String(now.getDate()).padStart(2, '0')}`,
      categoryId: 'CAT_EXP_HEALTH',
      walletId: 'WAL_CASH',
      note: 'Mua vitamin C & khẩu trang y tế'
    }
  ];
}

class StorageService {
  constructor() {
    this.init();
  }

  init() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        this.resetToDefault();
      } else {
        const data = JSON.parse(raw);
        if (!data.categories || !data.transactions || !data.wallets) {
          this.resetToDefault();
        } else if (!data.profile) {
          data.profile = DEFAULT_PROFILE;
          this.saveState(data);
        }
      }
    } catch (e) {
      console.warn('Storage initialization fallback to default:', e);
      this.resetToDefault();
    }
  }

  loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return this.resetToDefault();
      const state = JSON.parse(raw);
      if (!state.profile) {
        state.profile = DEFAULT_PROFILE;
      }
      return state;
    } catch (e) {
      console.error('Error loading state from localStorage:', e);
      return this.resetToDefault();
    }
  }

  saveState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch (e) {
      console.error('Error saving state to localStorage:', e);
      alert('Lỗi: Dung lượng bộ nhớ trình duyệt đã đầy hoặc bị chặn lưu trữ!');
      return false;
    }
  }

  /**
   * Reset App State to clean state:
   * Transactions = [] (Completely clean, 0 VND)
   * Wallets initialBalance = 0 VND
   * Categories = Default categories
   */
  resetToDefault(keepProfile = false) {
    let existingProfile = DEFAULT_PROFILE;
    if (keepProfile) {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.profile) existingProfile = parsed.profile;
        }
      } catch (err) {}
    }

    const defaultState = {
      version: '1.1.0',
      lastUpdated: new Date().toISOString(),
      profile: existingProfile,
      categories: DEFAULT_CATEGORIES,
      wallets: DEFAULT_WALLETS,
      transactions: [] // Clean empty list: Total Income = 0, Total Expense = 0, Balance = 0
    };
    this.saveState(defaultState);
    return defaultState;
  }

  /**
   * On-demand sample data loader (For testing purposes)
   */
  loadSampleData() {
    const state = this.loadState();
    const samples = generateSampleTransactions();
    
    // Merge or set sample transactions
    state.transactions = samples;
    // Set realistic wallet balances for sample mode
    state.wallets = [
      { id: 'WAL_CASH', name: 'Tiền mặt', icon: '💵', initialBalance: 2000000 },
      { id: 'WAL_BANK', name: 'Ngân hàng', icon: '🏦', initialBalance: 15000000 },
      { id: 'WAL_EWALLET', name: 'Ví điện tử', icon: '📱', initialBalance: 1000000 },
    ];
    state.lastUpdated = new Date().toISOString();
    this.saveState(state);
    return samples.length;
  }

  // =========================================================================
  // PROFILE MANAGEMENT
  // =========================================================================

  getProfile() {
    const state = this.loadState();
    return state.profile || DEFAULT_PROFILE;
  }

  updateProfile(profileData) {
    const state = this.loadState();
    state.profile = {
      ...DEFAULT_PROFILE,
      ...(state.profile || {}),
      name: (profileData.name || '').trim() || 'Bạn mới',
      role: (profileData.role || '').trim() || 'Quản lý tài chính',
      avatarType: profileData.avatarType || 'emoji',
      avatarValue: profileData.avatarValue || '🧑‍💼',
      updatedAt: new Date().toISOString()
    };
    state.lastUpdated = new Date().toISOString();
    this.saveState(state);
    return state.profile;
  }

  // =========================================================================
  // TRANSACTIONS
  // =========================================================================

  getTransactions() {
    const state = this.loadState();
    return state.transactions || [];
  }

  addTransaction(tx) {
    const state = this.loadState();
    const newTx = {
      id: tx.id || `TX_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      type: tx.type === 'INCOME' ? 'INCOME' : 'EXPENSE',
      amount: Math.round(Math.abs(Number(tx.amount) || 0)), // Ensure positive integer in VNĐ
      date: tx.date || new Date().toISOString().slice(0, 10),
      categoryId: tx.categoryId,
      walletId: tx.walletId || 'WAL_CASH',
      note: (tx.note || '').trim()
    };

    if (newTx.amount <= 0) {
      throw new Error('Số tiền phải lớn hơn 0 VNĐ!');
    }

    state.transactions.push(newTx);
    state.lastUpdated = new Date().toISOString();
    this.saveState(state);
    return newTx;
  }

  updateTransaction(tx) {
    const state = this.loadState();
    const idx = state.transactions.findIndex(t => t.id === tx.id);
    if (idx === -1) {
      throw new Error('Không tìm thấy giao dịch cần cập nhật!');
    }

    const updatedAmount = Math.round(Math.abs(Number(tx.amount) || 0));
    if (updatedAmount <= 0) {
      throw new Error('Số tiền phải lớn hơn 0 VNĐ!');
    }

    state.transactions[idx] = {
      ...state.transactions[idx],
      type: tx.type === 'INCOME' ? 'INCOME' : 'EXPENSE',
      amount: updatedAmount,
      date: tx.date,
      categoryId: tx.categoryId,
      walletId: tx.walletId || 'WAL_CASH',
      note: (tx.note || '').trim()
    };

    state.lastUpdated = new Date().toISOString();
    this.saveState(state);
    return state.transactions[idx];
  }

  deleteTransaction(id) {
    const state = this.loadState();
    const initialLen = state.transactions.length;
    state.transactions = state.transactions.filter(t => t.id !== id);
    if (state.transactions.length === initialLen) {
      return false;
    }
    state.lastUpdated = new Date().toISOString();
    this.saveState(state);
    return true;
  }

  // =========================================================================
  // CATEGORIES
  // =========================================================================

  getCategories() {
    const state = this.loadState();
    return state.categories || [];
  }

  getCategoryById(id) {
    const categories = this.getCategories();
    return categories.find(c => c.id === id) || null;
  }

  addCategory(cat) {
    const state = this.loadState();
    const name = (cat.name || '').trim();
    if (!name) throw new Error('Tên danh mục không được để trống!');

    const exists = state.categories.some(c => c.name.toLowerCase() === name.toLowerCase() && c.type === cat.type);
    if (exists) throw new Error(`Danh mục "${name}" đã tồn tại!`);

    const newCat = {
      id: cat.id || `CAT_CUSTOM_${Date.now()}`,
      name: name,
      type: cat.type === 'INCOME' ? 'INCOME' : 'EXPENSE',
      icon: cat.icon || '🏷️',
      color: cat.color || '#3b82f6',
      isDefault: false
    };

    state.categories.push(newCat);
    state.lastUpdated = new Date().toISOString();
    this.saveState(state);
    return newCat;
  }

  updateCategory(cat) {
    const state = this.loadState();
    const idx = state.categories.findIndex(c => c.id === cat.id);
    if (idx === -1) throw new Error('Không tìm thấy danh mục!');

    const name = (cat.name || '').trim();
    if (!name) throw new Error('Tên danh mục không được để trống!');

    state.categories[idx].name = name;
    state.categories[idx].icon = cat.icon || state.categories[idx].icon;
    state.categories[idx].color = cat.color || state.categories[idx].color;

    state.lastUpdated = new Date().toISOString();
    this.saveState(state);
    return state.categories[idx];
  }

  deleteCategory(id) {
    const state = this.loadState();
    const cat = state.categories.find(c => c.id === id);
    if (!cat) throw new Error('Không tìm thấy danh mục cần xóa!');
    if (cat.isDefault) {
      throw new Error('Không thể xóa danh mục mặc định của hệ thống!');
    }

    const fallbackId = cat.type === 'INCOME' ? 'CAT_INC_OTHER' : 'CAT_EXP_OTHER';
    state.transactions.forEach(t => {
      if (t.categoryId === id) {
        t.categoryId = fallbackId;
      }
    });

    state.categories = state.categories.filter(c => c.id !== id);
    state.lastUpdated = new Date().toISOString();
    this.saveState(state);
    return true;
  }

  // =========================================================================
  // WALLETS
  // =========================================================================

  getWallets() {
    const state = this.loadState();
    return state.wallets || DEFAULT_WALLETS;
  }

  getWalletById(id) {
    const wallets = this.getWallets();
    return wallets.find(w => w.id === id) || wallets[0];
  }

  // =========================================================================
  // BATCH IMPORT
  // =========================================================================

  importData(importedTransactions, mode = 'merge') {
    const state = this.loadState();
    if (mode === 'replace') {
      state.transactions = importedTransactions;
    } else {
      const existingIds = new Set(state.transactions.map(t => t.id));
      for (const tx of importedTransactions) {
        if (!existingIds.has(tx.id)) {
          state.transactions.push(tx);
          existingIds.add(tx.id);
        } else {
          const uniqueTx = { ...tx, id: `TX_${Date.now()}_${Math.floor(Math.random() * 10000)}` };
          state.transactions.push(uniqueTx);
        }
      }
    }
    state.lastUpdated = new Date().toISOString();
    this.saveState(state);
    return state.transactions.length;
  }
}

// Global instance
window.storageService = new StorageService();
