import { request } from "./api.js";

export const userService = {
  getDataReadiness: () => request("/users/data-readiness")
};
