import express from "express";
import { ValidadorController } from "./validator.controller";
 
const validadorRoute = express.Router();

const controller = new ValidadorController();

validadorRoute.get("/apoderado/:id", controller.validarApoderado.bind(controller));
validadorRoute.get("/docente/:id", controller.validarDocente.bind(controller));
validadorRoute.get("/alumno/:id", controller.validarAlumno.bind(controller));

export default validadorRoute;
