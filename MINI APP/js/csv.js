/**
 * SmartSpend Mini - CSV Service
 * Supports UTF-8 BOM export & robust parsing with Vietnamese font protection
 */

class CsvService {
  /**
   * Escape and quote a single cell for CSV
   */
  static escapeCell(val) {
    if (val === null || val === undefined) return '""';
    const str = String(val);
    // Replace " with "" and wrap in ""
    return `"${str.replace(/"/g, '""')}"`;
  }

  /**
   * Export transactions to CSV format with UTF-8 BOM
   */
  static exportTransactions(transactions, categories, wallets) {
    const categoryMap = new Map(categories.map(c => [c.id, c.name]));
    const walletMap = new Map(wallets.map(w => [w.id, w.name]));

    // Header exactly as specified in Section VI of spec:
    // "Mã giao dịch","Ngày","Loại","Số tiền (VNĐ)","Danh mục","Ví/Tài khoản","Ghi chú"
    const headers = [
      'Mã giao dịch',
      'Ngày',
      'Loại',
      'Số tiền (VNĐ)',
      'Danh mục',
      'Ví/Tài khoản',
      'Ghi chú'
    ];

    const rows = [headers.map(this.escapeCell).join(',')];

    // Sort transactions by date descending
    const sorted = [...transactions].sort((a, b) => b.date.localeCompare(a.date));

    for (const tx of sorted) {
      const categoryName = categoryMap.get(tx.categoryId) || 'Khác';
      const walletName = walletMap.get(tx.walletId) || 'Tiền mặt';
      const amountInt = Math.round(Math.abs(Number(tx.amount) || 0));

      const row = [
        this.escapeCell(tx.id),
        this.escapeCell(tx.date),
        this.escapeCell(tx.type),
        amountInt, // integer amount
        this.escapeCell(categoryName),
        this.escapeCell(walletName),
        this.escapeCell(tx.note || '')
      ];
      rows.push(row.join(','));
    }

    const csvContent = rows.join('\r\n');
    
    // Critical Rule 1: Prepend BOM \uFEFF for proper UTF-8 Vietnamese in Excel
    const bom = '\uFEFF';
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Generate clean filename with timestamp
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = [
      String(now.getHours()).padStart(2, '0'),
      String(now.getMinutes()).padStart(2, '0'),
      String(now.getSeconds()).padStart(2, '0')
    ].join('');
    const filename = `SmartSpend_GiaoDich_${dateStr}_${timeStr}.csv`;

    // Trigger download
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    return { filename, count: sorted.length };
  }

  /**
   * Parse a CSV string into an array of rows, properly handling quotes, commas, and newlines
   */
  static parseCSVText(text) {
    // Strip BOM if present
    if (text.charCodeAt(0) === 0xFEFF) {
      text = text.slice(1);
    }

    const rows = [];
    let currentRow = [];
    let currentCell = '';
    let inQuotes = false;
    let i = 0;

    while (i < text.length) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          currentCell += '"';
          i += 2;
          continue;
        } else {
          // Toggle quotes
          inQuotes = !inQuotes;
          i++;
          continue;
        }
      }

      if (char === ',' && !inQuotes) {
        // End of cell
        currentRow.push(currentCell.trim());
        currentCell = '';
        i++;
        continue;
      }

      if ((char === '\r' || char === '\n') && !inQuotes) {
        // End of line
        if (char === '\r' && nextChar === '\n') {
          i++; // skip \r\n together
        }
        currentRow.push(currentCell.trim());
        if (currentRow.some(cell => cell.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentCell = '';
        i++;
        continue;
      }

      currentCell += char;
      i++;
    }

    // Last cell / row if not empty
    if (currentCell.length > 0 || currentRow.length > 0) {
      currentRow.push(currentCell.trim());
      if (currentRow.some(cell => cell.length > 0)) {
        rows.push(currentRow);
      }
    }

    return rows;
  }

  /**
   * Import CSV and validate rows against existing categories and wallets
   */
  static parseTransactionsFromCSV(csvText, existingCategories, existingWallets) {
    const rawRows = this.parseCSVText(csvText);
    if (rawRows.length < 2) {
      throw new Error('File CSV không có dữ liệu giao dịch!');
    }

    // Inspect headers
    const headers = rawRows[0].map(h => h.trim().toLowerCase());
    
    // Find column indexes
    let idxId = headers.findIndex(h => h.includes('mã') || h.includes('id'));
    let idxDate = headers.findIndex(h => h.includes('ngày') || h.includes('date'));
    let idxType = headers.findIndex(h => h.includes('loại') || h.includes('type'));
    let idxAmount = headers.findIndex(h => h.includes('số tiền') || h.includes('tiền') || h.includes('amount'));
    let idxCat = headers.findIndex(h => h.includes('danh mục') || h.includes('category'));
    let idxWallet = headers.findIndex(h => h.includes('ví') || h.includes('tài khoản') || h.includes('wallet'));
    let idxNote = headers.findIndex(h => h.includes('ghi chú') || h.includes('note'));

    // Fallbacks if standard order
    if (idxDate === -1) idxDate = 1;
    if (idxType === -1) idxType = 2;
    if (idxAmount === -1) idxAmount = 3;
    if (idxCat === -1) idxCat = 4;
    if (idxWallet === -1) idxWallet = 5;
    if (idxNote === -1) idxNote = 6;

    const parsedTransactions = [];
    const newCategoriesToCreate = [];
    let skippedCount = 0;

    for (let r = 1; r < rawRows.length; r++) {
      const row = rawRows[r];
      if (!row || row.length === 0 || row.every(c => !c)) continue;

      const rawDate = row[idxDate] ? row[idxDate].trim() : '';
      const rawType = row[idxType] ? row[idxType].trim().toUpperCase() : '';
      const rawAmountStr = row[idxAmount] ? row[idxAmount].replace(/[^0-9]/g, '') : '';
      const rawCat = row[idxCat] ? row[idxCat].trim() : '';
      const rawWallet = row[idxWallet] ? row[idxWallet].trim() : '';
      const rawNote = row[idxNote] ? row[idxNote].trim() : '';
      const rawId = (idxId !== -1 && row[idxId]) ? row[idxId].trim() : '';

      // Validate amount
      const amount = parseInt(rawAmountStr, 10);
      if (isNaN(amount) || amount <= 0) {
        skippedCount++;
        continue;
      }

      // Validate date (YYYY-MM-DD or DD/MM/YYYY)
      let date = rawDate;
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(rawDate)) {
        const [d, m, y] = rawDate.split('/');
        date = `${y}-${m}-${d}`;
      } else if (!/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
        // Fallback to today
        date = new Date().toISOString().slice(0, 10);
      }

      // Validate type
      let type = 'EXPENSE';
      if (rawType === 'INCOME' || rawType.includes('THU')) {
        type = 'INCOME';
      }

      // Match category
      let categoryId = null;
      const matchedCat = existingCategories.find(c => c.name.toLowerCase() === rawCat.toLowerCase());
      if (matchedCat) {
        categoryId = matchedCat.id;
      } else if (rawCat) {
        // Need to create custom category
        const existingNewCat = newCategoriesToCreate.find(c => c.name.toLowerCase() === rawCat.toLowerCase());
        if (existingNewCat) {
          categoryId = existingNewCat.id;
        } else {
          const newCat = {
            id: `CAT_CSV_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            name: rawCat,
            type: type,
            icon: type === 'INCOME' ? '💵' : '📦',
            color: type === 'INCOME' ? '#10b981' : '#64748b',
            isDefault: false
          };
          newCategoriesToCreate.push(newCat);
          categoryId = newCat.id;
        }
      } else {
        categoryId = type === 'INCOME' ? 'CAT_INC_OTHER' : 'CAT_EXP_OTHER';
      }

      // Match wallet
      let walletId = 'WAL_CASH';
      const matchedWallet = existingWallets.find(w => w.name.toLowerCase() === rawWallet.toLowerCase());
      if (matchedWallet) {
        walletId = matchedWallet.id;
      }

      parsedTransactions.push({
        id: rawId || `TX_IMP_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
        type,
        amount,
        date,
        categoryId,
        walletId,
        note: rawNote
      });
    }

    if (parsedTransactions.length === 0) {
      throw new Error('Không đọc được giao dịch hợp lệ nào từ file CSV!');
    }

    return {
      transactions: parsedTransactions,
      newCategories: newCategoriesToCreate,
      skippedCount
    };
  }
}

// Global exposure
window.csvService = CsvService;
