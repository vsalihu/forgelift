import { request } from "./api.js";

const toQueryString = (filters = {}) => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  const query = params.toString();
  return query ? `?${query}` : "";
};

export const personalRecordService = {
  getPersonalRecords: (filters) => request(`/personal-records${toQueryString(filters)}`),
  getTimeline: () => request("/personal-records/timeline"),
  getSummary: () => request("/personal-records/summary")
};
