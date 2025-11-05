export function getPayCycleDates(month: number, year: number) {
  const cycleStartMonth = month === 0 ? 11 : month - 1;
  const cycleStartYear = month === 0 ? year - 1 : year;

  const payStart = new Date(cycleStartYear, cycleStartMonth, 25);
  const payEnd = new Date(year, month, 24);
  const creditDate = new Date(year, month, 5);

  return {
    payStart: payStart.toISOString().split('T')[0],
    payEnd: payEnd.toISOString().split('T')[0],
    creditDate: creditDate.toISOString().split('T')[0],
  };
}

export function countWorkingDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  let workingDays = 0;

  const current = new Date(start);
  while (current <= end) {
    if (current.getDay() !== 0) {
      workingDays++;
    }
    current.setDate(current.getDate() + 1);
  }

  return workingDays;
}

export function calculatePayslip(
  baseSalary: number,
  presentDays: number,
  workingDays: number
) {
  const perDaySalary = baseSalary / workingDays;
  const absentDays = workingDays - presentDays;
  const deductions = perDaySalary * absentDays;
  const grossSalary = baseSalary;
  const netSalary = baseSalary - deductions;

  return {
    perDaySalary: Math.round(perDaySalary * 100) / 100,
    absentDays,
    deductions: Math.round(deductions * 100) / 100,
    grossSalary: Math.round(grossSalary * 100) / 100,
    netSalary: Math.round(netSalary * 100) / 100,
  };
}
