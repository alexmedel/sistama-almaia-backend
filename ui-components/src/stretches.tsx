import React from 'react';
import ReactDOM from 'react-dom/client';
import { StretchesTimer } from './components/StretchesTimer';
import './styles/global.css';

// Datos de ejemplo
const mockData = {
  target: "full",
  total_seconds: 300,
  steps: [
    { name: "Rotación de cuello (suave)", duration: 40 },
    { name: "Estiramiento de hombros hacia atrás", duration: 40 },
    { name: "Extensión de brazos al frente", duration: 40 },
    { name: "Rotación de muñecas", duration: 40 },
    { name: "Estiramiento de espalda alta", duration: 40 },
    { name: "Flexión lateral del tronco", duration: 40 },
    { name: "Estiramiento de piernas (gemelos)", duration: 40 },
    { name: "Respiración profunda y relajación", duration: 20 }
  ]
};

// Intentar obtener datos de la URL o usar mock
const urlParams = new URLSearchParams(window.location.search);
const dataParam = urlParams.get('data');
const data = dataParam ? JSON.parse(decodeURIComponent(dataParam)) : mockData;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <StretchesTimer data={data} />
  </React.StrictMode>
);
