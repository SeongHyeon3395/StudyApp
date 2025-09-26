import { supabase } from '../lib/supabase';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import RNFetchBlob from 'react-native-blob-util';

export async function currentUserId() {
  const { data } = await supabase.auth.getUser();
  const uid = data.user?.id;
  if (!uid) throw new Error('로그인 필요');
  return uid;
}

export async function generatePdfBytesFromText(text: string) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  // Try to embed a Unicode-capable font for Korean (NotoSansKR). Fallback to Helvetica.
  let font: any;
  let customFontEmbedded = false;
  try {
    // Load from bundled assets path; adjust if different.
    const assetPath = RNFetchBlob.fs.asset ? RNFetchBlob.fs.asset('fonts/NotoSansKR-Regular.otf') : '';
    let bytes: Uint8Array | null = null;
    const decodeB64ToUint8 = (b64: string) => {
      const bin = RNFetchBlob.base64.decode(b64);
      const out = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
      return out;
    };
    if (assetPath) {
      const data = await RNFetchBlob.fs.readFile(assetPath, 'base64');
      bytes = decodeB64ToUint8(data);
    } else {
      // Fallback try: known android assets path
      const altPath = 'assets/fonts/NotoSansKR-Regular.otf';
      if (await RNFetchBlob.fs.exists(altPath)) {
        const data = await RNFetchBlob.fs.readFile(altPath, 'base64');
        bytes = decodeB64ToUint8(data);
      }
    }
    if (bytes) {
      font = await pdfDoc.embedFont(bytes, { subset: true });
      customFontEmbedded = true;
    } else {
      font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    }
  } catch {
    font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  }
  const fontSize = 12;
  const maxWidth = 595.28 - 60;
  const original = text || '';
  const hasUnicode = /[^\x00-\x7F]/.test(original);
  if (hasUnicode && !customFontEmbedded) {
    throw new Error('한글 텍스트를 PDF에 포함하려면 NotoSansKR 폰트를 추가해야 합니다. assets/fonts/NotoSansKR-Regular.otf를 프로젝트에 넣고 빌드 후 다시 시도하세요.');
  }
  const lines = wrapText(original, 100); // 아주 단순 줄바꿈
  let y = 800;
  lines.forEach(line => {
    page.drawText(line, { x: 30, y, size: fontSize, font, color: rgb(0,0,0) });
    y -= 16;
  });
  const bytes = await pdfDoc.save(); // Uint8Array
  return bytes;
}

function wrapText(t: string, n=100) {
  const arr: string[] = [];
  const s = String(t).replace(/\r/g,'');
  s.split('\n').forEach(line => {
    if (line.length <= n) { arr.push(line); return; }
    for (let i=0;i<line.length;i+=n) arr.push(line.slice(i, i+n));
  });
  return arr;
}

export async function uploadPdfToLibrary(fileName: string, pdfBytes: Uint8Array) {
  const uid = await currentUserId();
  const path = `${uid}/${fileName.replace(/\.pdf$/i,'')}.pdf`;
  const { error } = await supabase.storage.from('library').upload(path, pdfBytes, {
    contentType: 'application/pdf', upsert: true
  });
  if (error) throw error;
  return path;
}

export async function listLibrary() {
  const uid = await currentUserId();
  const { data, error } = await supabase.storage.from('library').list(uid, { limit: 100 });
  if (error) throw error;
  return data || [];
}

export async function getSignedUrl(path: string, expiresInSeconds = 60) {
  const { data, error } = await supabase.storage.from('library').createSignedUrl(path, expiresInSeconds);
  if (error) throw error;
  return data.signedUrl as string;
}
