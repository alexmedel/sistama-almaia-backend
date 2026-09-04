 
/* eslint-disable @typescript-eslint/no-unused-vars */

// Esta es la "interfaz" que todos los adaptadores deben seguir.
class StorageAdapter<T,> {
  async getFile(path: string): Promise<Blob> {
    throw new Error('getFile debe ser implementado');
  }

  async saveFile(path: string, data: any, contentType: string): Promise<any> {
    throw new Error('saveFile debe ser implementado');
  }

  async getFileUrl(path: string): Promise<string> {
    throw new Error('getFileUrl debe ser implementado');
  }
}

export default StorageAdapter;