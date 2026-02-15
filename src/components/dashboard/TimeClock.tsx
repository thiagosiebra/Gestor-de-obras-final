'use client';

import React, { useState, useEffect } from 'react';
import { useApp, TimeEntry } from '@/lib/context';
import styles from './TimeClock.module.css';

type ClockStatus = 'idle' | 'working' | 'paused';

export default function TimeClock() {
  const { currentUser, employees, timeEntries, addTimeEntry } = useApp();
  const [status, setStatus] = useState<ClockStatus>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  // Security Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalStep, setModalStep] = useState<'photo' | 'location'>('photo');
  const [pendingAction, setPendingAction] = useState<((data: any) => void) | null>(null);
  const [isLoadingStep, setIsLoadingStep] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | undefined>();
  const [capturedLocation, setCapturedLocation] = useState<{ latitude: number, longitude: number } | undefined>();

  const currentEmployee = employees.find(e => e.email === currentUser?.email);

  // Filter today's entries for THIS employee
  const todayStr = new Date().toISOString().split('T')[0];
  const myTodayEntries = timeEntries
    .filter(entry => entry.employeeId === currentEmployee?.id && entry.timestamp.startsWith(todayStr))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Sync status and elapsed on mount
  useEffect(() => {
    if (!currentEmployee) return;

    // Determine current status from entries
    if (myTodayEntries.length > 0) {
      const lastEntry = myTodayEntries[0];
      if (lastEntry.type === 'start' || lastEntry.type === 'resume') {
        setStatus('working');
      } else if (lastEntry.type === 'pause') {
        setStatus('paused');
      } else {
        setStatus('idle');
      }

      // Calculate elapsed time from events
      let total = 0;
      let currentStart: number | null = null;

      // Entries are sorted descending, so we go from bottom to top for calculation
      const ascendingEntries = [...myTodayEntries].reverse();
      ascendingEntries.forEach(entry => {
        const ts = new Date(entry.timestamp).getTime();
        if (entry.type === 'start' || entry.type === 'resume') {
          currentStart = ts;
        } else if ((entry.type === 'pause' || entry.type === 'stop') && currentStart) {
          total += ts - currentStart;
          currentStart = null;
        }
      });

      if (currentStart) {
        total += Date.now() - currentStart;
      }
      setElapsed(total);
    }
  }, [timeEntries, currentEmployee]);

  // Financial Calculations
  const salaryBase = parseFloat(currentEmployee?.salaryBase || '0');
  const overtimeRate = parseFloat(currentEmployee?.overtimeRate || '0');
  const hourlyRate = salaryBase > 0 ? salaryBase / 160 : 0;
  const totalHours = elapsed / (1000 * 60 * 60);
  const isOvertime = totalHours > 8;
  const standardHours = isOvertime ? 8 : totalHours;
  const extraHours = isOvertime ? totalHours - 8 : 0;
  const earningsToday = (standardHours * hourlyRate) + (extraHours * overtimeRate);
  const hoursDebt = Math.max(0, 8 - totalHours);

  // Real-time clock effect
  useEffect(() => {
    setCurrentTime(new Date());
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Timer interval for UI update ONLY when working
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === 'working') {
      interval = setInterval(() => {
        setElapsed(prev => prev + 1000);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [status]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const initiateAction = (type: TimeEntry['type']) => {
    if (!currentEmployee) return;

    // REQUISITO: Alerta "FOTO NECESARIA"
    alert("⚠️ ATENCIÓN: FOTO NECESARIA\n\nDebes capturar una foto y verificar tu ubicación para registrar este evento.");

    setPendingAction(() => (data: { photo?: string, location?: any }) => {
      addTimeEntry({
        employeeId: currentEmployee.id,
        type,
        timestamp: new Date().toISOString(),
        photo: data.photo,
        location: data.location
      });
      setShowModal(false);
      setCapturedPhoto(undefined);
      setCapturedLocation(undefined);
    });

    setModalStep('photo');
    setShowModal(true);
  };

  const handlePhotoCapture = () => {
    setIsLoadingStep(true);
    // Simulate photo taking
    setTimeout(() => {
      setCapturedPhoto("data:image/png;base64,mock_photo");
      setIsLoadingStep(false);
      setModalStep('location');
    }, 1200);
  };

  const handleLocationCapture = () => {
    setIsLoadingStep(true);
    // Simulate GPS
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setCapturedLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        });
        setIsLoadingStep(false);
        if (pendingAction) {
          pendingAction({
            photo: capturedPhoto,
            location: { latitude: pos.coords.latitude, longitude: pos.coords.longitude }
          });
        }
      }, () => {
        // Fallback for mock environment
        const mockLoc = { latitude: 40.4168, longitude: -3.7038 };
        setCapturedLocation(mockLoc);
        setIsLoadingStep(false);
        if (pendingAction) {
          pendingAction({ photo: capturedPhoto, location: mockLoc });
        }
      });
    }
  };

  const getEventLabel = (type: TimeEntry['type']) => {
    switch (type) {
      case 'start': return 'Entrada';
      case 'pause': return 'Pausado';
      case 'resume': return 'Retorno';
      case 'stop': return 'Salida';
    }
  };

  const getEventIcon = (type: TimeEntry['type']) => {
    switch (type) {
      case 'start': return '🟢';
      case 'pause': return '⏸️';
      case 'resume': return '▶️';
      case 'stop': return '🔴';
    }
  };

  if (currentUser?.role !== 'employee') return null;

  return (
    <div className={styles.container}>
      <div className={styles.glow} />

      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.realTimeClock}>
            {currentTime ? currentTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
          </div>
          <h3 className={styles.title}>{new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Registro de Jornada Profesional</p>
        </div>

        <div className={styles.timerWrapper}>
          <div className={`${styles.timerCircle} ${status === 'working' ? styles.timerCircleActive : ''} ${status === 'paused' ? styles.timerCirclePaused : ''}`} />
          <div className={styles.timeDisplay}>{formatTime(elapsed)}</div>

          {status !== 'idle' && (
            <div className={`${styles.statusBadge} ${status === 'working' ? styles.statusWorking : styles.statusPaused}`}>
              {status === 'working' ? 'Jornada Iniciada' : 'En Pausa'}
            </div>
          )}
        </div>

        <div className={styles.controls}>
          {!currentEmployee && (
            <div className={styles.errorAlert}>
              ⚠️ No figurás en la lista de colaboradores. Contactá al administrador para que te registre.
            </div>
          )}
          {status === 'idle' && (
            <button
              className={`${styles.btnControl} ${styles.btnPlay}`}
              onClick={() => initiateAction('start')}
              title="Iniciar Jornada"
              disabled={!currentEmployee}
            >
              ▶
            </button>
          )}

          {status === 'working' && (
            <>
              <button className={`${styles.btnControl} ${styles.btnPause}`} onClick={() => initiateAction('pause')} title="Pausar">
                ⏸
              </button>
              <button className={`${styles.btnControl} ${styles.btnStop}`} onClick={() => initiateAction('stop')} title="Finalizar">
                ⏹
              </button>
            </>
          )}

          {status === 'paused' && (
            <>
              <button className={`${styles.btnControl} ${styles.btnPlay}`} onClick={() => initiateAction('resume')} title="Reanudar">
                ▶
              </button>
              <button className={`${styles.btnControl} ${styles.btnStop}`} onClick={() => initiateAction('stop')} title="Finalizar">
                ⏹
              </button>
            </>
          )}
        </div>

        {/* History List - Requisito del usuario */}
        <div className={styles.historyList}>
          <h4 className={styles.historyTitle}>📜 Historial de Registros (Hoy)</h4>
          {myTodayEntries.length > 0 ? (
            <div className={styles.historyItems}>
              {myTodayEntries.map((ev) => (
                <div key={ev.id} className={styles.historyItem}>
                  <span className={styles.historyIcon}>{getEventIcon(ev.type)}</span>
                  <div className={styles.historyLabel}>
                    <strong>{getEventLabel(ev.type)}</strong>
                    <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>
                      {ev.location ? `📍 GPS OK` : '📍 Sin GPS'} · {ev.photo ? '📸 Foto OK' : '📸 Sin Foto'}
                    </div>
                  </div>
                  <span className={styles.historyTime}>
                    {new Date(ev.timestamp).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.emptyHistory}>Aún no hay registros hoy.</p>
          )}
        </div>

        {/* Financial Dashboard */}
        <div className={styles.financialGrid} style={{ marginTop: '32px', width: '100%', maxWidth: '100%' }}>
          <div className={styles.financialCard}>
            <div className={styles.finLabel}>Ganado Hoy</div>
            <div className={`${styles.finValue} ${styles.positive}`}>
              {earningsToday > 0 ? `€${earningsToday.toFixed(2)}` : '--'}
            </div>
          </div>
          <div className={styles.financialCard}>
            <div className={styles.finLabel}>Saldo Horas</div>
            <div className={`${styles.finValue} ${hoursDebt > 0 ? styles.negative : styles.positive}`}>
              {isOvertime ? `+${extraHours.toFixed(2)}h` : `-${hoursDebt.toFixed(2)}h`}
            </div>
          </div>
        </div>
      </div>

      {/* Security Modal */}
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={`${styles.modal} glass-panel`}>
            <div className={styles.stepDots}>
              <div className={`${styles.dot} ${modalStep === 'photo' ? styles.active : ''}`} />
              <div className={`${styles.dot} ${modalStep === 'location' ? styles.active : ''}`} />
            </div>

            {modalStep === 'photo' && (
              <>
                <h3 className={styles.modalTitle}>📸 Foto de Seguridad</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>Necesaria para validar tu entrada/salida.</p>
                <div className={styles.cameraView}>
                  {isLoadingStep ? <div className={styles.spinner}></div> : <span style={{ fontSize: '4rem' }}>🤳</span>}
                </div>
                <button className={styles.btnAction} disabled={isLoadingStep} onClick={handlePhotoCapture}>
                  {isLoadingStep ? 'Procesando...' : 'Capturar Foto'}
                </button>
              </>
            )}

            {modalStep === 'location' && (
              <>
                <h3 className={styles.modalTitle}>📍 Verificando Ubicación</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>Sincronizando con satélites GPS...</p>
                <div className={styles.locationMap}>
                  {isLoadingStep ? <div className={styles.spinner}></div> : <span style={{ fontSize: '4rem' }}>🌍</span>}
                </div>
                <div style={{ fontSize: '0.9rem', marginBottom: '20px', color: capturedLocation ? '#4ade80' : '#fbbf24' }}>
                  {capturedLocation ? "✓ Ubicación Identificada" : "Detectando coordenadas..."}
                </div>
                <button className={styles.btnAction} disabled={isLoadingStep} onClick={handleLocationCapture}>
                  {isLoadingStep ? 'Localizando...' : 'Confirmar Registro'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
