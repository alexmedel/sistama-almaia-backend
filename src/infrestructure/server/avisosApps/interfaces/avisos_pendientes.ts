export type AvisoPendiente = {
  aviso_id: number;
  aviso_titulo: string;
  aviso_contenido: string;
  expo_push_token: string;
  aviso_destinatarios_id: number;
  usuario_id: number;
  destinatario_tipo: string;
};

export function agruparPorAviso(items: AvisoPendiente[]) {
  const map = new Map<number, AvisoPendiente[]>();

  for (const item of items) {
    if (!map.has(item.aviso_id)) {
      map.set(item.aviso_id, []);
    }
    map.get(item.aviso_id)!.push(item);
  }

  return map;
}
