import React from 'react';
import ReactDOM from 'react-dom/client';
import { HydrationPlan } from './components/HydrationPlan';
import './styles/global.css';

// Datos de ejemplo
const mockData = {
  total_ml: 2592,
  schedule: [
    "Al despertar — 300 ml",
    "Media mañana — 300 ml",
    "Almuerzo — 400 ml",
    "Media tarde — 300 ml",
    "Cena — 400 ml",
    "Antes de dormir — 200 ml"
  ],
  activityLevel: "moderate",
  climate: "hot",
  weightKg: 72
};

// Intentar obtener datos de la URL o usar mock
const urlParams = new URLSearchParams(window.location.search);
const dataParam = urlParams.get('data');
const data = dataParam ? JSON.parse(decodeURIComponent(dataParam)) : mockData;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HydrationPlan data={data} />
  </React.StrictMode>
);
