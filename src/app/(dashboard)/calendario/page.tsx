'use client';

import React from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import { useApp } from '@/lib/context';

const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export default function CalendarPage() {
    const { tasks, currentUser, employees } = useApp();
    const [currentDate, setCurrentDate] = React.useState(new Date());

    const currentEmployee = employees.find(e => e.email === currentUser?.email);
    const isAdmin = currentUser?.role === 'admin';

    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year: number, month: number) => {
        const day = new Date(year, month, 1).getDay();
        return day === 0 ? 6 : day - 1; // Shift so Monday is 0
    };

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const daysInMonth = getDaysInMonth(year, month);
    const startDayOffset = getFirstDayOfMonth(year, month);

    const prevMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
    };

    const calendarDays = [];
    for (let i = 0; i < startDayOffset; i++) {
        calendarDays.push(<div key={`empty-${i}`} className={styles.dayEmpty}></div>);
    }

    for (let i = 1; i <= daysInMonth; i++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;

        // Filter tasks for this day
        const dayTasks = tasks.filter(t => {
            if (t.date !== dateStr) return false;
            if (isAdmin) return true;
            if (t.isGlobal) return true;
            if (t.assignedTo === 'all') return true;
            return t.assignedTo === currentEmployee?.id;
        });

        calendarDays.push(
            <Link
                href={`/calendario/${dateStr}`}
                key={i}
                className={styles.dayCellLink}
            >
                <div className={`${styles.day} glass-panel`}>
                    <span className={styles.dayNumber}>{i}</span>
                    <div className={styles.eventList}>
                        {dayTasks.slice(0, 3).map((task, idx) => (
                            <div
                                key={idx}
                                className={`${styles.event}`}
                                style={{
                                    background: task.type === 'visita' ? '#f59e0b22' : task.type === 'obra' ? 'rgba(var(--primary-rgb), 0.1)' : 'rgba(255,255,255,0.05)',
                                    color: task.type === 'visita' ? '#fbbf24' : task.type === 'obra' ? 'var(--primary-color)' : 'var(--text-secondary)',
                                    fontSize: '0.65rem',
                                    padding: '2px 4px',
                                    borderRadius: '4px',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    borderLeft: `2px solid ${task.type === 'visita' ? '#f59e0b' : task.type === 'obra' ? 'var(--primary-color)' : '#9ca3af'}`
                                }}
                            >
                                {task.title}
                            </div>
                        ))}
                        {dayTasks.length > 3 && <div className={styles.moreEvents}>+{dayTasks.length - 3} más</div>}
                    </div>
                </div>
            </Link>
        );
    }

    const monthLabel = currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    const capitalizedMonthLabel = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

    const todayDate = new Date().toISOString().split('T')[0];
    const todayTasks = tasks.filter(t => t.date === todayDate);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>📅 Calendario de Operaciones</h1>
                <div className={styles.controls}>
                    <button className={styles.navBtn} onClick={prevMonth}>←</button>
                    <span className={styles.monthLabel}>{capitalizedMonthLabel}</span>
                    <button className={styles.navBtn} onClick={nextMonth}>→</button>
                </div>
            </div>

            <div className={styles.layout}>
                <div className={styles.calendarColumn}>
                    <div className={styles.calendarGrid}>
                        {DAYS.map(day => (
                            <div key={day} className={styles.weekDay}>{day}</div>
                        ))}
                        {calendarDays}
                    </div>
                </div>

                <div className={styles.alertsColumn}>
                    <div className={`${styles.alertsCard} glass-panel`}>
                        <h2 className={styles.alertsTitle}>🔔 Alertas de Hoy</h2>
                        <div className={styles.alertsList}>
                            {todayTasks.length === 0 ? (
                                <p className={styles.noAlerts}>No hay visitas ni inicios programados para hoy.</p>
                            ) : (
                                todayTasks.map((t, idx) => (
                                    <div key={idx} className={`${styles.alertItem} ${t.type === 'visita' ? styles.alertVisita : styles.alertObra}`}>
                                        <div className={styles.alertIcon}>{t.type === 'visita' ? '🚗' : '🏗️'}</div>
                                        <div className={styles.alertContent}>
                                            <div className={styles.alertTime}>{t.type === 'visita' ? 'Visita Comercial' : 'Inicio de Obra'}</div>
                                            <div className={styles.alertValue}>{t.title}</div>
                                            <div className={styles.alertDesc}>{t.description}</div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {isAdmin && (
                            <div className={styles.upcomingSection}>
                                <h3 className={styles.upcomingTitle}>Próximos Inicios (7 días)</h3>
                                {tasks.filter(t => t.type === 'obra' && t.date > todayDate).slice(0, 3).map((t, i) => (
                                    <div key={i} className={styles.upcomingItem}>
                                        <span className={styles.upcomingDate}>{new Date(t.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</span>
                                        <span className={styles.upcomingTitleTxt}>{t.title}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
