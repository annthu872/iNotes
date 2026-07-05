// Returns a new Date moved forward by the requested number of days.
export function addDays(date, days) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

// Convenience helper for scheduling need-review cards.
export function tomorrow() {
  return addDays(new Date(), 1);
}

// Convenience helper for scheduling known cards.
export function sevenDaysFromNow() {
  return addDays(new Date(), 7);
}

// Converts Firestore timestamps, Dates, or date-like values to milliseconds.
export function getDateMillis(value) {
  if (!value) {
    return 0;
  }

  if (typeof value.toMillis === "function") {
    return value.toMillis();
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  return new Date(value).getTime() || 0;
}

// Treats null review dates as due so new flashcards can appear immediately.
export function isDueNow(value) {
  if (!value) {
    return true;
  }

  return getDateMillis(value) <= Date.now();
}
