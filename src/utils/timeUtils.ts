/**
 * Convert minutes from midnight (0..1440) to formatted clock string "HH:MM" (24h)
 */
export function minutesToTimeString(minutes: number): string {
  const normalized = Math.max(0, Math.min(1439, Math.round(minutes)));
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/**
 * Convert minutes from midnight to 12h clock string "10:15 AM", "07:00 PM"
 */
export function minutesTo12HourString(minutes: number): string {
  const normalized = Math.max(0, Math.min(1439, Math.round(minutes)));
  let h = Math.floor(normalized / 60);
  const m = normalized % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m.toString().padStart(2, '0')} ${ampm}`;
}

/**
 * Format total minutes to human duration, e.g. 150 -> "2h 30m" or "2.5 hrs"
 */
export function formatDurationHours(minutes: number): string {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs === 0) return `${mins}m`;
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${mins}m`;
}

/**
 * Parse a time string or Date object into minutes from midnight (0..1440)
 */
export function extractTimeMinutes(val: any): { minutes: number | null; timeStr: string | null; isMalformed: boolean } {
  if (val === null || val === undefined || val === '') {
    return { minutes: null, timeStr: null, isMalformed: false };
  }

  // If it's a JS Date (from XLSX cellDates: true)
  if (val instanceof Date || (typeof val === 'object' && typeof val.getTime === 'function')) {
    if (isNaN(val.getTime())) {
      return { minutes: null, timeStr: null, isMalformed: true };
    }
    const h = val.getHours();
    const m = val.getMinutes();
    const s = val.getSeconds();
    // Sometimes excel dates have rounded seconds
    const totalMinutes = h * 60 + m + (s >= 30 ? 1 : 0);
    return {
      minutes: totalMinutes,
      timeStr: minutesToTimeString(totalMinutes),
      isMalformed: false,
    };
  }

  // If it's a number (Excel serial fraction of a day, e.g., 0.42638)
  if (typeof val === 'number') {
    if (val >= 0 && val <= 1) {
      const totalMinutes = Math.round(val * 24 * 60);
      return {
        minutes: totalMinutes,
        timeStr: minutesToTimeString(totalMinutes),
        isMalformed: false,
      };
    } else if (val > 1) {
      // It might be a full Excel datetime serial like 44200.426
      const fraction = val - Math.floor(val);
      const totalMinutes = Math.round(fraction * 24 * 60);
      return {
        minutes: totalMinutes,
        timeStr: minutesToTimeString(totalMinutes),
        isMalformed: false,
      };
    }
  }

  // If it's a string
  const str = String(val).trim();
  if (!str || str.toLowerCase() === 'null' || str === '-') {
    return { minutes: null, timeStr: null, isMalformed: false };
  }

  // Check if string contains standard ISO date or time pattern
  // E.g., "1899-12-30T10:14:00.000Z" or "10:14:00" or "10:14" or "10:14 AM"
  if (str.includes('T') || str.includes('Z')) {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      const h = d.getHours();
      const m = d.getMinutes();
      const totalMinutes = h * 60 + m;
      return {
        minutes: totalMinutes,
        timeStr: minutesToTimeString(totalMinutes),
        isMalformed: false,
      };
    }
  }

  // Match 12h or 24h formats like "10:15:30", "10:15", "10:15 AM", "7:30 PM"
  const timeRegex = /(\d{1,2})[:.](\d{2})(?:[:.]\d{2})?\s*(AM|PM)?/i;
  const match = str.match(timeRegex);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const ampm = match[3] ? match[3].toUpperCase() : null;

    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;

    if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
      const totalMinutes = hours * 60 + minutes;
      return {
        minutes: totalMinutes,
        timeStr: minutesToTimeString(totalMinutes),
        isMalformed: false,
      };
    }
  }

  // Check if it's just an hour like "10", "19", "7"
  const simpleHour = str.match(/^(\d{1,2})\s*(AM|PM)?$/i);
  if (simpleHour) {
    let hours = parseInt(simpleHour[1], 10);
    const ampm = simpleHour[2] ? simpleHour[2].toUpperCase() : null;
    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
    if (hours >= 0 && hours < 24) {
      const totalMinutes = hours * 60;
      return {
        minutes: totalMinutes,
        timeStr: minutesToTimeString(totalMinutes),
        isMalformed: false,
      };
    }
  }

  return { minutes: null, timeStr: str, isMalformed: true };
}
