const DEFAULT_API_URL = 'http://localhost:5000/api';

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();

export const API_BASE_URL = (configuredApiUrl || DEFAULT_API_URL).replace(/\/+$/, '');

// Backend menyajikan file upload di root server, bukan di bawah /api.
export const SERVER_BASE_URL = API_BASE_URL.replace(/\/api$/, '');

export const resolveServerUrl = (url) => {
  if (!url) return '';
  const uploadPath = String(url).match(/\/uploads\/.+$/);
  if (uploadPath) return `${SERVER_BASE_URL}${uploadPath[0]}`;
  if (/^https?:\/\//i.test(url)) return url;
  return `${SERVER_BASE_URL}${String(url).startsWith('/') ? '' : '/'}${url}`;
};
