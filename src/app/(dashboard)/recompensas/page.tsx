'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '@/lib/context';
import { Button } from '@/components/ui/Button';
import styles from './page.module.css';

export default function RecompensasPage() {
    const { works, currentUser, employees } = useApp();
    const currentEmployee = employees.find(e => e.email === currentUser?.email);

    if (!currentEmployee) {
        return <div className="p-8 text-center">Inicie sesión como empleado para ver recompensas.</div>;
    }

    // Extract all tasks assigned to me from all works
    const myTasks = works.flatMap(w =>
        w.tasks.filter(t => t.assignedTo.includes(currentEmployee.id))
            .map(t => ({ ...t, workTitle: w.title }))
    );

    const validatedTasks = myTasks.filter(t => t.status === 'Validada');
    const waitingValidation = myTasks.filter(t => t.status === 'Completada');
    const inProgressTasks = myTasks.filter(t => t.status === 'En Progreso' || t.status === 'Pendiente');

    const totalPoints = validatedTasks.reduce((acc, t) => acc + t.points, 0);
    const waitingPoints = waitingValidation.reduce((acc, t) => acc + t.points, 0);
    const potentialPoints = inProgressTasks.reduce((acc, t) => acc + t.points, 0);

    const pointValue = 0.25; // €0.25 per point
    const earnedEuros = totalPoints * pointValue;
    const waitingEuros = waitingPoints * pointValue;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>🏆 Mis Recompensas</h1>
                <p className={styles.subtitle}>Tu progreso y ganancias por tareas ejecutadas.</p>
            </header>

            <div className={styles.statsGrid}>
                <div className={`${styles.statCard} glass-panel`}>
                    <span className={styles.statLabel}>Puntos Validados</span>
                    <span className={styles.statValue} style={{ color: '#00c853' }}>{totalPoints} pts</span>
                    <p style={{ fontSize: '1.2rem', fontWeight: 600 }}>€&nbsp;{earnedEuros.toFixed(2)}</p>
                    <div className={styles.statProgress}>
                        <div className={styles.progressBar} style={{ width: '100%', background: '#00c853' }}></div>
                    </div>
                </div>
                <div className={`${styles.statCard} glass-panel`}>
                    <span className={styles.statLabel}>En Revisión</span>
                    <span className={styles.statValue} style={{ color: '#f59e0b' }}>{waitingPoints} pts</span>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>~ €&nbsp;{waitingEuros.toFixed(2)}</p>
                    <div className={styles.statProgress}>
                        <div className={styles.progressBar} style={{ width: '100%', background: '#f59e0b', opacity: 0.5 }}></div>
                    </div>
                </div>
                <div className={`${styles.statCard} glass-panel`}>
                    <span className={styles.statLabel}>Potencial Obra</span>
                    <span className={styles.statValue} style={{ color: 'var(--primary-color)' }}>{potentialPoints} pts</span>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Tareas pendientes de finalizar</p>
                </div>
            </div>

            <div className={styles.historySection}>
                <h2 className={styles.sectionTitle}>Historial de Rendimiento</h2>
                <div className={styles.historyList}>
                    {[...validatedTasks, ...waitingValidation].length > 0 ? (
                        [...validatedTasks, ...waitingValidation].map(task => (
                            <div key={task.id} className={`${styles.historyItem} glass-panel`}>
                                <div className={styles.historyMain}>
                                    <div className={styles.historyIcon}>✅</div>
                                    <div>
                                        <h3 className={styles.historyTitle}>{task.title}</h3>
                                        <p className={styles.historyDate}>{task.workTitle} • {task.completedDate ? new Date(task.completedDate).toLocaleDateString() : 'Pendiente'}</p>
                                    </div>
                                </div>
                                <div className={styles.historyMeta}>
                                    <span className={styles.rewardBadge}>+{task.points} pts</span>
                                    <span className={styles.statusBadge} style={{ color: task.status === 'Validada' ? '#00c853' : '#f59e0b' }}>
                                        {task.status}
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className={styles.emptyState}>Aún no tienes tareas procesadas en este sistema de puntos.</div>
                    )}
                </div>
            </div>

            <div className={styles.rankingSection}>
                <div className={`${styles.rankingCard} glass-panel`}>
                    <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>📊</span> Ranking de Colaboradores
                    </h3>
                    {[
                        { name: 'Juan Pérez', points: 350, avatar: '👤' },
                        { name: 'Tú', points: totalPoints, avatar: '⭐', isMe: true },
                        { name: 'Carlos López', points: 120, avatar: '👤' },
                    ].sort((a, b) => b.points - a.points).map((user, idx) => (
                        <div key={idx} className={styles.rankingRow} style={{ background: user.isMe ? 'rgba(var(--primary-rgb), 0.1)' : 'transparent' }}>
                            <span className={styles.rankNum}>{idx + 1}</span>
                            <span className={styles.rankAvatar}>{user.avatar}</span>
                            <span className={styles.rankName}>{user.name}</span>
                            <span className={styles.rankPoints}>{user.points} pts</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
