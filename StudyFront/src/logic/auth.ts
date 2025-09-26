import { supabase } from '../lib/supabase';

const onlyDigits = (s:string) => s.replace(/\D/g,'');
const toE164KR = (raw: string) => {
  const d = onlyDigits(raw);
  if (!d) return '';
  if (d.startsWith('0')) return '+82' + d.slice(1);
  if (d.startsWith('82')) return '+' + d;
  return '+' + d;
};

// ===== Basic Auth helpers =====
export async function signUp(email: string, password: string, name?: string, birth?: string, phone?: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name, birth, phone } },
  });
  if (error) throw error;
  return data.user;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.session;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function sendPhoneCode(phoneFormatted: string) {
  // Edge Function으로 위임 (숫자만 전송)
  const phone = onlyDigits(phoneFormatted);
  const { data, error } = await supabase.functions.invoke('otp-send', { body: { phone } });
  if (error) throw error;
  if (!(data as any)?.ok) throw new Error((data as any)?.reason || 'SEND_FAILED');
}

export async function verifyPhoneCode(phoneFormatted: string, code: string) {
  // Edge Function으로 검증 (세션 생성 없이 검증만)
  const phone = onlyDigits(phoneFormatted);
  const { data, error } = await supabase.functions.invoke('otp-verify', { body: { phone, code } });
  if (error) throw error;
  if (!(data as any)?.ok) throw new Error((data as any)?.reason || 'VERIFY_FAILED');
  return true;
}

export async function signUpWithEmailAndProfile(params: {
  name: string; email: string; birth: string; phone: string; password: string;
}) {
  const { name, email, birth, phone, password } = params;
  // 'YYYY.MM.DD' 또는 기타 입력을 YYYY-MM-DD로 정규화 (DB birth_date: date)
  const birthNorm = (birth || '').trim()
    .replace(/\./g, '-')
    .replace(/\s+/g, '');
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, birth: birthNorm, phone },
      emailRedirectTo: 'studysnap://auth-callback' // 원하면 딥링크
    }
  });
  if (error) throw error;
  // 회원가입 직후 profiles upsert 시도 (이메일 인증이 켜져있으면 세션이 없어 실패할 수 있어, 실패는 무시)
  try {
    const userId = data.user?.id;
    if (userId) {
      await supabase
        .from('profiles')
        .upsert({ id: userId, name, email, birth_date: birthNorm || null, phone }, { onConflict: 'id' });
    }
  } catch (_) {
    // RLS/세션 부재로 실패할 수 있음 — 첫 로그인 시 재시도
  }
  return data.user;
}

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  // 로그인 후 현재 사용자 메타데이터로 profiles 보강
  try {
    const uRes = await supabase.auth.getUser();
    const u = uRes.data.user;
    if (u?.id) {
      const meta: any = u.user_metadata || {};
      const birthNorm = (meta.birth || '').toString().trim().replace(/\./g, '-').replace(/\s+/g, '') || null;
      await supabase
        .from('profiles')
        .upsert({
          id: u.id,
          name: meta.name,
          email: u.email ?? meta.email,
          birth_date: birthNorm,
          phone: meta.phone,
        }, { onConflict: 'id' });
    }
  } catch (_) {
    // 네트워크/RLS 이슈는 무시 (다음 기회에 재시도됨)
  }
  return data.session;
}

export async function findAccountByPhoneOtp(phoneFormatted: string, code: string) {
  const phone = onlyDigits(phoneFormatted);
  const { data, error } = await supabase.functions.invoke('find-email-by-phone', { body: { phone, code } });
  if (error) throw error;
  if (!(data as any)?.ok) throw new Error((data as any)?.reason || 'LOOKUP_FAILED');
  return (data as any).emailMasked as string;
}

export async function sendPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'studysnap://reset-password' // 딥링크/웹URL 등록 필요
  });
  if (error) throw error;
}
