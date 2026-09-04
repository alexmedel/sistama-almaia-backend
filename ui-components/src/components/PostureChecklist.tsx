import React, { useState } from 'react';

interface PostureData {
  workPattern: string;
  checklist: string[];
}

interface PostureChecklistProps {
  data: PostureData;
}

export const PostureChecklist: React.FC<PostureChecklistProps> = ({ data }) => {
  const [checked, setChecked] = useState<Set<number>>(new Set());

  const toggleCheck = (index: number) => {
    const newChecked = new Set(checked);
    if (newChecked.has(index)) {
      newChecked.delete(index);
    } else {
      newChecked.add(index);
    }
    setChecked(newChecked);
  };

  const progress = (checked.size / data.checklist.length) * 100;

  return (
    <div className="container">
      <div className="card">
        <h1>🪑 Pausas de Postura</h1>
        
        <div style={{
          background: 'linear-gradient(135deg, #4A90E2 0%, #2E86AB 100%)',
          color: 'white',
          padding: '20px',
          borderRadius: '16px',
          marginBottom: '24px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
            Trabajo de Escritorio
          </div>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>
            Patrón: {data.workPattern}
          </div>
        </div>

        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div style={{ textAlign: 'center', marginBottom: '20px', color: '#666' }}>
          {checked.size} de {data.checklist.length} aplicadas ({Math.round(progress)}%)
        </div>

        <h3>Recomendaciones Ergonómicas</h3>
        <ul className="list">
          {data.checklist.map((item, index) => (
            <li 
              key={index} 
              className="list-item"
              style={{
                background: checked.has(index) 
                  ? 'rgba(76, 175, 80, 0.1)' 
                  : 'rgba(135, 206, 235, 0.1)',
                cursor: 'pointer'
              }}
              onClick={() => toggleCheck(index)}
            >
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '6px',
                border: `2px solid ${checked.has(index) ? '#4CAF50' : '#2196F3'}`,
                background: checked.has(index) ? '#4CAF50' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '16px',
                flexShrink: 0,
                transition: 'all 0.2s ease'
              }}>
                {checked.has(index) && '✓'}
              </div>
              <span style={{ flex: 1 }}>{item}</span>
            </li>
          ))}
        </ul>

        {checked.size === data.checklist.length && (
          <div style={{
            background: 'rgba(76, 175, 80, 0.1)',
            border: '2px solid #4CAF50',
            borderRadius: '12px',
            padding: '16px',
            marginTop: '20px',
            textAlign: 'center',
            color: '#4CAF50',
            fontWeight: 'bold'
          }}>
            ✓ ¡Excelente! Estás aplicando todas las recomendaciones
          </div>
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          marginTop: '20px'
        }}>
          <button 
            className="button button-secondary"
            onClick={() => setChecked(new Set())}
            disabled={checked.size === 0}
          >
            Reiniciar
          </button>
          <button 
            className="button"
            onClick={() => {
              const allChecked = new Set(data.checklist.map((_, i) => i));
              setChecked(allChecked);
            }}
            disabled={checked.size === data.checklist.length}
          >
            Marcar Todas
          </button>
        </div>

        <div className="disclaimer">
          <strong>💡 Importante:</strong> Estas pausas ayudan a prevenir fatiga y lesiones. 
          Si sientes dolor persistente, consulta a un profesional de salud ocupacional.
        </div>
      </div>
    </div>
  );
};
