import React from 'react';
import ReactDOM from 'react-dom/client';
import { PostureChecklist } from './components/PostureChecklist';
import './styles/global.css';

// Datos de ejemplo
const mockData = {
  workPattern: "desk8h",
  checklist: [
    "Cada 30–45 min: levántate 2–3 min",
    "Regla 20–20–20: cada 20 min mira 20s a 6 m",
    "Pantalla a la altura de los ojos",
    "Apoya zona lumbar y planta de los pies",
    "Respiración profunda para relajar hombros",
    "Evita encorvar la espalda",
    "Mantén muñecas en posición neutra al escribir"
  ]
};

// Intentar obtener datos de la URL o usar mock
const urlParams = new URLSearchParams(window.location.search);
const dataParam = urlParams.get('data');
const data = dataParam ? JSON.parse(decodeURIComponent(dataParam)) : mockData;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PostureChecklist data={data} />
  </React.StrictMode>
);
