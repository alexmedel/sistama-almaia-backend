import { SupabaseClient } from "@supabase/supabase-js";

export function isBase64DataUrl(input: string): boolean {
  return /^data:([a-zA-Z0-9-+/.]+);base64,/.test(input);
}

export function extractBase64Info(base64String: string) {
  const matches = base64String.match(/^data:(.+);base64,(.+)$/);
  if (!matches) throw new Error('Invalid Base64 string');
  return {
    mimeType: matches[1],
    base64Data: matches[2],
  };
}

export function getExtensionFromMime(mimeType: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'application/pdf': 'pdf',
    'text/plain': 'txt',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',  
    'application/vnd.ms-excel': 'xls',  
  };
  return map[mimeType] || 'bin';
}
export function getURL(supabase:SupabaseClient,bucket:string,private_url:string){
  const { data: { publicUrl } } = supabase
  .storage
  .from(bucket)
  .getPublicUrl(private_url);
  return publicUrl
}
interface SignedURLResponse {
  signedUrl: string;
}
export async function getPrivateURL(
  supabase: SupabaseClient,
  bucket: string,
  filePath: string
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(filePath, 3600) as { data: SignedURLResponse | null; error: Error | null };

  if (error) {
    console.error('Error generating signed URL:', error.message);
    return null;
  }

  return data?.signedUrl || null;
}
