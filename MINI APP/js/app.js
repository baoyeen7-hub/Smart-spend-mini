/**
 * SmartSpend Mini - Main Application Controller
 * Mobile-First Personal Finance Web App & PWA
 */

class SmartSpendApp {
  constructor() {
    // Current selected period
    const now = new Date();
    this.selectedYear = now.getFullYear();
    this.selectedMonth = now.getMonth() + 1; // 1-12

    // Active navigation tab
    this.activeTab = 'overview'; // 'overview', 'transactions', 'categories', 'settings'

    // Filters for transactions tab
    this.txFilterType = 'ALL'; // 'ALL', 'EXPENSE', 'INCOME'
    this.txFilterCategory = 'ALL';
    this.txSearchKeyword = '';

    // Active category management tab
    this.catMgmtType = 'EXPENSE'; // 'EXPENSE' or 'INCOME'

    // Form modal state
    this.editingTxId = null;
    this.formTxType = 'EXPENSE';
    this.selectedCategoryId = null;

    // Category form modal state
    this.editingCatId = null;
    this.formCatType = 'EXPENSE';
    this.selectedCatEmoji = '🏷️';
    this.selectedCatColor = '#10b981';

    // Profile form state
    this.profileFormAvatarType = 'emoji';
    this.profileFormAvatarValue = '🧑‍💼';

    // Deferred install prompt for PWA
    this.deferredPrompt = null;

    this.init();
  }

  init() {
    this.bindEvents();
    this.initPWA();
    this.updateMonthDisplay();
    this.renderProfile();
    this.render();
  }

  // =========================================================================
  // UTILITIES & FORMATTING
  // =========================================================================

  formatVND(amount) {
    const val = Math.round(Number(amount) || 0);
    return new Intl.NumberFormat('vi-VN').format(val) + ' ₫';
  }

  formatDateVN(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  }

  getDayTitle(dateStr) {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    if (dateStr === today) {
      return `Hôm nay, ${this.formatDateVN(dateStr)}`;
    } else if (dateStr === yesterday) {
      return `Hôm qua, ${this.formatDateVN(dateStr)}`;
    }

    const d = new Date(dateStr + 'T00:00:00');
    const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const dayName = isNaN(d.getDay()) ? '' : dayNames[d.getDay()] + ', ';
    return `${dayName}${this.formatDateVN(dateStr)}`;
  }

  getTimeGreeting() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return 'Chào buổi sáng';
    if (hour >= 11 && hour < 14) return 'Chào buổi trưa';
    if (hour >= 14 && hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  }

  showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = '✓';
    if (type === 'error') icon = '✕';
    if (type === 'info') icon = 'ℹ';

    toast.innerHTML = `<span style="font-size: 16px;">${icon}</span><span>${message}</span>`;
    container.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }

  // =========================================================================
  // PROFILE MANAGEMENT & RENDERING
  // =========================================================================

  renderProfile() {
    const profile = window.storageService.getProfile();
    const greeting = this.getTimeGreeting();

    // Header Profile Elements
    const avatarContainer = document.getElementById('header-avatar');
    const greetingEl = document.getElementById('header-greeting');
    const nameEl = document.getElementById('header-name');
    const roleEl = document.getElementById('header-role');

    if (avatarContainer) {
      if (profile.avatarType === 'image' && profile.avatarValue) {
        avatarContainer.innerHTML = `<img src="${profile.avatarValue}" alt="Avatar" class="avatar-img-circle">`;
      } else {
        avatarContainer.innerHTML = `<span class="avatar-emoji-span">${profile.avatarValue || '🧑‍💼'}</span>`;
      }
    }

    if (greetingEl) greetingEl.textContent = `${greeting},`;
    if (nameEl) nameEl.textContent = profile.name || 'Bạn mới';
    if (roleEl) roleEl.textContent = profile.role || 'Quản lý tài chính';

    // Settings Profile Card
    const settingsAvatar = document.getElementById('settings-profile-avatar');
    const settingsName = document.getElementById('settings-profile-name');
    const settingsRole = document.getElementById('settings-profile-role');

    if (settingsAvatar) {
      if (profile.avatarType === 'image' && profile.avatarValue) {
        settingsAvatar.innerHTML = `<img src="${profile.avatarValue}" alt="Avatar" class="avatar-img-circle">`;
      } else {
        settingsAvatar.innerHTML = `<span class="avatar-emoji-span">${profile.avatarValue || '🧑‍💼'}</span>`;
      }
    }
    if (settingsName) settingsName.textContent = profile.name || 'Bạn mới';
    if (settingsRole) settingsRole.textContent = profile.role || 'Quản lý tài chính';
  }

  openProfileModal() {
    const profile = window.storageService.getProfile();
    this.profileFormAvatarType = profile.avatarType || 'emoji';
    this.profileFormAvatarValue = profile.avatarValue || '🧑‍💼';

    document.getElementById('profile-name-input').value = profile.name || '';
    document.getElementById('profile-role-input').value = profile.role || '';

    this.updateProfileAvatarPreview();
    this.renderQuickAvatars();

    this.showModal('modal-profile');
  }

  updateProfileAvatarPreview() {
    const previewEl = document.getElementById('profile-avatar-preview');
    if (!previewEl) return;

    if (this.profileFormAvatarType === 'image' && this.profileFormAvatarValue) {
      previewEl.innerHTML = `<img src="${this.profileFormAvatarValue}" alt="Avatar" class="avatar-preview-img">`;
    } else {
      previewEl.innerHTML = `<span class="avatar-preview-emoji">${this.profileFormAvatarValue || '🧑‍💼'}</span>`;
    }
  }

  renderQuickAvatars() {
    const avatars = ['🧑‍💼', '👩‍💼', '👨‍💻', '👩‍💻', '👨‍🎨', '👩‍🔬', '🧑‍🎓', '🦊', '🦁', '🐱', '🚀', '⭐'];
    const container = document.getElementById('quick-avatar-grid');
    if (!container) return;

    container.innerHTML = avatars.map(av => `
      <button type="button" class="quick-avatar-btn ${this.profileFormAvatarType === 'emoji' && this.profileFormAvatarValue === av ? 'active' : ''}" 
              onclick="window.app.selectAvatarEmoji('${av}')">
        ${av}
      </button>
    `).join('');
  }

  selectAvatarEmoji(emoji) {
    this.profileFormAvatarType = 'emoji';
    this.profileFormAvatarValue = emoji;
    this.updateProfileAvatarPreview();
    this.renderQuickAvatars();
  }

  handleAvatarFileUpload(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    // Check size (< 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Vui lòng chọn ảnh có kích thước dưới 5MB!');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Resize to 128x128 max on canvas to keep localStorage safe and fast
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const size = 128;
        canvas.width = size;
        canvas.height = size;

        // Draw centered and cropped
        const minDim = Math.min(img.width, img.height);
        const sx = (img.width - minDim) / 2;
        const sy = (img.height - minDim) / 2;
        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        this.profileFormAvatarType = 'image';
        this.profileFormAvatarValue = dataUrl;
        this.updateProfileAvatarPreview();
        this.renderQuickAvatars();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  saveProfileFromForm() {
    const nameInput = document.getElementById('profile-name-input');
    const roleInput = document.getElementById('profile-role-input');

    const name = (nameInput.value || '').trim();
    if (!name) {
      alert('Vui lòng nhập Họ và Tên!');
      nameInput.focus();
      return;
    }

    const role = (roleInput.value || '').trim();

    window.storageService.updateProfile({
      name,
      role,
      avatarType: this.profileFormAvatarType,
      avatarValue: this.profileFormAvatarValue
    });

    this.renderProfile();
    this.closeModal('modal-profile');
    this.showToast('Đã lưu hồ sơ cá nhân thành công!');
  }

  // =========================================================================
  // MONTH NAVIGATION
  // =========================================================================

  updateMonthDisplay() {
    const monthText = `Tháng ${String(this.selectedMonth).padStart(2, '0')}/${this.selectedYear}`;
    const displayBtn = document.getElementById('btn-month-display');
    const now = new Date();
    const isCurrent = this.selectedYear === now.getFullYear() && this.selectedMonth === (now.getMonth() + 1);

    if (displayBtn) {
      displayBtn.innerHTML = `📅 ${monthText}${isCurrent ? ' <span class="current-month-badge">Hiện tại</span>' : ''}`;
    }

    const hiddenPicker = document.getElementById('hidden-month-input');
    if (hiddenPicker) {
      hiddenPicker.value = `${this.selectedYear}-${String(this.selectedMonth).padStart(2, '0')}`;
    }
  }

  prevMonth() {
    if (this.selectedMonth === 1) {
      this.selectedMonth = 12;
      this.selectedYear--;
    } else {
      this.selectedMonth--;
    }
    this.updateMonthDisplay();
    this.render();
  }

  nextMonth() {
    if (this.selectedMonth === 12) {
      this.selectedMonth = 1;
      this.selectedYear++;
    } else {
      this.selectedMonth++;
    }
    this.updateMonthDisplay();
    this.render();
  }

  setMonthFromPicker(val) {
    if (!val) return;
    const [y, m] = val.split('-').map(Number);
    if (y && m) {
      this.selectedYear = y;
      this.selectedMonth = m;
      this.updateMonthDisplay();
      this.render();
    }
  }

  // =========================================================================
  // DATA FILTERING & STATS
  // =========================================================================

  getTransactionsForSelectedMonth() {
    const all = window.storageService.getTransactions();
    const prefix = `${this.selectedYear}-${String(this.selectedMonth).padStart(2, '0')}`;
    return all.filter(t => t.date && t.date.startsWith(prefix));
  }

  calculateStats() {
    const transactions = this.getTransactionsForSelectedMonth();
    let totalIncome = 0;
    let totalExpense = 0;

    for (const t of transactions) {
      const amt = Number(t.amount) || 0;
      if (t.type === 'INCOME') {
        totalIncome += amt;
      } else {
        totalExpense += amt;
      }
    }

    const balance = totalIncome - totalExpense;
    return { totalIncome, totalExpense, balance, count: transactions.length };
  }

  calculateWalletBalances() {
    const allTransactions = window.storageService.getTransactions();
    const wallets = window.storageService.getWallets();

    return wallets.map(wallet => {
      let balance = wallet.initialBalance || 0;
      for (const t of allTransactions) {
        if (t.walletId === wallet.id) {
          const amt = Number(t.amount) || 0;
          if (t.type === 'INCOME') {
            balance += amt;
          } else {
            balance -= amt;
          }
        }
      }
      return { ...wallet, currentBalance: balance };
    });
  }

  // =========================================================================
  // RENDERING
  // =========================================================================

  render() {
    switch (this.activeTab) {
      case 'overview':
        this.renderOverview();
        break;
      case 'transactions':
        this.renderTransactionsList();
        break;
      case 'categories':
        this.renderCategoriesList();
        break;
      case 'settings':
        this.renderSettings();
        break;
    }
  }

  switchTab(tabName) {
    this.activeTab = tabName;
    document.querySelectorAll('.tab-pane').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

    const targetPane = document.getElementById(`tab-${tabName}`);
    if (targetPane) targetPane.classList.add('active');

    const targetNav = document.getElementById(`nav-${tabName}`);
    if (targetNav) targetNav.classList.add('active');

    this.render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // --- TAB 1: OVERVIEW ---
  renderOverview() {
    const stats = this.calculateStats();
    
    // Balance Card
    const balanceEl = document.getElementById('overview-balance');
    const incomeEl = document.getElementById('overview-income');
    const expenseEl = document.getElementById('overview-expense');

    if (balanceEl) {
      const sign = stats.balance > 0 ? '+' : '';
      balanceEl.textContent = `${sign}${this.formatVND(stats.balance)}`;
      balanceEl.className = 'balance-amount ' + (stats.balance > 0 ? 'positive' : (stats.balance < 0 ? 'negative' : 'neutral'));
    }
    if (incomeEl) incomeEl.textContent = this.formatVND(stats.totalIncome);
    if (expenseEl) expenseEl.textContent = this.formatVND(stats.totalExpense);

    // Wallets Horizontal Scroll
    const walletsContainer = document.getElementById('overview-wallets');
    if (walletsContainer) {
      const walletsWithBal = this.calculateWalletBalances();
      walletsContainer.innerHTML = walletsWithBal.map(w => `
        <div class="wallet-chip">
          <div class="wallet-chip-header">
            <span>${w.icon}</span>
            <span>${w.name}</span>
          </div>
          <div class="wallet-chip-amount">${this.formatVND(w.currentBalance)}</div>
        </div>
      `).join('');
    }

    // Top Category Spending Breakdown
    const breakdownContainer = document.getElementById('overview-category-breakdown');
    if (breakdownContainer) {
      const monthTx = this.getTransactionsForSelectedMonth();
      const expenseTx = monthTx.filter(t => t.type === 'EXPENSE');
      const catTotals = {};

      for (const t of expenseTx) {
        catTotals[t.categoryId] = (catTotals[t.categoryId] || 0) + Number(t.amount);
      }

      const sortedCatIds = Object.keys(catTotals).sort((a, b) => catTotals[b] - catTotals[a]);

      if (sortedCatIds.length === 0) {
        breakdownContainer.innerHTML = `
          <div class="empty-breakdown-card">
            <span style="font-size: 20px;">📊</span>
            <span>Chưa có khoản chi tiêu nào trong tháng này.</span>
          </div>
        `;
      } else {
        const categories = window.storageService.getCategories();
        const top5 = sortedCatIds.slice(0, 5);

        breakdownContainer.innerHTML = top5.map(catId => {
          const cat = categories.find(c => c.id === catId) || { name: 'Khác', icon: '📦', color: '#64748b' };
          const spend = catTotals[catId];
          const pct = Math.min(100, Math.round((spend / (stats.totalExpense || 1)) * 100));

          return `
            <div class="cat-bar-item">
              <div class="cat-bar-label">
                <span>${cat.icon} ${cat.name} (${pct}%)</span>
                <span>${this.formatVND(spend)}</span>
              </div>
              <div class="cat-bar-track">
                <div class="cat-bar-fill" style="width: ${pct}%; background-color: ${cat.color || '#10b981'};"></div>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    // Recent Transactions in Month (Max 5)
    const recentContainer = document.getElementById('overview-recent-tx');
    if (recentContainer) {
      const monthTx = this.getTransactionsForSelectedMonth();
      monthTx.sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
      const recent5 = monthTx.slice(0, 5);

      if (recent5.length === 0) {
        recentContainer.innerHTML = `
          <div class="empty-state-modern">
            <div class="empty-state-icon-modern">🍃</div>
            <div class="empty-state-title">Danh sách giao dịch đang trống</div>
            <div class="empty-state-desc">Hãy nhấn nút "+" phía dưới để thêm giao dịch đầu tiên, hoặc nạp dữ liệu mẫu để thử nghiệm ngay.</div>
            <div class="empty-state-actions">
              <button class="btn-sample-load" onclick="window.app.loadSampleData()">
                ⚡ Nạp dữ liệu mẫu
              </button>
              <button class="btn-quick-add-empty" onclick="window.app.openAddTxModal()">
                + Thêm giao dịch
              </button>
            </div>
          </div>
        `;
      } else {
        recentContainer.innerHTML = recent5.map(t => this.renderTransactionCardHTML(t)).join('');
      }
    }
  }

  // --- TAB 2: TRANSACTIONS LIST ---
  renderTransactionsList() {
    const catSelect = document.getElementById('tx-filter-cat');
    if (catSelect && catSelect.children.length <= 1) {
      const categories = window.storageService.getCategories();
      catSelect.innerHTML = `<option value="ALL">Tất cả danh mục</option>` +
        categories.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('');
      catSelect.value = this.txFilterCategory;
    }

    const monthTx = this.getTransactionsForSelectedMonth();
    let filtered = monthTx.filter(t => {
      if (this.txFilterType !== 'ALL' && t.type !== this.txFilterType) return false;
      if (this.txFilterCategory !== 'ALL' && t.categoryId !== this.txFilterCategory) return false;
      if (this.txSearchKeyword) {
        const kw = this.txSearchKeyword.toLowerCase();
        const cat = window.storageService.getCategoryById(t.categoryId);
        const catName = cat ? cat.name.toLowerCase() : '';
        const note = (t.note || '').toLowerCase();
        const amountStr = String(t.amount);
        if (!catName.includes(kw) && !note.includes(kw) && !amountStr.includes(kw)) {
          return false;
        }
      }
      return true;
    });

    filtered.sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));

    const listContainer = document.getElementById('transactions-grouped-list');
    if (!listContainer) return;

    if (filtered.length === 0) {
      listContainer.innerHTML = `
        <div class="empty-state-modern">
          <div class="empty-state-icon-modern">🔍</div>
          <div class="empty-state-title">Chưa có giao dịch phù hợp</div>
          <div class="empty-state-desc">Thử thay đổi bộ lọc hoặc thêm khoản thu chi mới nhé.</div>
          <button class="btn-quick-add-empty" onclick="window.app.openAddTxModal()" style="margin-top: 12px;">
            + Thêm giao dịch mới
          </button>
        </div>
      `;
      return;
    }

    // Group by Date
    const groups = {};
    for (const t of filtered) {
      if (!groups[t.date]) groups[t.date] = [];
      groups[t.date].push(t);
    }

    const html = Object.keys(groups).map(dateStr => {
      const groupTx = groups[dateStr];
      let dayIncome = 0;
      let dayExpense = 0;

      for (const t of groupTx) {
        if (t.type === 'INCOME') dayIncome += Number(t.amount);
        else dayExpense += Number(t.amount);
      }

      const dayNet = dayIncome - dayExpense;
      const netSign = dayNet > 0 ? '+' : '';
      const netColor = dayNet >= 0 ? '#059669' : '#e11d48';

      return `
        <div class="transaction-group">
          <div class="group-header">
            <span class="group-header-date">📅 ${this.getDayTitle(dateStr)}</span>
            <span class="group-net" style="color: ${netColor}; font-weight: 700;">${netSign}${this.formatVND(dayNet)}</span>
          </div>
          ${groupTx.map(t => this.renderTransactionCardHTML(t)).join('')}
        </div>
      `;
    }).join('');

    listContainer.innerHTML = html;
  }

  renderTransactionCardHTML(t) {
    const cat = window.storageService.getCategoryById(t.categoryId) || { name: 'Khác', icon: '📦', color: '#64748b' };
    const wallet = window.storageService.getWalletById(t.walletId) || { name: 'Tiền mặt' };
    const isIncome = t.type === 'INCOME';
    const sign = isIncome ? '+' : '-';
    const amountClass = isIncome ? 'income' : 'expense';

    return `
      <div class="tx-card" onclick="window.app.openEditTxModal('${t.id}')">
        <div class="tx-left">
          <div class="tx-icon-wrap" style="background-color: ${cat.color}1a; color: ${cat.color};">
            ${cat.icon}
          </div>
          <div class="tx-info">
            <div class="tx-category">${cat.name}</div>
            <div class="tx-note-meta">
              <span class="tx-wallet-tag">${wallet.name}</span>
              ${t.note ? `<span>• ${this.escapeHtml(t.note)}</span>` : ''}
            </div>
          </div>
        </div>
        <div class="tx-right">
          <div class="tx-amount ${amountClass}">${sign}${this.formatVND(t.amount)}</div>
        </div>
      </div>
    `;
  }

  // --- TAB 3: CATEGORIES MANAGER ---
  renderCategoriesList() {
    const categories = window.storageService.getCategories();
    const filtered = categories.filter(c => c.type === this.catMgmtType);

    const listContainer = document.getElementById('categories-list');
    if (!listContainer) return;

    listContainer.innerHTML = filtered.map(c => `
      <div class="cat-item-card">
        <div class="cat-item-left">
          <div class="cat-item-icon" style="background-color: ${c.color}20; color: ${c.color};">
            ${c.icon}
          </div>
          <div class="cat-item-name">${c.name}</div>
        </div>
        <div class="cat-actions">
          ${c.isDefault ? `
            <span class="cat-badge-default">Mặc định</span>
          ` : `
            <button class="btn-icon-action" title="Sửa danh mục" onclick="window.app.openEditCatModal('${c.id}')">✏️</button>
            <button class="btn-icon-action danger" title="Xóa danh mục" onclick="window.app.confirmDeleteCat('${c.id}')">🗑️</button>
          `}
        </div>
      </div>
    `).join('');
  }

  // --- TAB 4: SETTINGS ---
  renderSettings() {
    this.renderProfile();
    const installBtn = document.getElementById('btn-pwa-install');
    if (installBtn && this.deferredPrompt) {
      installBtn.style.display = 'flex';
    }
  }

  // =========================================================================
  // TRANSACTION ADD / EDIT MODAL
  // =========================================================================

  openAddTxModal() {
    this.editingTxId = null;
    this.formTxType = 'EXPENSE';
    
    document.getElementById('modal-tx-title').textContent = 'Thêm Giao Dịch Mới';
    document.getElementById('btn-tx-delete').style.display = 'none';

    document.getElementById('tx-amount-input').value = '';
    document.getElementById('tx-amount-input').classList.remove('error');
    document.getElementById('tx-amount-error').classList.remove('show');

    const today = new Date().toISOString().slice(0, 10);
    document.getElementById('tx-date-input').value = today;
    document.getElementById('tx-note-input').value = '';

    this.populateWalletSelect('tx-wallet-select', 'WAL_CASH');
    this.setFormTxType('EXPENSE');

    this.showModal('modal-transaction');
  }

  openEditTxModal(txId) {
    const transactions = window.storageService.getTransactions();
    const tx = transactions.find(t => t.id === txId);
    if (!tx) return;

    this.editingTxId = txId;
    this.formTxType = tx.type;

    document.getElementById('modal-tx-title').textContent = 'Chỉnh Sửa Giao Dịch';
    document.getElementById('btn-tx-delete').style.display = 'block';

    const amountFormatted = new Intl.NumberFormat('vi-VN').format(tx.amount);
    document.getElementById('tx-amount-input').value = amountFormatted;
    document.getElementById('tx-amount-input').classList.remove('error');
    document.getElementById('tx-amount-error').classList.remove('show');

    document.getElementById('tx-date-input').value = tx.date;
    document.getElementById('tx-note-input').value = tx.note || '';

    this.populateWalletSelect('tx-wallet-select', tx.walletId);
    this.selectedCategoryId = tx.categoryId;

    this.setFormTxType(tx.type, false);
    this.showModal('modal-transaction');
  }

  setFormTxType(type, resetCategory = true) {
    this.formTxType = type;
    const btnExpense = document.getElementById('btn-form-type-expense');
    const btnIncome = document.getElementById('btn-form-type-income');

    if (type === 'EXPENSE') {
      btnExpense.className = 'type-btn active expense';
      btnIncome.className = 'type-btn';
    } else {
      btnExpense.className = 'type-btn';
      btnIncome.className = 'type-btn active income';
    }

    this.renderCategoryPicker(resetCategory);
  }

  renderCategoryPicker(resetCategory = true) {
    const grid = document.getElementById('tx-category-grid');
    if (!grid) return;

    const categories = window.storageService.getCategories().filter(c => c.type === this.formTxType);
    
    if (resetCategory || !this.selectedCategoryId || !categories.some(c => c.id === this.selectedCategoryId)) {
      this.selectedCategoryId = categories.length > 0 ? categories[0].id : null;
    }

    grid.innerHTML = categories.map(c => `
      <div class="cat-pick-item ${c.id === this.selectedCategoryId ? 'active' : ''}" 
           data-cat-id="${c.id}"
           onclick="window.app.selectCategoryInForm('${c.id}')">
        <div class="cat-pick-icon">${c.icon}</div>
        <div class="cat-pick-name">${c.name}</div>
      </div>
    `).join('');
  }

  selectCategoryInForm(catId) {
    this.selectedCategoryId = catId;
    document.querySelectorAll('.cat-pick-item').forEach(el => {
      if (el.getAttribute('data-cat-id') === catId) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });
  }

  populateWalletSelect(elementId, selectedId = 'WAL_CASH') {
    const select = document.getElementById(elementId);
    if (!select) return;
    const wallets = window.storageService.getWallets();
    select.innerHTML = wallets.map(w => `
      <option value="${w.id}" ${w.id === selectedId ? 'selected' : ''}>${w.icon} ${w.name}</option>
    `).join('');
  }

  formatAmountInput(input) {
    const raw = input.value.replace(/[^0-9]/g, '');
    if (!raw) {
      input.value = '';
      return;
    }
    const intVal = parseInt(raw, 10);
    input.value = new Intl.NumberFormat('vi-VN').format(intVal);
  }

  addQuickAmount(addedValue) {
    const input = document.getElementById('tx-amount-input');
    const currentRaw = input.value.replace(/[^0-9]/g, '');
    const currentInt = currentRaw ? parseInt(currentRaw, 10) : 0;
    const newInt = currentInt + addedValue;
    input.value = new Intl.NumberFormat('vi-VN').format(newInt);
  }

  saveTransactionFromForm() {
    const amountInput = document.getElementById('tx-amount-input');
    const errorMsg = document.getElementById('tx-amount-error');
    const rawAmount = amountInput.value.replace(/[^0-9]/g, '');
    const amount = parseInt(rawAmount, 10);

    if (isNaN(amount) || amount <= 0) {
      amountInput.classList.add('error');
      errorMsg.textContent = 'Vui lòng nhập số tiền hợp lệ (> 0 VNĐ)!';
      errorMsg.classList.add('show');
      amountInput.focus();
      return;
    }

    const date = document.getElementById('tx-date-input').value;
    if (!date) {
      alert('Vui lòng chọn ngày giao dịch!');
      return;
    }

    if (!this.selectedCategoryId) {
      alert('Vui lòng chọn một danh mục!');
      return;
    }

    const walletId = document.getElementById('tx-wallet-select').value;
    const note = document.getElementById('tx-note-input').value;

    try {
      if (this.editingTxId) {
        window.storageService.updateTransaction({
          id: this.editingTxId,
          type: this.formTxType,
          amount,
          date,
          categoryId: this.selectedCategoryId,
          walletId,
          note
        });
        this.showToast('Đã cập nhật giao dịch thành công!');
      } else {
        window.storageService.addTransaction({
          type: this.formTxType,
          amount,
          date,
          categoryId: this.selectedCategoryId,
          walletId,
          note
        });
        this.showToast('Đã thêm giao dịch mới!');
      }

      this.closeModal('modal-transaction');
      this.render();
    } catch (e) {
      alert(e.message || 'Lỗi khi lưu giao dịch!');
    }
  }

  confirmDeleteTransaction() {
    if (!this.editingTxId) return;

    const tx = window.storageService.getTransactions().find(t => t.id === this.editingTxId);
    if (!tx) return;

    const cat = window.storageService.getCategoryById(tx.categoryId);
    const catName = cat ? cat.name : 'Giao dịch';
    const amountStr = this.formatVND(tx.amount);

    this.showConfirmation(
      'Xóa giao dịch này?',
      `Bạn có chắc chắn muốn xóa giao dịch "${catName}" số tiền ${amountStr} ngày ${this.formatDateVN(tx.date)}? Thao tác này không thể hoàn tác.`,
      () => {
        window.storageService.deleteTransaction(this.editingTxId);
        this.closeModal('modal-transaction');
        this.showToast('Đã xóa giao dịch!', 'info');
        this.render();
      }
    );
  }

  // =========================================================================
  // CATEGORY MODAL (ADD / EDIT)
  // =========================================================================

  openAddCatModal() {
    this.editingCatId = null;
    this.formCatType = this.catMgmtType;
    this.selectedCatEmoji = this.formCatType === 'INCOME' ? '💰' : '☕';
    this.selectedCatColor = '#10b981';

    document.getElementById('modal-cat-title').textContent = 'Thêm Danh Mục Mới';
    document.getElementById('cat-name-input').value = '';
    
    this.setupCatFormTypeButtons();
    this.renderEmojiPicker();
    this.renderColorPicker();

    this.showModal('modal-category');
  }

  openEditCatModal(catId) {
    const cat = window.storageService.getCategoryById(catId);
    if (!cat) return;
    if (cat.isDefault) {
      alert('Không thể chỉnh sửa danh mục mặc định của hệ thống!');
      return;
    }

    this.editingCatId = catId;
    this.formCatType = cat.type;
    this.selectedCatEmoji = cat.icon;
    this.selectedCatColor = cat.color;

    document.getElementById('modal-cat-title').textContent = 'Chỉnh Sửa Danh Mục';
    document.getElementById('cat-name-input').value = cat.name;

    this.setupCatFormTypeButtons();
    this.renderEmojiPicker();
    this.renderColorPicker();

    this.showModal('modal-category');
  }

  setupCatFormTypeButtons() {
    const btnExpense = document.getElementById('btn-cat-type-expense');
    const btnIncome = document.getElementById('btn-cat-type-income');

    if (this.formCatType === 'EXPENSE') {
      btnExpense.className = 'type-btn active expense';
      btnIncome.className = 'type-btn';
    } else {
      btnExpense.className = 'type-btn';
      btnIncome.className = 'type-btn active income';
    }
  }

  setCatFormType(type) {
    this.formCatType = type;
    this.setupCatFormTypeButtons();
  }

  renderEmojiPicker() {
    const emojis = [
      '🍔', '☕', '🍜', '🍕', '🍻', '🚗', '🛵', '⛽', '🚌', '✈️', 
      '📚', '🎓', '🎮', '🎬', '🎧', '🏠', '🛋️', '🛍️', '👕', '👟', 
      '💊', '🏋️', '🐾', '💡', '💰', '💵', '📱', '🎁', '📈', '💎',
      '💼', '🏆', '🎉', '💈', '🏖️'
    ];
    const container = document.getElementById('cat-emoji-picker');
    if (!container) return;

    container.innerHTML = emojis.map(em => `
      <button type="button" class="emoji-btn ${em === this.selectedCatEmoji ? 'active' : ''}" 
              onclick="window.app.selectCatEmoji('${em}')">${em}</button>
    `).join('');
  }

  selectCatEmoji(emoji) {
    this.selectedCatEmoji = emoji;
    this.renderEmojiPicker();
  }

  renderColorPicker() {
    const colors = [
      '#10b981', '#059669', '#3b82f6', '#6366f1', '#8b5cf6', 
      '#ec4899', '#f43f5e', '#ef4444', '#f97316', '#f59e0b', 
      '#84cc16', '#06b6d4', '#14b8a6', '#64748b', '#0f172a'
    ];
    const container = document.getElementById('cat-color-picker');
    if (!container) return;

    container.innerHTML = colors.map(col => `
      <div class="color-dot ${col === this.selectedCatColor ? 'active' : ''}" 
           style="background-color: ${col};" 
           onclick="window.app.selectCatColor('${col}')"></div>
    `).join('');
  }

  selectCatColor(color) {
    this.selectedCatColor = color;
    this.renderColorPicker();
  }

  saveCategoryFromForm() {
    const nameInput = document.getElementById('cat-name-input');
    const name = (nameInput.value || '').trim();

    if (!name) {
      alert('Vui lòng nhập tên danh mục!');
      nameInput.focus();
      return;
    }

    try {
      if (this.editingCatId) {
        window.storageService.updateCategory({
          id: this.editingCatId,
          name,
          icon: this.selectedCatEmoji,
          color: this.selectedCatColor
        });
        this.showToast(`Đã cập nhật danh mục "${name}"!`);
      } else {
        window.storageService.addCategory({
          name,
          type: this.formCatType,
          icon: this.selectedCatEmoji,
          color: this.selectedCatColor
        });
        this.showToast(`Đã thêm danh mục "${name}"!`);
      }

      this.closeModal('modal-category');
      this.render();
    } catch (e) {
      alert(e.message || 'Lỗi khi lưu danh mục!');
    }
  }

  confirmDeleteCat(catId) {
    const cat = window.storageService.getCategoryById(catId);
    if (!cat) return;
    if (cat.isDefault) {
      alert('Không thể xóa danh mục mặc định của hệ thống!');
      return;
    }

    this.showConfirmation(
      'Xóa danh mục tùy chỉnh?',
      `Bạn có chắc muốn xóa danh mục "${cat.name}"? Các giao dịch thuộc danh mục này sẽ được tự động chuyển về danh mục "Khác".`,
      () => {
        try {
          window.storageService.deleteCategory(catId);
          this.showToast(`Đã xóa danh mục "${cat.name}"!`, 'info');
          this.render();
        } catch (e) {
          alert(e.message);
        }
      }
    );
  }

  // =========================================================================
  // SAMPLE DATA & RESET
  // =========================================================================

  loadSampleData() {
    const count = window.storageService.loadSampleData();
    this.showToast(`Đã nạp ${count} giao dịch mẫu để thử nghiệm!`);
    this.render();
  }

  confirmResetData() {
    this.showConfirmation(
      'Đặt lại dữ liệu về 0 ₫?',
      'Toàn bộ giao dịch sẽ bị xóa sạch hoàn toàn (Tổng thu = 0 ₫, Tổng chi = 0 ₫, Số dư = 0 ₫). Danh mục mặc định và Hồ sơ cá nhân vẫn được giữ lại.\n\nBạn có chắc chắn?',
      () => {
        window.storageService.resetToDefault(true);
        this.showToast('Đã xóa sạch giao dịch về 0 ₫!', 'info');
        this.render();
      }
    );
  }

  // =========================================================================
  // CSV EXPORT / IMPORT
  // =========================================================================

  exportCSV() {
    try {
      const transactions = window.storageService.getTransactions();
      const categories = window.storageService.getCategories();
      const wallets = window.storageService.getWallets();

      if (transactions.length === 0) {
        alert('Sổ chi tiêu đang trống, chưa có giao dịch nào để xuất file!');
        return;
      }

      const res = window.csvService.exportTransactions(transactions, categories, wallets);
      this.showToast(`Đã xuất ${res.count} giao dịch ra file CSV UTF-8!`);
    } catch (e) {
      console.error(e);
      alert('Lỗi xuất file CSV: ' + e.message);
    }
  }

  triggerImportCSV() {
    const fileInput = document.getElementById('csv-file-input');
    if (fileInput) {
      fileInput.value = '';
      fileInput.click();
    }
  }

  handleCSVFileSelected(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const categories = window.storageService.getCategories();
        const wallets = window.storageService.getWallets();

        const parsed = window.csvService.parseTransactionsFromCSV(text, categories, wallets);
        this.pendingImportData = parsed;

        this.showConfirmation(
          'Tùy chọn nhập dữ liệu CSV',
          `Tìm thấy ${parsed.transactions.length} giao dịch hợp lệ${parsed.skippedCount ? ` (bỏ qua ${parsed.skippedCount} dòng không hợp lệ)` : ''}.${parsed.newCategories.length > 0 ? ` Sẽ tự động tạo thêm ${parsed.newCategories.length} danh mục mới.` : ''}\n\nBạn muốn:`,
          () => {
            this.executeImport('merge');
          },
          'Ghép vào dữ liệu cũ',
          () => {
            this.executeImport('replace');
          },
          'Ghi đè thay thế tất cả'
        );

      } catch (err) {
        console.error(err);
        alert('Lỗi khi đọc file CSV: ' + err.message);
      }
    };
    reader.readAsText(file, 'utf-8');
  }

  executeImport(mode) {
    if (!this.pendingImportData) return;
    const { transactions, newCategories } = this.pendingImportData;

    for (const newCat of newCategories) {
      try {
        window.storageService.addCategory(newCat);
      } catch (e) {}
    }

    const total = window.storageService.importData(transactions, mode);
    this.pendingImportData = null;
    this.showToast(`Nhập dữ liệu thành công! Tổng cộng: ${total} giao dịch.`);
    this.render();
  }

  // =========================================================================
  // MODAL / DIALOG CONTROLS
  // =========================================================================

  showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.style.display = 'flex';
    requestAnimationFrame(() => modal.classList.add('show'));
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.remove('show');
    setTimeout(() => {
      modal.style.display = 'none';
    }, 250);
  }

  showConfirmation(title, message, onConfirm, confirmText = 'Xác nhận', onAlt = null, altText = null) {
    const titleEl = document.getElementById('confirm-title');
    const msgEl = document.getElementById('confirm-message');
    const btnConfirm = document.getElementById('btn-confirm-yes');
    const btnAlt = document.getElementById('btn-confirm-alt');
    const btnCancel = document.getElementById('btn-confirm-cancel');

    titleEl.textContent = title;
    msgEl.textContent = message;

    btnConfirm.textContent = confirmText;
    btnConfirm.onclick = () => {
      this.closeModal('modal-confirm');
      if (onConfirm) onConfirm();
    };

    if (onAlt && altText) {
      btnAlt.style.display = 'block';
      btnAlt.textContent = altText;
      btnAlt.onclick = () => {
        this.closeModal('modal-confirm');
        onAlt();
      };
    } else {
      btnAlt.style.display = 'none';
    }

    btnCancel.onclick = () => {
      this.closeModal('modal-confirm');
    };

    this.showModal('modal-confirm');
  }

  escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // =========================================================================
  // PWA REGISTRATION & INSTALLATION
  // =========================================================================

  initPWA() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
          .then(reg => {
            console.log('ServiceWorker registered with scope:', reg.scope);
          })
          .catch(err => {
            console.log('ServiceWorker registration safe in standard mode:', err);
          });
      });
    }

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      const banner = document.getElementById('pwa-install-banner');
      if (banner) banner.style.display = 'flex';
      const btn = document.getElementById('btn-pwa-install');
      if (btn) btn.style.display = 'flex';
    });

    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      const banner = document.getElementById('pwa-install-banner');
      if (banner) banner.style.display = 'none';
      this.showToast('Đã thêm SmartSpend vào Màn hình chính!');
    });
  }

  promptPWAInstall() {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      this.deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted PWA prompt');
        }
        this.deferredPrompt = null;
      });
    } else {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      if (isIOS) {
        alert('Cài đặt trên iPhone (Safari):\n1. Nhấn nút Chia sẻ (biểu tượng hình vuông mũi tên lên)\n2. Chọn "Thêm vào Màn hình chính" (Add to Home Screen)');
      } else {
        alert('Để thêm app vào màn hình chính:\nNhấn vào menu 3 chấm của trình duyệt và chọn "Thêm vào màn hình chính" (Add to Home Screen).');
      }
    }
  }

  // =========================================================================
  // EVENT BINDINGS
  // =========================================================================

  bindEvents() {
    // Header Profile Click
    const headerProfile = document.getElementById('header-profile-btn');
    if (headerProfile) {
      headerProfile.addEventListener('click', () => this.openProfileModal());
    }

    const btnEditProfileSettings = document.getElementById('btn-edit-profile-settings');
    if (btnEditProfileSettings) {
      btnEditProfileSettings.addEventListener('click', () => this.openProfileModal());
    }

    // Profile form
    const formProfile = document.getElementById('form-profile');
    if (formProfile) {
      formProfile.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveProfileFromForm();
      });
    }

    const avatarFileInput = document.getElementById('profile-avatar-file');
    if (avatarFileInput) {
      avatarFileInput.addEventListener('change', (e) => this.handleAvatarFileUpload(e));
    }

    // Month navigation
    document.getElementById('btn-prev-month').addEventListener('click', () => this.prevMonth());
    document.getElementById('btn-next-month').addEventListener('click', () => this.nextMonth());
    
    const btnMonthDisplay = document.getElementById('btn-month-display');
    const hiddenPicker = document.getElementById('hidden-month-input');
    btnMonthDisplay.addEventListener('click', () => {
      if (hiddenPicker) {
        hiddenPicker.showPicker ? hiddenPicker.showPicker() : hiddenPicker.click();
      }
    });
    hiddenPicker.addEventListener('change', (e) => {
      this.setMonthFromPicker(e.target.value);
    });

    // Bottom Navigation
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tab = e.currentTarget.getAttribute('data-tab');
        if (tab) this.switchTab(tab);
      });
    });

    // Floating add button
    document.getElementById('btn-fab-add').addEventListener('click', () => {
      this.openAddTxModal();
    });

    // Transaction form amount formatting
    const amountInput = document.getElementById('tx-amount-input');
    amountInput.addEventListener('input', (e) => {
      this.formatAmountInput(e.target);
      e.target.classList.remove('error');
      document.getElementById('tx-amount-error').classList.remove('show');
    });

    // Form Type Switcher
    document.getElementById('btn-form-type-expense').addEventListener('click', () => {
      this.setFormTxType('EXPENSE');
    });
    document.getElementById('btn-form-type-income').addEventListener('click', () => {
      this.setFormTxType('INCOME');
    });

    document.getElementById('form-transaction').addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveTransactionFromForm();
    });

    document.getElementById('btn-tx-delete').addEventListener('click', () => {
      this.confirmDeleteTransaction();
    });

    // Category Management Switcher
    document.getElementById('btn-cat-mgmt-expense').addEventListener('click', () => {
      document.getElementById('btn-cat-mgmt-expense').classList.add('active');
      document.getElementById('btn-cat-mgmt-income').classList.remove('active');
      this.catMgmtType = 'EXPENSE';
      this.renderCategoriesList();
    });
    document.getElementById('btn-cat-mgmt-income').addEventListener('click', () => {
      document.getElementById('btn-cat-mgmt-income').classList.add('active');
      document.getElementById('btn-cat-mgmt-expense').classList.remove('active');
      this.catMgmtType = 'INCOME';
      this.renderCategoriesList();
    });

    document.getElementById('btn-open-add-cat').addEventListener('click', () => {
      this.openAddCatModal();
    });

    document.getElementById('btn-cat-type-expense').addEventListener('click', () => {
      this.setCatFormType('EXPENSE');
    });
    document.getElementById('btn-cat-type-income').addEventListener('click', () => {
      this.setCatFormType('INCOME');
    });

    document.getElementById('form-category').addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveCategoryFromForm();
    });

    // Transactions list filters
    const searchInput = document.getElementById('tx-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.txSearchKeyword = e.target.value.trim();
        this.renderTransactionsList();
      });
    }

    const catSelect = document.getElementById('tx-filter-cat');
    if (catSelect) {
      catSelect.addEventListener('change', (e) => {
        this.txFilterCategory = e.target.value;
        this.renderTransactionsList();
      });
    }

    document.querySelectorAll('.type-seg-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.type-seg-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.txFilterType = e.currentTarget.getAttribute('data-type');
        this.renderTransactionsList();
      });
    });

    // Settings Actions
    document.getElementById('btn-export-csv').addEventListener('click', () => this.exportCSV());
    document.getElementById('btn-import-csv').addEventListener('click', () => this.triggerImportCSV());
    document.getElementById('csv-file-input').addEventListener('change', (e) => this.handleCSVFileSelected(e));
    
    const btnLoadSampleSettings = document.getElementById('btn-load-sample-settings');
    if (btnLoadSampleSettings) {
      btnLoadSampleSettings.addEventListener('click', () => this.loadSampleData());
    }

    document.getElementById('btn-reset-data').addEventListener('click', () => this.confirmResetData());

    // PWA install triggers
    const pwaBtnBanner = document.getElementById('btn-banner-install');
    if (pwaBtnBanner) pwaBtnBanner.addEventListener('click', () => this.promptPWAInstall());
    const pwaBtnSettings = document.getElementById('btn-pwa-install');
    if (pwaBtnSettings) pwaBtnSettings.addEventListener('click', () => this.promptPWAInstall());

    // Close buttons on modals
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modalId = e.currentTarget.getAttribute('data-close-modal');
        this.closeModal(modalId);
      });
    });

    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          this.closeModal(backdrop.id);
        }
      });
    });
  }
}

// Instantiate App when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new SmartSpendApp();
});
