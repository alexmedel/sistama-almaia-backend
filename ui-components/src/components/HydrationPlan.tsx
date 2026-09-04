import React, { useState } from 'react';

interface HydrationData {
  total_ml: number;
  schedule: string[];
  activityLevel?: string;
  climate?: string;
  weightKg?: number;
}

interface HydrationPlanProps {
  data: HydrationData;
}

export const HydrationPlan: React.FC<HydrationPlanProps> = ({ data }) => {
  const [completed, setCompleted] = useState<Set<number>>(new Set());

  const toggleCompleted = (index: number) => {
    const newCompleted = new Set(completed);
    if (newCompleted.has(index)) {
      newCompleted.delete(index);
    } else {
      newCompleted.add(index);
    }
    setCompleted(newCompleted);
  };

  const progress = (completed.size / data.schedule.length) * 100;

  return (
    <div className="container">
      <div className="card">
        <h1>💧 Plan de Hidratación</h1>
        
        <div style={{
          background: 'linear-gradient(135deg, #87CEEB 0%, #4A90E2 100%)',
          color: 'white',
          padding: '24px',
          borderRadius: '16px',
          textAlign: 'center',
          marginBottom: '24px'
        }}>
          <div style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '8px' }}>
            {data.total_ml} ml
          </div>
          <div style={{ fontSize: '16px', opacity: 0.9 }}>
            Objetivo del día
          </div>
        </div>

        {data.weightKg && (
          <div style={{ 
            display: 'flex', 
            gap: '12px', 
            marginBottom: '20px',
            flexWrap: 'wrap'
          }}>
            <span className="badge">Peso: {data.weightKg}kg</span>
            {data.activityLevel && (
              <span className="badge">
                Actividad: {data.activityLevel === 'low' ? 'Baja' : data.activityLevel === 'moderate' ? 'Moderada' : 'Alta'}
              </span>
            )}
            {data.climate && (
              <span className="badge">
                Clima: {data.climate === 'cold' ? 'Frío' : data.climate === 'temperate' ? 'Templado' : 'Caluroso'}
              </span>
            )}
          </div>
        )}

        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div style={{ textAlign: 'center', marginBottom: '20px', color: '#666' }}>
          {completed.size} de {data.schedule.length} completados ({Math.round(progress)}%)
        </div>

        <h3>Horarios Recomendados</h3>
        <ul className="list">
          {data.schedule.map((item, index) => (
            <li 
              key={index} 
              className="list-item"
              style={{
                opacity: completed.has(index) ? 0.6 : 1,
                textDecoration: completed.has(index) ? 'line-through' : 'none'
              }}
            >
              <input
                type="checkbox"
                checked={completed.has(index)}
                onChange={() => toggleCompleted(index)}
                style={{
                  width: '24px',
                  height: '24px',
                  cursor: 'pointer',
                  accentColor: '#2196F3'
                }}
              />
              <span style={{ flex: 1 }}>{item}</span>
              {completed.has(index) && (
                <span className="badge badge-success">✓</span>
              )}
            </li>
          ))}
        </ul>

        <button 
          className="button"
          onClick={() => {
            if (completed.size === data.schedule.length) {
              alert('¡Excelente! Has completado tu plan de hidratación del día 🎉');
            } else {
              alert(`Te faltan ${data.schedule.length - completed.size} tomas. ¡Sigue así! 💪`);
            }
          }}
          style={{ marginTop: '20px' }}
        >
          {completed.size === data.schedule.length ? '✓ Plan Completado' : 'Ver Progreso'}
        </button>

        <div className="disclaimer">
          <strong>💡 Consejo:</strong> Ajusta la cantidad según tu sed y actividad. 
          Esta es una guía general, consulta a un profesional si tienes dudas.
        </div>
      </div>
    </div>
  );
};
