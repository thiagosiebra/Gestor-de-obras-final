'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/lib/context';
import { Button } from '@/components/ui/Button';
import styles from './page.module.css';

export default function RecompensasPage() {
    const { works, currentUser, employees, resetRanking } = useApp();
    const currentEmployee = employees.find(e => e.email === currentUser?.email);
    const isAdmin = currentUser?.role === 'admin';
    const [isResetting, setIsResetting] = useState(false);

    // Dynamic Ranking Calculation for all active employees
    const rankingData = employees
        .filter(emp => emp.status !== 'Inactivo')
        .map(emp => {
            const empTasks = works.flatMap(w =>
                w.tasks.filter(t => t.assignedTo.includes(emp.id) && t.status === 'Validada')
            );
            const points = empTasks.reduce((acc, t) => acc + t.points, 0);
            return {
                id: emp.id,
                name: `${emp.firstName} ${emp.lastName}`,
                points: points,
                photoUrl: emp.photoUrl,
                isMe: emp.id === currentEmployee?.id
            };
        })
        .sort((a, b) => b.points - a.points);

    // Extract all tasks assigned to the CURRENT user from all works (if employee)
    const myTasks = currentEmployee ? works.flatMap(w =>
        w.tasks.filter(t => t.assignedTo.includes(currentEmployee.id))
            .map(t => ({ ...t, workTitle: w.title }))
    ) : [];

    const validatedTasks = myTasks.filter(t => t.status === 'Validada');
    const waitingValidation = myTasks.filter(t => t.status === 'Completada');
    const inProgressTasks = myTasks.filter(t => t.status === 'En Progreso' || t.status === 'Pendiente');

    const totalPoints = validatedTasks.reduce((acc, t) => acc + t.points, 0);
    const waitingPoints = waitingValidation.reduce((acc, t) => acc + t.points, 0);
    const potentialPoints = inProgressTasks.reduce((acc, t) => acc + t.points, 0);

    const pointValue = 0.25; // €0.25 per point
    const earnedEuros = totalPoints * pointValue;
    const waitingEuros = waitingPoints * pointValue;

    const handleResetRanking = async () => {
        if (!confirm('¿Estás seguro de que quieres poner el ranking a cero? Todas las tareas validadas pasarán al historial archivado.')) return;

        setIsResetting(true);
        try {
            await resetRanking();
            alert('Ranking reiniciado con éxito.');
        } catch (error) {
            console.error('Error resetting ranking:', error);
            alert('Hubo un error al reiniciar el ranking.');
        } finally {
            setIsResetting(false);
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 className={styles.title}>🏆 Sistema de Recompensas</h1>
                        <p className={styles.subtitle}>Ranking de eficiencia y ganancias acumuladas.</p>
                    </div>
                    {isAdmin && (
                        <Button
                            variant="secondary"
                            onClick={handleResetRanking}
                            isLoading={isResetting}
                            style={{ borderColor: '#ef4444', color: '#ef4444' }}
                        >
                            🔄 Poner Ranking a Cero
                        </Button>
                    )}
                </div>
            </header>

            {currentEmployee && (
                <div className={styles.statsGrid}>
                    <div className={`${styles.statCard} glass-panel`}>
                        <span className={styles.statLabel}>Mis Puntos Validados</span>
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
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Tareas por finalizar</p>
                    </div>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '24px', marginTop: '32px' }}>
                <div className={styles.historySection} style={{ marginTop: 0 }}>
                    <h2 className={styles.sectionTitle}>Historial Personal</h2>
                    <div className={styles.historyList}>
                        {currentEmployee ? (
                            [...validatedTasks, ...waitingValidation].length > 0 ? (
                                [...validatedTasks, ...waitingValidation].sort((a, b) => b.points - a.points).map(task => (
                                    <div key={task.id} className={`${styles.historyItem} glass-panel`}>
                                        <div className={styles.historyMain}>
                                            <div className={styles.historyIcon}>✅</div>
                                            <div>
                                                <h3 className={styles.historyTitle}>{task.title}</h3>
                                                <p className={styles.historyDate}>{task.workTitle}</p>
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
                                <div className={styles.emptyState}>No tienes historial de puntos todavía.</div>
                            )
                        ) : (
                            <div className={styles.emptyState}>Inicia sesión como empleado para ver tu historial.</div>
                        )}
                    </div>
                </div>

                <div className={styles.rankingSection} style={{ marginTop: 0 }}>
                    <div className={`${styles.rankingCard} glass-panel`}>
                        <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>📊</span> Ranking General
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {rankingData.map((user, idx) => (
                                <div key={user.id} className={styles.rankingRow} style={{
                                    background: user.isMe ? 'rgba(var(--primary-rgb), 0.15)' : 'rgba(255,255,255,0.03)',
                                    border: user.isMe ? '1px solid var(--primary-color)' : '1px solid transparent'
                                }}>
                                    <span className={styles.rankNum}>{idx + 1}</span>
                                    <div className={styles.rankAvatar} style={{ overflow: 'hidden' }}>
                                        {user.photoUrl ? (
                                            <img src={user.photoUrl} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            '👤'
                                        )}
                                    </div>
                                    <span className={styles.rankName} style={{ fontWeight: user.isMe ? 700 : 400 }}>{user.name}</span>
                                    <span className={styles.rankPoints}>{user.points} pts</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
