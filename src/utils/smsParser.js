/**
 * Simple NLP SMS Parser for Uzbek Bank Transaction Messages
 * Supported banks/apps: Humo, Uzcard, Click, Payme, TBC Bank, Kapitalbank, Anorbank, etc.
 */
export const parseBankSMS = (text) => {
  if (!text || !text.trim()) return null;

  const normalized = text.toLowerCase();
  
  // 1. Determine transaction type
  let type = 'expense'; // default
  const incomeKeywords = [
    'kirim', 'tushum', 'daromad', 'postuplenie', 'zachislenie', 
    'keltirildi', 'popolnenie', 'vhod', 'polucheno', 'поступление', 
    'зачисление', 'кирим', 'пополнение'
  ];
  
  for (const keyword of incomeKeywords) {
    if (normalized.includes(keyword)) {
      type = 'income';
      break;
    }
  }

  // 2. Extract transaction amount
  // Match numbers optionally formatted with spaces/commas followed by currency (uzs, so'm, som, сум, сўм, sum)
  const amountRegex = /(\d[\d\s,.]*)\s*(uzs|so'm|som|сум|сўм|sum|s'om)/i;
  const matchAmount = text.match(amountRegex);
  let amount = 0;

  if (matchAmount && matchAmount[1]) {
    // Strip spaces, commas, and dots
    const cleanedAmount = matchAmount[1].replace(/[\s,.]/g, '');
    amount = parseFloat(cleanedAmount) || 0;
  } else {
    // Fallback: search for any sequence of numbers greater than 100
    const fallbackRegex = /(\d[\d\s]{2,8})/g;
    const matches = text.match(fallbackRegex);
    if (matches && matches.length > 0) {
      // Find the first matching number, clean it and use it
      const cleaned = matches[0].replace(/\s/g, '');
      amount = parseFloat(cleaned) || 0;
    }
  }

  if (amount <= 0) return null; // Extraction failed

  // 3. Extract card info (search for humo, uzcard, click, payme, or mask like *1234)
  let bank = 'bank_cash'; // fallback
  if (normalized.includes('humo')) {
    bank = 'bank_humo';
  } else if (normalized.includes('uzcard')) {
    bank = 'bank_uzcard';
  } else if (normalized.includes('tbc')) {
    bank = 'bank_tbc';
  } else if (normalized.includes('anor')) {
    bank = 'bank_anor';
  } else if (normalized.includes('kapital')) {
    bank = 'bank_kapital';
  } else {
    // Look for four-digit mask like *1234
    const cardMaskRegex = /\*(\d{4})/;
    const maskMatch = text.match(cardMaskRegex);
    if (maskMatch) {
      // We can try to bind it or assign to Uzcard/Humo defaults
      bank = 'bank_humo'; // default card match
    }
  }

  // 4. Extract merchant / description
  // Extract text between amount and card, or search for merchant keywords
  let description = '';
  const lines = text.split('\n');
  
  // Find clean words that represent merchant
  const wordsToFilter = [
    'kirim', 'chiqim', 'karta', 'balans', 'kartasi', 'click', 'payme', 
    'anorbank', 'tbc', 'kapitalbank', 'uzs', 'so\'m', 'som', 'сум', 
    'сўм', 'vremya', 'data', 'vaqt', 'sana', 'operatsiya', 'kod'
  ];

  // Try to find the merchant on the same line as "chiqim" or "списание"
  let targetLine = lines[0];
  for (const line of lines) {
    if (line.toLowerCase().includes('chiqim') || line.toLowerCase().includes('kirim') || line.toLowerCase().includes('списание') || line.toLowerCase().includes('поступление')) {
      targetLine = line;
      break;
    }
  }

  // Filter out bank system jargon to get pure description
  const cleanTokens = targetLine
    .replace(/[^a-zA-Zа-яА-Я0-9\s.-]/g, '')
    .split(/\s+/)
    .filter(token => {
      const lower = token.toLowerCase();
      return !wordsToFilter.includes(lower) && isNaN(lower) && lower.length > 2;
    });

  if (cleanTokens.length > 0) {
    description = cleanTokens.slice(0, 3).join(' '); // take first 3 merchant terms
  } else {
    description = type === 'income' ? 'Поступление средств' : 'Оплата услуг';
  }

  return {
    type,
    amount,
    bank,
    description: description.trim(),
    date: new Date().toISOString().split('T')[0] // default to today
  };
};
