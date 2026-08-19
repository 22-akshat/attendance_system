/**
 * Generic TIMING column parser
 * Parses shifts like "10 TO 7", "10 TO 7:30", "8 TO 5", "9 TO 9", "9:30 to 7:00", etc.
 */
export interface ParsedShift {
  startMinutes: number;
  endMinutes: number;
  raw: string;
}

export function parseTiming(timingStr: string | null | undefined): ParsedShift {
  const fallback = { startMinutes: 10 * 60, endMinutes: 19 * 60, raw: timingStr || '10 TO 7' };
  if (!timingStr || typeof timingStr !== 'string') {
    return fallback;
  }

  const raw = timingStr.trim();
  if (!raw) return fallback;

  // Split on "TO" or "-" or "–" or "UNTIL"
  let parts: string[] = [];
  if (/\bTO\b/i.test(raw)) {
    parts = raw.split(/\bTO\b/i);
  } else if (raw.includes('-')) {
    parts = raw.split('-');
  } else if (raw.includes('–')) {
    parts = raw.split('–');
  } else {
    // try finding two numbers
    const match = raw.match(/(\d{1,2}(?::\d{2})?)\s*(?:am|pm)?\s*(?:to|-)?\s*(\d{1,2}(?::\d{2})?)\s*(?:am|pm)?/i);
    if (match) {
      parts = [match[1], match[2]];
    } else {
      return fallback;
    }
  }

  if (parts.length < 2) return fallback;

  const startPart = parts[0].trim();
  const endPart = parts[1].trim();

  // Helper to extract hour and minute from a string
  const parsePart = (str: string) => {
    const isPM = /PM/i.test(str);
    const isAM = /AM/i.test(str);
    const clean = str.replace(/[^0-9:]/g, '');
    const segments = clean.split(':');
    let h = parseInt(segments[0], 10);
    let m = segments.length > 1 ? parseInt(segments[1], 10) : 0;
    if (isNaN(h)) h = 10;
    if (isNaN(m)) m = 0;
    return { h, m, isPM, isAM };
  };

  const s = parsePart(startPart);
  const e = parsePart(endPart);

  // The start half is always AM (office opens in the morning)
  // unless explicitly marked PM >= 12
  let startHour = s.h;
  if (s.isPM && startHour < 12) startHour += 12;
  if (s.isAM && startHour === 12) startHour = 0;
  const startMinutes = startHour * 60 + s.m;

  // The end half:
  let endHour = e.h;
  const literalEndMinutes = endHour * 60 + e.m;

  if (e.isPM) {
    if (endHour < 12) endHour += 12;
  } else if (e.isAM) {
    if (endHour === 12) endHour = 0;
  } else {
    // No explicit AM/PM:
    // If its hour is < 12, add 12 (it's PM) UNLESS the parsed end is already
    // later in the day than start when read literally (e.g. 10 to 19 or 9 to 18).
    // Note: If start is 9 and end is 9, literalEndMinutes === startMinutes, so it's not strictly later,
    // which means add 12 -> 21:00 (9AM to 9PM).
    // If start is 9:30 and end is 7:00, literalEndMinutes (420) < startMinutes (570), so add 12 -> 19:00 (7PM).
    // If start is 8 and end is 17, endHour >= 12 already, so no addition.
    if (endHour < 12) {
      if (literalEndMinutes <= startMinutes || endHour <= 7 || literalEndMinutes < startMinutes + 180) {
        endHour += 12;
      }
    }
  }

  const endMinutes = endHour * 60 + e.m;

  return {
    startMinutes,
    endMinutes,
    raw,
  };
}

/**
 * Strip employee-name annotations like "NEW JOINNG 14TH JULY", "new joinning 26 june 2026",
 * "LEFT ON 10 AUG", "(Resigned 20 July)" out of the display name (keep clean name),
 * and extract the annotation text into a note field.
 */
export function cleanEmployeeNameAndNote(rawName: string): { cleanName: string; note: string | null } {
  if (!rawName || typeof rawName !== 'string') {
    return { cleanName: 'Unknown Employee', note: null };
  }

  const trimmed = rawName.trim();

  // Common patterns for notes in employee names
  const annotationPatterns = [
    /[-–—\(\[\s]*(?:NEW\s+JOIN(?:I?N?G)?|JOIN(?:ED|ING)|LEFT\s+ON|RESIGN(?:ED)?|PROBATION|INTERN|RELIEVED)[\s\w\d\/\.\-,]+(?:\)\])?$/i,
    /\(([^)]+)\)$/, // Parenthetical note at the end e.g. "John Doe (New Joining 15th July)"
    /\[([^\]]+)\]$/, // Bracketed note at the end
  ];

  let detectedNote: string | null = null;
  let cleanName = trimmed;

  for (const pattern of annotationPatterns) {
    const match = trimmed.match(pattern);
    if (match) {
      detectedNote = (match[1] || match[0]).replace(/^[-–—\(\[\s]+|[-–—\)\]\s]+$/g, '').trim();
      cleanName = trimmed.replace(pattern, '').trim();
      break;
    }
  }

  // Remove any trailing dashes or brackets left over
  cleanName = cleanName.replace(/[-–—\(\[\s]+$/, '').trim();

  // If cleanName became empty (unlikely), fallback to trimmed
  if (!cleanName) {
    cleanName = trimmed;
  }

  return {
    cleanName,
    note: detectedNote || null,
  };
}
