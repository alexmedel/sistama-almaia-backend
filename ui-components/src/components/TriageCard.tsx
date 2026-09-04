import React from 'react';

interface TriageData {
  title: string;
  symptom: string;
  age?: number | string;
  duration?: string;
  fever_c?: number | string;
  danger: boolean;
  summary: string;
  actions: string[];
}

interface TriageCardProps {
  data: TriageData;
}

export const TriageCard: React.FC<TriageCardProps> = ({ data }) => {
  return (
    <div className="container">
      <div className="card">
        {data.danger && (
          <div className="alert">
            ⚠️ {data.title}
          </div>
        )}
        
        {!data.danger && (
          <h1>{data.title}</h1>
        )}

        <div style={{ marginBottom: '20px' }}>
          <h3>Síntoma Reportado</h3>
          <p style={{ fontSize: '18px', fontWeight: '600', color: '#2196F3' }}>
            {data.symptom}
          </p>
        </div>

        {data.duration && (
          <div style={{ marginBottom: '12px' }}>
            <strong>Duración:</strong> {data.duration}
          </div>
        )}

        {data.fever_c && data.fever_c !== 'No registrada' && (
          <div style={{ marginBottom: '12px' }}>
            <strong>Temperatura:</strong> {data.fever_c}°C
            {typeof data.fever_c === 'number' && data.fever_c >= 39.5 && (
              <span className="badge badge-danger" style={{ marginLeft: '8px' }}>
                Fiebre Alta
              </span>
            )}
          </div>
        )}

        <div style={{ 
          background: data.danger ? 'rgba(255, 71, 87, 0.1)' : 'rgba(33, 150, 243, 0.1)',
          padding: '16px',
          borderRadius: '12px',
          marginTop: '20px',
          marginBottom: '20px'
        }}>
          <p style={{ margin: 0 }}>{data.summary}</p>
        </div>

        <h3>Recomendaciones</h3>
        <ul className="list">
          {data.actions.map((action, index) => (
            <li key={index} className="list-item">
              <span style={{ 
                width: '24px', 
                height: '24px', 
                background: data.danger ? '#FF4757' : '#2196F3',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '12px',
                flexShrink: 0
              }}>
                {index + 1}
              </span>
              <span>{action}</span>
            </li>
          ))}
        </ul>

        <div className="disclaimer">
          <strong>⚠️ Importante:</strong> Esta información es orientativa, no constituye diagnóstico médico. 
          Si hay señales de alerta o los síntomas empeoran, consulta a un profesional de salud.
        </div>
      </div>
    </div>
  );
};
