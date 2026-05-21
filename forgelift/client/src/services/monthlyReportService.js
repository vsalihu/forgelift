import { request } from "./api.js";

export const monthlyReportService = {
  getMonthlyReports: () => request("/monthly-reports"),
  getCurrentMonthlyReport: () => request("/monthly-reports/current"),
  getMonthlyReport: (year, month) => request(`/monthly-reports/${year}/${month}`),
  generateMonthlyReport: (month, year) =>
    request("/monthly-reports/generate", {
      method: "POST",
      body: JSON.stringify({ month, year })
    })
};
