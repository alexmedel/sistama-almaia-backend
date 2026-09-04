import React from 'react';
import ReactDOM from 'react-dom/client';
import { TriageCard } from './components/TriageCard';
import './styles/global.css';

// Datos de ejemplo (en producción vendrían de la API o window.openai)
const mockData = {
  title: "Orientación General",
  symptom: "dolor de cabeza",
  age: 25,
  duration: "6h",
  fever_c: 37.8,
  danger: false,
  summary: "Síntomas registrados. Si los síntomas empeoran o persisten más de 48 horas, consulta con un profesional de salud.",
  actions: [
    "Monitorear síntomas",
    "Descansar adecuadamente",
    "Mantenerse hidratado",
    "Consultar si empeora o persiste"
  ]
};

// Intentar obtener datos de la URL o usar mock
const urlParams = new URLSearchParams(window.location.search);
const dataParam = urlParams.get('data');
const data = dataParam ? JSON.parse(decodeURIComponent(dataParam)) : mockData;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TriageCard data={data} />
  </React.StrictMode>
);
