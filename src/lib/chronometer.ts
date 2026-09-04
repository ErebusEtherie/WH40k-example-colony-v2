// Chronometer module for formatting colony founding dates and turn tracking
// TODO: Integrate with backend chronometer system

export interface TurnInfo {
  year: number;
  quarter: number;
}

/**
 * Format colony founding age as a readable string
 * @param foundingDays - Number of days since colony founding (or founding year if currentYear provided)
 * @param currentYear - Optional current year to calculate age from founding year
 */
export const formatFoundingAge = (foundingDays: number, currentYear?: number): {
  formatted: string;
  years: number;
  months: number;
  days: number;
} => {
  // If currentYear is provided, treat foundingDays as a year
  if (currentYear !== undefined) {
    const age = currentYear - foundingDays;
    return {
      formatted: `${age} years`,
      years: age,
      months: 0,
      days: 0,
    };
  }
  
  // Otherwise, treat as days since founding
  const years = Math.floor(foundingDays / 365);
  const remainingDays = foundingDays % 365;
  const months = Math.floor(remainingDays / 30);
  const days = remainingDays % 30;
  
  const parts: string[] = [];
  if (years > 0) parts.push(`${years}y`);
  if (months > 0) parts.push(`${months}m`);
  if (days > 0) parts.push(`${days}d`);
  
  return {
    formatted: parts.length > 0 ? parts.join(' ') : '0d',
    years,
    months,
    days,
  };
};

export const getCurrentTurn = (): TurnInfo => {
  // Stub - should be fetched from backend
  return { year: 814, quarter: 1 };
};

export const advanceTurn = (current: TurnInfo): TurnInfo => {
  let newQuarter = current.quarter + 1;
  let newYear = current.year;
  
  if (newQuarter > 4) {
    newQuarter = 1;
    newYear += 1;
  }
  
  return { year: newYear, quarter: newQuarter };
};