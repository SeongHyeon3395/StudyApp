export const SUPABASE_URL = 'https://uslxiqoyrzlbjempqfyq.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzbHhpcW95cnpsYmplbXBxZnlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc0Nzg0NTEsImV4cCI6MjA3MzA1NDQ1MX0.QON5n0rwMOmMsRdMxUt0wW0mqGCrRnUo0xLWCqoE9ys';

// 백엔드 API 엔드포인트
export const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000'  // 로컬 개발용
  : 'http://YOUR_AWS_PUBLIC_IP:3000';  // AWS 서버 IP로 변경 필요

export const API_ENDPOINTS = {
  health: `${API_BASE_URL}/health`,
  gemini: `${API_BASE_URL}/api/gemini`,
  solapi: `${API_BASE_URL}/api/solapi`,
  db: `${API_BASE_URL}/api/db`,
};
