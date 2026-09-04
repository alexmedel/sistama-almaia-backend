import axios, { AxiosError } from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

const VAULT_ADDR = process.env.VAULT_ADDR;
const VAULT_USER = process.env.VAULT_USER;
const VAULT_PASS = process.env.VAULT_PASS;

if (!VAULT_ADDR || !VAULT_USER || !VAULT_PASS) {
  throw new Error('Faltan variables de entorno: VAULT_ADDR, VAULT_USER o VAULT_PASS');
}

interface VaultLoginResponse {
  auth: {
    client_token: string;
    // puedes agregar más propiedades si las necesitas
  };
}

interface VaultSecretResponse {
  data: {
    data: Record<string, string>;
    // metadata?: { ... } // opcional, según configuración del Vault
  };
}

/**
 * Inicia sesión en Vault con userpass y obtiene el token.
 */
export async function loginToVault(): Promise<string | null> {
  try {
    const url = `${VAULT_ADDR}/v1/auth/userpass/login/${VAULT_USER}`;
    const response = await axios.post<VaultLoginResponse>(url, {
      password: VAULT_PASS,
    });
    return response.data.auth.client_token;
  } catch (err) {
    const error = err as AxiosError;
    console.error('❌ Error en login:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Obtiene secretos desde una ruta del Vault.
 * @param token - Token de autenticación
 * @param path - Ruta del secreto (por defecto: secret/data/my-secret)
 */
export async function getSecret(
  token: string,
  path = 'secret/data/my-secret'
): Promise<Record<string, string> | null> {
  try {
    const url = `${VAULT_ADDR}/v1/${path}`;
    const response = await axios.get<VaultSecretResponse>(url, {
      headers: {
        'X-Vault-Token': token,
      },
    });
    return response.data.data.data;
  } catch (err) {
    const error = err as AxiosError;
    console.error('❌ Error al obtener secreto:', error.response?.data || error.message);
    return null;
  }
}
