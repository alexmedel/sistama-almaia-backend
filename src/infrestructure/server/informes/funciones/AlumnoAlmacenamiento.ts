import SupabaseStorageAdapter from "../../../../core/services/SupabaseStorageAdapter";

const storageAdapter = new SupabaseStorageAdapter({
  bucketName: "informes",
});

export const AlmacenamientoServicio = {
  async descargarPlantilla(ruta: string): Promise<Buffer> {
    const templateBlob = await storageAdapter.getFile(ruta);
    if (!templateBlob) {
      throw new Error(`No se encontró la plantilla en Supabase: ${ruta}`);
    }
    return Buffer.from(await templateBlob.arrayBuffer());
  },

  async guardarArchivo(ruta: string, buffer: Buffer, mimeType: string): Promise<string> {
    const { id } = await storageAdapter.saveFile(ruta, buffer, mimeType);
    if (!id) {
      throw new Error(`Error al guardar el archivo en Supabase: ${ruta}`);
    }
    return storageAdapter.getFileUrl(ruta);
  },
};