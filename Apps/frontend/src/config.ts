// http://localhost:8080/api
const base = import.meta.env.VITE_API_BASE_URL;


export const config = {
  apiBase: base,
  appName: import.meta.env.VITE_APP_NAME,
  Packages: `${base}/packages`,
  Categories: `${base}/categories`,
  Promotions: `${base}/promotions`,
  Cart:`${base}/cart`,
  LocalLogin: `${base}/login`,
  LineLoginURL: `${base}/auth/login/line`,
  LineMe: `${base}/me`,
  Register:`${base}/register`
};