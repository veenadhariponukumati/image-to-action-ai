export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Auth is now an in-app email/password form (see AuthGate.tsx), not a redirect
// flow. This stub only exists so the unused DashboardLayout.tsx scaffold still compiles.
export const getLoginUrl = () => "/";
