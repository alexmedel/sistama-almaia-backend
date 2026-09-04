
 
export function mapearInformesConNombres(informes:any) {
  return informes.map((informe: { creado_por: { personas: { nombres: string; apellidos: string; }; }; actualizado_por: { personas: { nombres: string; apellidos: string; }; }; }) => ({
    ...informe,
    creado_por: `${informe.creado_por.personas.nombres} ${informe.creado_por.personas.apellidos}`,
    actualizado_por: `${informe.actualizado_por.personas.nombres} ${informe.actualizado_por.personas.apellidos}`
  }));
}

