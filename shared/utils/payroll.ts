const ANNUAL_SALARY = 52_000;
const PAYCHECKS_PER_YEAR = 26;
const EMPLOYEE_BENEFITS_YEARLY = 1_000;
const DEPENDENT_BENEFITS_YEARLY = 500;

export function calculateCompensation(dependants: number) {
  const gross = ANNUAL_SALARY / PAYCHECKS_PER_YEAR;
  const benefitsCost = (EMPLOYEE_BENEFITS_YEARLY + DEPENDENT_BENEFITS_YEARLY * dependants) / PAYCHECKS_PER_YEAR;
  const net = gross - benefitsCost;

  return {
    annualSalary: ANNUAL_SALARY,
    grossPerPaycheck: gross,
    benefitsCostPerPaycheck: benefitsCost,
    netPerPaycheck: net,
  };
}

export function parseCurrencyLikeValue(value: string): number {
  const numeric = value.replace(/[^0-9.-]/g, '');
  return Number(numeric);
}
