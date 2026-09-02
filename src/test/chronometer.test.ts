import { describe, it, expect } from "vitest";
import { formatFoundingAge } from "../lib/chronometer";

describe("Chronometer & Planetary Calendar — formatFoundingAge", () => {
  it("formats zero days correctly", () => {
    const result = formatFoundingAge(0);
    expect(result.formatted).toBe("0 days");
    expect(result.years).toBe(0);
    expect(result.months).toBe(0);
    expect(result.days).toBe(0);
  });

  it("handles negative or invalid values gracefully by clamping to 0", () => {
    const result = formatFoundingAge(-100);
    expect(result.formatted).toBe("0 days");
    expect(result.years).toBe(0);
    expect(result.months).toBe(0);
    expect(result.days).toBe(0);

    // NaN or undefined
    const nanResult = formatFoundingAge(Number.NaN);
    expect(nanResult.formatted).toBe("0 days");
  });

  it("formats singular day correctly", () => {
    const result = formatFoundingAge(1);
    expect(result.formatted).toBe("1 day");
    expect(result.days).toBe(1);
    expect(result.months).toBe(0);
    expect(result.years).toBe(0);
  });

  it("formats plural days under a month", () => {
    const result = formatFoundingAge(25);
    expect(result.formatted).toBe("25 days");
    expect(result.days).toBe(25);
    expect(result.months).toBe(0);
    expect(result.years).toBe(0);
  });

  it("formats months with singular and plural variants", () => {
    // 30 days = 1 month 0 days
    const oneMonth = formatFoundingAge(30);
    expect(oneMonth.formatted).toBe("1 month 0 days");
    expect(oneMonth.months).toBe(1);
    expect(oneMonth.days).toBe(0);

    // 65 days = 2 months 5 days
    const twoMonths = formatFoundingAge(65);
    expect(twoMonths.formatted).toBe("2 months 5 days");
    expect(twoMonths.months).toBe(2);
    expect(twoMonths.days).toBe(5);
  });

  it("formats full year spans correctly with singular and plural units", () => {
    // 365 days = 1 year 0 days
    const oneYear = formatFoundingAge(365);
    expect(oneYear.formatted).toBe("1 year 0 days");
    expect(oneYear.years).toBe(1);
    expect(oneYear.months).toBe(0);
    expect(oneYear.days).toBe(0);

    // 1 year, 1 month, 1 day = 365 + 30 + 1 = 396
    const comboSingular = formatFoundingAge(396);
    expect(comboSingular.formatted).toBe("1 year 1 month 1 day");
    expect(comboSingular.years).toBe(1);
    expect(comboSingular.months).toBe(1);
    expect(comboSingular.days).toBe(1);

    // 2 years, 3 months, 14 days = 2*365 (730) + 3*30 (90) + 14 = 834
    const comboPlural = formatFoundingAge(834);
    expect(comboPlural.formatted).toBe("2 years 3 months 14 days");
    expect(comboPlural.years).toBe(2);
    expect(comboPlural.months).toBe(3);
    expect(comboPlural.days).toBe(14);
  });
});
