 
export function distinctPorCampo<T,>(array: Array<any>, campo: string): Array<T> {
  const vistos = new Set();
  return array.filter(objeto => {
    const esNuevo = !vistos.has(objeto[campo]);
    if (esNuevo) {
      vistos.add(objeto[campo]);
    }
    return esNuevo;
  });
}