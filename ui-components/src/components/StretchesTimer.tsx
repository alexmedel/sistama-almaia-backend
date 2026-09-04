import React, { useState, useEffect, useRef } from 'react';

interface Step {
  name: string;
  duration: number;
}

interface StretchesData {
  target: string;
  total_seconds: number;
  steps: Step[];
}

interface StretchesTimerProps {
  data: StretchesData;
}

export const StretchesTimer: React.FC<StretchesTimerProps> = ({ data }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [timeLeft, setTimeLeft] = useState(data.steps[0]?.duration || 0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<number | null>(null);

  const currentStepData = data.steps[currentStep];
  const totalElapsed = data.steps
    .slice(0, currentStep)
    .reduce((sum, step) => sum + step.duration, 0) + 
    (currentStepData ? currentStepData.duration - timeLeft : 0);
  const progress = (totalElapsed / data.total_seconds) * 100;

  useEffect(() => {
    if (isRunning && !isPaused && timeLeft > 0) {
      intervalRef.current = window.setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Pasar al siguiente paso
            if (currentStep < data.steps.length - 1) {
              setCurrentStep(currentStep + 1);
              return data.steps[currentStep + 1].duration;
            } else {
              // Fin de la rutina
              setIsRunning(false);
              return 0;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, isPaused, timeLeft, currentStep, data.steps]);

  const startTimer = () => {
    setIsRunning(true);
    setIsPaused(false);
  };

  const pauseTimer = () => {
    setIsPaused(!isPaused);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setIsPaused(false);
    setCurrentStep(0);
    setTimeLeft(data.steps[0]?.duration || 0);
  };

  const skipStep = () => {
    if (currentStep < data.steps.length - 1) {
      setCurrentStep(currentStep + 1);
      setTimeLeft(data.steps[currentStep + 1].duration);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isCompleted = !isRunning && currentStep === data.steps.length - 1 && timeLeft === 0;

  return (
    <div className="container">
      <div className="card">
        <h1>🧘 Rutina de Estiramientos</h1>
        
        <div style={{
          background: 'linear-gradient(135deg, #4A90E2 0%, #2E86AB 100%)',
          color: 'white',
          padding: '20px',
          borderRadius: '16px',
          marginBottom: '24px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '16px', opacity: 0.9, marginBottom: '8px' }}>
            Duración Total
          </div>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>
            {Math.floor(data.total_seconds / 60)} minutos
          </div>
          <div style={{ fontSize: '14px', opacity: 0.8, marginTop: '4px' }}>
            Objetivo: {data.target === 'full' ? 'Cuerpo completo' : data.target}
          </div>
        </div>

        {isCompleted ? (
          <div style={{
            background: 'rgba(76, 175, 80, 0.1)',
            border: '2px solid #4CAF50',
            borderRadius: '16px',
            padding: '32px',
            textAlign: 'center',
            marginBottom: '24px'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
            <h2 style={{ color: '#4CAF50', marginBottom: '8px' }}>¡Rutina Completada!</h2>
            <p style={{ color: '#666' }}>Excelente trabajo. Recuerda hidratarte.</p>
          </div>
        ) : (
          <>
            <div className="timer">
              {formatTime(timeLeft)}
            </div>

            <div style={{
              background: 'rgba(33, 150, 243, 0.1)',
              padding: '20px',
              borderRadius: '12px',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                Paso {currentStep + 1} de {data.steps.length}
              </div>
              <h3 style={{ margin: '0 0 8px 0', color: '#2196F3' }}>
                {currentStepData?.name}
              </h3>
              <div style={{ fontSize: '14px', color: '#666' }}>
                Duración: {currentStepData?.duration}s
              </div>
            </div>

            <div className="progress-bar" style={{ height: '12px' }}>
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <div style={{ textAlign: 'center', marginTop: '8px', marginBottom: '20px', color: '#666', fontSize: '14px' }}>
              {Math.round(progress)}% completado
            </div>
          </>
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns: isRunning ? '1fr 1fr 1fr' : '1fr',
          gap: '12px',
          marginBottom: '20px'
        }}>
          {!isRunning ? (
            <button className="button" onClick={startTimer}>
              {isCompleted ? 'Reiniciar Rutina' : 'Iniciar Rutina'}
            </button>
          ) : (
            <>
              <button 
                className="button button-secondary" 
                onClick={pauseTimer}
              >
                {isPaused ? '▶️ Reanudar' : '⏸️ Pausar'}
              </button>
              <button 
                className="button button-secondary" 
                onClick={skipStep}
                disabled={currentStep === data.steps.length - 1}
              >
                ⏭️ Saltar
              </button>
              <button 
                className="button" 
                onClick={resetTimer}
                style={{ background: '#FF4757' }}
              >
                🔄 Reiniciar
              </button>
            </>
          )}
        </div>

        <h3>Pasos de la Rutina</h3>
        <ul className="list">
          {data.steps.map((step, index) => (
            <li 
              key={index} 
              className="list-item"
              style={{
                background: index === currentStep && isRunning
                  ? 'rgba(33, 150, 243, 0.2)'
                  : index < currentStep
                  ? 'rgba(76, 175, 80, 0.1)'
                  : 'rgba(135, 206, 235, 0.1)',
                border: index === currentStep && isRunning ? '2px solid #2196F3' : 'none'
              }}
            >
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: index < currentStep ? '#4CAF50' : index === currentStep && isRunning ? '#2196F3' : '#ccc',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '14px',
                flexShrink: 0
              }}>
                {index < currentStep ? '✓' : index + 1}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600' }}>{step.name}</div>
                <div style={{ fontSize: '13px', color: '#666' }}>{step.duration}s</div>
              </div>
            </li>
          ))}
        </ul>

        <div className="disclaimer">
          <strong>⚠️ Importante:</strong> Realiza los ejercicios con cuidado. 
          Si sientes dolor, detente y consulta a un profesional. Hidrátate al finalizar.
        </div>
      </div>
    </div>
  );
};
