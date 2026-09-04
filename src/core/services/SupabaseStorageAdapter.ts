 
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import StorageAdapter from '../interface/IStorageAdapter';
// import { SupabaseClientService } from './supabaseClient';
import { SupabaseAdminService } from './supabaseAdmin';

class SupabaseStorageAdapter extends StorageAdapter<any> {
  private supabase: SupabaseClient;
  private bucketName: string;

  constructor(options: { url?: string, anonKey?: string, bucketName: string }) {
    super();
    const { url, anonKey, bucketName } = options;
    // Si no se proporcionan url y anonKey, se usa el cliente de Supabase por defecto
    // que se obtiene del servicio SupabaseClientService.
    if (!url || !anonKey) {
      const supabaseService = new SupabaseAdminService();
      this.supabase = supabaseService.getClient();
    } else {
      this.supabase = createClient(url, anonKey);
    }
    this.bucketName = bucketName;
  }

  async getFile(path: string): Promise<Blob> {
    const { data, error } = await this.supabase.storage
      .from(this.bucketName)
      .download(path);
    if (error) {
      throw error;
    }
    return data; // Retorna un Blob
  }

  async saveFile(path: string, data: any, contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const { data: uploadData, error } = await this.supabase.storage
      .from(this.bucketName)
      .upload(path, data, {
        contentType: contentType,
        upsert: true, // Si el archivo ya existe, lo sobrescribe
      });

    if (error) {
      throw error;
    }

    return uploadData;
  }

  async getFileUrl(path: string): Promise<string> {
    const { data } = await this.supabase.storage
      .from(this.bucketName)
      .getPublicUrl(path);
    if (!data || !data.publicUrl) {
      throw new Error('No se pudo obtener la URL pública del archivo');
    }
    return data.publicUrl; // Retorna la URL pública del archivo
  }

  async getPrivateURL(filePath: string): Promise<string | null> {
    const { data, error } = await this.supabase.storage
      .from(this.bucketName)
      .createSignedUrl(filePath, 3600); // URL válida por 1 hora
    if (error) {
      console.error('Error generating signed URL:', error.message);

      return null;
    }
    return data?.signedUrl || null; // Retorna la URL firmada
  }

  extractBase64Info(base64String: string) {
    const matches = base64String.match(/^data:(.+);base64,(.+)$/);
    if (!matches) throw new Error('Invalid Base64 string');
    return {
      mimeType: matches[1],
      base64Data: matches[2],
    };
  }
}

export default SupabaseStorageAdapter;