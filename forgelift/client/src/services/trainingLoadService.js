import { request } from "./api.js";

export const trainingLoadService = {
  getTrainingLoad: () => request("/training-load")
};
