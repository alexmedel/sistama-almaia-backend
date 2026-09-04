import { Request, Response } from "express";

import { DataService } from "../DataService";
import { ApoderadoDireccion } from "../../../core/modelo/apoderado/ApoderadoDireccion";

const dataService:DataService<ApoderadoDireccion> = new DataService("alumnos_respuestas");
export const ApoderadoDireccionService = {
    async obtener(req: Request, res: Response) {
        try {
            const apoderados_direcciones = [
                {
                  "apoderado_direccion_id": 1,
                  "apoderado_id": 2001,
                  "descripcion": "Casa principal",
                  "ubicaciones_mapa": "-33.4489, -70.6693",
                  "comuna_id": 101,
                  "region_id": 13,
                  "pais_id": 1,
                  
                  // Relaciones completas
                  "apoderados": [{
                    "apoderado_id": 2001,
                    "persona_id": 3001,
                    "colegio_id": 1,
                    "telefono_contacto1": "+56987654321",
                    "email_contacto1": "juan.perez@email.com",
                    "profesion_id": 5,
                    "tipo_oficio_id": 2,
                    
                    "personas": [{
                      "persona_id": 3001,
                      "tipo_documento": "RUT",
                      "numero_documento": "9.876.543-2",
                      "nombres": "Juan Esteban",
                      "apellidos": "Pérez González",
                      "genero_id": 1,
                      "estado_civil_id": 1,
                      "fecha_nacimiento": "1980-08-20"
                    }]
                  }],
                  
                  "comunas": [{
                    "comuna_id": 101,
                    "nombre": "Santiago Centro",
                    "region_id": 13,
                    "pais_id": 1,
                    
                    "regiones": [{
                      "region_id": 13,
                      "nombre": "Región Metropolitana",
                      "pais_id": 1
                    }],
                    
                    "paises": [{
                      "pais_id": 1,
                      "nombre": "Chile",
                      "codigo_iso": "CL"
                    }]
                  }],
                  
                  "regiones": [{
                    "region_id": 13,
                    "nombre": "Región Metropolitana"
                  }],
                  
                  "paises": [{
                    "pais_id": 1,
                    "nombre": "Chile"
                  }]
                },
                {
                  "apoderado_direccion_id": 2,
                  "apoderado_id": 2002,
                  "descripcion": "Oficina",
                  "ubicaciones_mapa": "-33.4195, -70.6062",
                  "comuna_id": 102,
                  "region_id": 13,
                  "pais_id": 1,
                  
                  "apoderados": [{
                    "apoderado_id": 2002,
                    "persona_id": 3002,
                    "telefono_contacto1": "+56976543210",
                    
                    "personas": [{
                      "persona_id": 3002,
                      "nombres": "María Fernanda",
                      "apellidos": "Gómez López"
                    }]
                  }],
                  
                  "comunas": [{
                    "comuna_id": 102,
                    "nombre": "Providencia"
                  }]
                }
              ];
            res.json(apoderados_direcciones);
        } catch (error) {
            console.error("Error al obtener la apoderadoDireccion:", error);
             res.status(500).json({ message: "Error interno del servidor" });
        }
    },
    guardar: async (req: Request, res: Response) => {
        try {
            const apoderadoDireccion: ApoderadoDireccion = req.body;
            const savedApoderadoDireccion = await dataService.processData(apoderadoDireccion);
            res.status(201).json(savedApoderadoDireccion);
        } catch (error) {
            console.error("Error al guardar la apoderadoDireccion:", error);
             res.status(500).json({ message: "Error interno del servidor" });
        }
    }
    ,
    async actualizar(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id);
            const apoderadoDireccion: ApoderadoDireccion = req.body;
            await dataService.updateById(id, apoderadoDireccion);
            res.status(200).json({ message: "ApoderadoDireccion actualizado correctamente" });
        } catch (error) {
            console.error("Error al actualizar la apoderadoDireccion:", error);
             res.status(500).json({ message: "Error interno del servidor" });
        }
    },
    async eliminar(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id);
            await dataService.deleteById(id);
            res.status(200).json({ message: "ApoderadoDireccion eliminada correctamente" });
        } catch (error) {
            console.error("Error al eliminar la apoderadoDireccion:", error);
             res.status(500).json({ message: "Error interno del servidor" });
        }
    }

}