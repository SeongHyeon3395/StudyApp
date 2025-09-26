import { supabase } from '../lib/supabase';

export type ChatLanguage = 'ko' | 'en';

export async function askGemini(text: string, image_base64?: string) {
  const { data, error } = await supabase.functions.invoke('gemini-chat', {
    body: { text, image_base64 }
  });
  if (error) throw error;
  return (data as any)?.text as string;
}

// New: language-aware chat
export async function chatWithGemini(userInput: string, language: ChatLanguage = 'ko', image_base64?: string) {
  const { data, error } = await supabase.functions.invoke('gemini-chat', {
    body: { text: userInput, language, image_base64 }
  });
  if (error) throw error;
  return (data as any)?.text as string;
}

// Convenience wrappers
export const chatKo = (userInput: string, image_base64?: string) => chatWithGemini(userInput, 'ko', image_base64);
export const chatEn = (userInput: string, image_base64?: string) => chatWithGemini(userInput, 'en', image_base64);

export async function extractTextWithGemini(image_base64: string) {
  const { data, error } = await supabase.functions.invoke('ocr-extract', {
    body: { image_base64 }
  });
  if (error) throw error;
  let t = ((data as any)?.text as string) || '';
  // Normalize whitespace: convert multiple spaces to single, trim lines, preserve line breaks
  t = t.replace(/\r/g, '');
  const lines = t.split('\n').map(l => l.replace(/\s+/g, ' ').trim());
  // Remove leading bullets/artifacts like '•', '-', '·' duplicated
  const clean = lines.map(l => l.replace(/^([•\-·\*]\s*){1,}/, match => match.trim() ? match.split(/\s+/).slice(-1)[0] + ' ' : ''));
  // Join consecutive empty lines to single blank
  const out: string[] = [];
  for (const l of clean) {
    if (l === '') {
      if (out.length === 0 || out[out.length-1] === '') continue;
      out.push('');
    } else out.push(l);
  }
  return out.join('\n').trim();
}
