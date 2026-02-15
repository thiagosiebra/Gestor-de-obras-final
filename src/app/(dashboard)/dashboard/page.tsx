'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '@/lib/context';
import { Button } from '@/components/ui/Button';
import TimeClock from '@/components/dashboard/TimeClock';
import styles from './page.module.css';

export default function DashboardPage() {
    const { currentUser, works, clients, employees, requests, updateRequest, addRequest, invoices } = useApp();
    const currentEmployee = employees.find(e => e.email === currentUser?.email);
    const userName = currentUser?.email.split('@')[0] || 'Usuario';
    const isAdmin = currentUser?.role === 'admin';

    // Admin Stats
    const activeWorksCount = works.filter(w => w.status === 'En Progreso').length;
    const pendingWorksCount = works.filter(w => w.status === 'Pendiente').length;
    const totalClientsCount = clients.length;
    const activeEmployeesCount = employees.filter(e => e.status === 'Activo' || e.status === 'En Obra').length;

    // Financial Stats (Current Month)
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const monthlyInvoices = invoices.filter(inv => {
        const invDate = new Date(inv.date);
        return invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear;
    });

    const calculateTotal = (invs: typeof invoices) => {
        return invs.reduce((acc, inv) => {
            const subtotal = inv.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
            const iva = inv.items.reduce((sum, item) => sum + (item.quantity * item.rate * (item.iva / 100)), 0);
            return acc + subtotal + iva;
        }, 0);
    };

    const statusStats = {
        total: calculateTotal(monthlyInvoices),
        emitidas: monthlyInvoices.filter(i => i.status === 'Emitida' || i.status === 'Pagada').length,
        pagadas: monthlyInvoices.filter(i => i.status === 'Pagada').length,
        pendientes: monthlyInvoices.filter(i => i.status === 'Emitida').length,
        montoPagado: calculateTotal(monthlyInvoices.filter(i => i.status === 'Pagada')),
        montoPendiente: calculateTotal(monthlyInvoices.filter(i => i.status === 'Emitida'))
    };

    const pendingRequests = requests.filter(r => r.status === 'Pendiente');

    // Get all active tasks across all works
    const activeTasks = works.flatMap(w =>
        w.tasks.filter(t => t.status === 'En Progreso')
            .map(t => ({
                ...t,
                workTitle: w.title,
                workId: w.id,
                assignedNames: t.assignedTo.map(id => employees.find(e => e.id === id)?.firstName || 'Unk')
            }))
    );

    const [processingId, setProcessingId] = React.useState<string | null>(null);
    const [obs, setObs] = React.useState<string>('');
    const [showRequestModal, setShowRequestModal] = React.useState(false);
    const [newRequest, setNewRequest] = React.useState({
        type: 'Vacaciones' as any,
        description: '',
        amount: 0,
        requestedDate: new Date().toISOString().split('T')[0]
    });

    const handleRequestAction = (id: string, status: 'Aprobado' | 'Rechazado') => {
        updateRequest(id, { status, adminObservations: obs });
        setProcessingId(null);
        setObs('');
    };

    const handleAddRequest = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentEmployee) return;

        addRequest({
            employeeId: currentEmployee.id,
            employeeName: `${currentEmployee.firstName} ${currentEmployee.lastName}`,
            type: newRequest.type,
            date: new Date().toISOString(),
            requestedDate: newRequest.type === 'Vacaciones' ? newRequest.requestedDate : undefined,
            description: newRequest.description,
            amount: newRequest.type === 'Gasto' ? newRequest.amount : undefined
        });

        setShowRequestModal(false);
        setNewRequest({ type: 'Vacaciones', description: '', amount: 0, requestedDate: new Date().toISOString().split('T')[0] });
    };

    const myRequests = requests.filter(r => r.employeeId === currentEmployee?.id);

    // Employee Content
    const employeeWorks = works.filter(w => w.status === 'En Progreso' && w.assignedEmployees.includes(currentEmployee?.id || ''));

    const isEmp = currentUser?.role === 'employee';
    const isUnassigned = currentUser?.role === 'unassigned';

    if (!currentUser) {
        return <div className="p-20 text-center">Cargando sesión...</div>;
    }

    if (isUnassigned) {
        return (
            <div className={styles.container}>
                <div className="glass-panel p-20 text-center">
                    <h1 className={styles.welcomeTitle}>⚠️ Acceso en Espera</h1>
                    <p className={styles.subtitle}>
                        Tu cuenta (<strong>{currentUser.email}</strong>) no tiene un rol asignado ainda.
                    </p>
                    <p style={{ marginTop: '10px' }}>
                        Pide al administrador que te registre como colaborador para poder entrar.
                    </p>
                    <Button onClick={() => window.location.href = '/login'} style={{ marginTop: '20px' }}>Volver al Login</Button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                {/* DEBUG INFO - REMOVE AFTER FIX */}
                <div style={{ background: '#333', color: '#fff', padding: '5px', fontSize: '10px', marginBottom: '5px' }}>
                    DEBUG v2.0 | Email: {currentUser?.email} | Role: {currentUser?.role} | IsAdmin: {isAdmin ? 'YES' : 'NO'}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <div>
                        <h1 className={styles.welcomeTitle}>
                            Hola, <span className="text-gradient">{userName}</span> 👋 (v2.0)
                        </h1>
                        <p className={styles.subtitle}>
                            {isAdmin
                                ? 'Resumen ejecutivo de Vilanova Pinturas.'
                                : 'Panel de control operativo.'}
                        </p>
                    </div>
                    <div className="glass-panel" style={{ padding: '8px 16px', borderRadius: '12px', border: isAdmin ? '1px solid #00c853' : '1px solid #3b82f6' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: isAdmin ? '#00c853' : '#3b82f6' }}>
                            {isAdmin ? '🛡️ MODO: ADMINISTRADOR' : '👷 MODO: COLABORADOR'}
                        </span>
                    </div>
                </div>
            </header>

            {isAdmin ? (
                <div className={styles.adminDashboard}>
                    <div className={styles.statsGrid}>
                        <StatCard icon="🏗️" label="Obras en Curso" value={activeWorksCount} color="blue" />
                        <StatCard icon="⏳" label="Pendientes" value={pendingWorksCount} color="orange" />
                        <StatCard icon="👥" label="Colaboradores" value={activeEmployeesCount} color="green" />
                        <StatCard icon="🤝" label="Clientes Totales" value={totalClientsCount} color="purple" />
                    </div>

                    <div className={`${styles.invoicePanel} glass-panel`}>
                        <div className={styles.invoiceHeader}>
                            <h2 className={styles.sectionTitle}>💰 Resumen Facturación (Mes Actual)</h2>
                            <Link href="/facturas">
                                <Button variant="secondary" style={{ fontSize: '0.8rem' }}>Ver todas las facturas</Button>
                            </Link>
                        </div>
                        <div className={styles.invoiceGrid}>
                            <div className={styles.invoiceStat}>
                                <span className={styles.invoiceLabel}>Emitidas</span>
                                <span className={styles.invoiceValue}>{statusStats.emitidas}</span>
                            </div>
                            <div className={styles.invoiceStat}>
                                <span className={styles.invoiceLabel}>Cobradas</span>
                                <span className={styles.invoiceValue} style={{ color: '#00c853' }}>{statusStats.pagadas}</span>
                            </div>
                            <div className={styles.invoiceStat}>
                                <span className={styles.invoiceLabel}>Pendientes</span>
                                <span className={styles.invoiceValue} style={{ color: '#3b82f6' }}>{statusStats.pendientes}</span>
                            </div>
                            <div className={styles.invoiceStat}>
                                <span className={styles.invoiceLabel}>Total Mensual</span>
                                <span className={styles.invoiceValue} style={{ fontSize: '1.2rem' }}>€&nbsp;{statusStats.total.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                        <div className={styles.progressContainer}>
                            <div className={styles.progressBar}>
                                <div
                                    className={styles.progressFill}
                                    style={{
                                        width: `${(statusStats.montoPagado / (statusStats.total || 1)) * 100}%`,
                                        background: '#00c853'
                                    }}
                                />
                            </div>
                            <div className={styles.progressText}>
                                <span>Cobrado: €&nbsp;{statusStats.montoPagado.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
                                <span>Pendiente: €&nbsp;{statusStats.montoPendiente.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    </div>

                    <div className={`${styles.requestsPanel} glass-panel`}>
                        <div className={styles.invoiceHeader}>
                            <h2 className={styles.sectionTitle}>👷 Personal en Obra (Vivo)</h2>
                            <span className={styles.activePulseBadge}>{activeTasks.length} activos</span>
                        </div>
                        <div className={styles.activeTasksGrid}>
                            {activeTasks.length > 0 ? (
                                activeTasks.map(task => (
                                    <div key={task.id} className={styles.activeTaskCard}>
                                        <div className={styles.activeTaskMain}>
                                            <div className={styles.activeTaskTimer}>
                                                <span className={styles.liveIndicator}>● LIVE</span>
                                                <span className={styles.timerValue}>
                                                    {Math.floor((Date.now() - new Date(task.startDate || '').getTime()) / 60000)} min
                                                </span>
                                            </div>
                                            <h4 className={styles.activeTaskTitle}>{task.title}</h4>
                                            <p className={styles.activeTaskWork}>{task.workTitle}</p>
                                            <div className={styles.activeTaskCrew}>
                                                {task.assignedNames.map((name, i) => (
                                                    <span key={i} className={styles.crewTag}>{name}</span>
                                                ))}
                                            </div>
                                        </div>
                                        <Link href={`/obras/${task.workId}`}>
                                            <button className={styles.viewTaskBtn}>↗</button>
                                        </Link>
                                    </div>
                                ))
                            ) : (
                                <p className={styles.emptyActive}>No hay personal con tareas iniciadas en este momento.</p>
                            )}
                        </div>
                    </div>

                    <div className={`${styles.requestsPanel} glass-panel`}>
                        <div className={styles.invoiceHeader}>
                            <h2 className={styles.sectionTitle}>📬 Solicitudes de Empleados</h2>
                            <span className={styles.requestBadge}>{pendingRequests.length} pendientes</span>
                        </div>

                        {pendingRequests.length > 0 ? (
                            <div className={styles.requestsGrid}>
                                {pendingRequests.map(req => (
                                    <div key={req.id} className={styles.requestCard}>
                                        <div className={styles.requestInfo}>
                                            <div className={styles.requestMain}>
                                                <div className={styles.requestMeta}>
                                                    <span className={styles.requestType}>{req.type}</span>
                                                    <strong>{req.employeeName}</strong>
                                                </div>
                                                <p className={styles.requestDesc}>{req.description}</p>
                                                <div className={styles.requestDetails}>
                                                    {req.amount && <span className={styles.requestAmount}>Importe: €&nbsp;{req.amount.toLocaleString()}</span>}
                                                    {req.requestedDate && <span className={styles.requestDate}>Fecha: {new Date(req.requestedDate).toLocaleDateString()}</span>}
                                                </div>
                                            </div>

                                            {processingId === req.id ? (
                                                <div className={styles.actionForm}>
                                                    <textarea
                                                        placeholder="Añadir observaciones (opcional)..."
                                                        value={obs}
                                                        onChange={(e) => setObs(e.target.value)}
                                                        className={styles.obsInput}
                                                    />
                                                    <div className={styles.actionButtons}>
                                                        <Button variant="secondary" style={{ height: '32px', fontSize: '0.75rem' }} onClick={() => setProcessingId(null)}>Cancelar</Button>
                                                        <Button
                                                            onClick={() => handleRequestAction(req.id, 'Rechazado')}
                                                            style={{ backgroundColor: '#ef4444', color: 'white', border: 'none', height: '32px', fontSize: '0.75rem' }}
                                                        >
                                                            Rechazar
                                                        </Button>
                                                        <Button
                                                            onClick={() => handleRequestAction(req.id, 'Aprobado')}
                                                            style={{ backgroundColor: '#22c55e', color: 'white', border: 'none', height: '32px', fontSize: '0.75rem' }}
                                                        >
                                                            Aprobar
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className={styles.requestActions}>
                                                    <Button variant="secondary" onClick={() => setProcessingId(req.id)} style={{ height: '32px', fontSize: '0.75rem' }}>Gestionar</Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className={styles.emptyRequests}>
                                <span>✅</span>
                                <p>No hay solicitudes pendientes de revisión.</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                // EMPLOYEE VIEW
                <div className={styles.employeeLayout}>
                    <TimeClock />

                    <div>
                        <h2 className={styles.sectionTitle}>
                            🏗️ Mis Obras Asignadas
                        </h2>
                        {employeeWorks.length > 0 ? (
                            <div className={styles.worksGrid}>
                                {employeeWorks.map(work => {
                                    const myTasks = work.tasks.filter(t => t.assignedTo.includes(currentEmployee?.id || ''));
                                    const totalPoints = myTasks.reduce((sum, t) => sum + t.points, 0);
                                    const estimatedReward = totalPoints * 0.25; // Default point value

                                    return (
                                        <div key={work.id} className={`glass-panel ${styles.workCard}`}>
                                            <div className={styles.workInfo}>
                                                <h3>{work.title}</h3>
                                                <div className={styles.workDetailsRow}>
                                                    <p className={styles.workMeta}>
                                                        📅 Final: {work.endDate ? new Date(work.endDate).toLocaleDateString() : 'Pendiente'}
                                                    </p>
                                                    {totalPoints > 0 && (
                                                        <span className={styles.potentialRewardBadge}>
                                                            🏆 {totalPoints} pts (~€{estimatedReward.toFixed(2)})
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <Link href={`/obras/${work.id}`}>
                                                <Button variant="secondary" style={{ height: '36px', fontSize: '0.85rem' }}>Ver Tareas</Button>
                                            </Link>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className={styles.emptyState}>
                                <p>No tienes obras activas asignadas actualmente.</p>
                            </div>
                        )}
                    </div>

                    <div>
                        <div className={styles.sectionHeader}>
                            <h2 className={styles.sectionTitle}>📬 Mis Solicitudes</h2>
                            <Button onClick={() => setShowRequestModal(true)} style={{ height: '32px', fontSize: '0.8rem' }}>+ Nueva Solicitud</Button>
                        </div>

                        <div className={styles.myRequestsGrid}>
                            {myRequests.length > 0 ? (
                                [...myRequests].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(req => (
                                    <div key={req.id} className={`${styles.myRequestCard} glass-panel`}>
                                        <div className={styles.myRequestHeader}>
                                            <span className={styles.requestType}>{req.type}</span>
                                            <span className={`${styles.statusBadge} ${styles[req.status.toLowerCase()]}`}>
                                                {req.status}
                                            </span>
                                        </div>
                                        <p className={styles.myRequestDesc}>{req.description}</p>
                                        <div className={styles.myRequestMeta}>
                                            <span>📅 {new Date(req.date).toLocaleDateString()}</span>
                                            {req.amount && <span>💰 €&nbsp;{req.amount}</span>}
                                        </div>
                                        {req.adminObservations && (
                                            <div className={styles.adminObs}>
                                                <small>Respuesta Admin:</small>
                                                <p>{req.adminObservations}</p>
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className={styles.emptyRequestsSmall}>No has realizado solicitudes todavía.</div>
                            )}
                        </div>
                    </div>

                    {showRequestModal && (
                        <div className={styles.modalOverlay}>
                            <div className={`${styles.modalContent} glass-panel`}>
                                <h3 className={styles.modalTitle}>Nueva Solicitud</h3>
                                <form onSubmit={handleAddRequest}>
                                    <div className={styles.formGroup}>
                                        <label>Tipo de Solicitud</label>
                                        <select
                                            value={newRequest.type}
                                            onChange={e => setNewRequest({ ...newRequest, type: e.target.value as any })}
                                            className={styles.modalInput}
                                        >
                                            <option value="Vacaciones">Vacaciones</option>
                                            <option value="Gasto">Gasto (Reembolso)</option>
                                            <option value="Material">Petición de Material</option>
                                            <option value="Otro">Otro</option>
                                        </select>
                                    </div>

                                    {newRequest.type === 'Vacaciones' && (
                                        <div className={styles.formGroup}>
                                            <label>Fecha de Inicio</label>
                                            <input
                                                type="date"
                                                value={newRequest.requestedDate}
                                                onChange={e => setNewRequest({ ...newRequest, requestedDate: e.target.value })}
                                                className={styles.modalInput}
                                                required
                                            />
                                        </div>
                                    )}

                                    {newRequest.type === 'Gasto' && (
                                        <div className={styles.formGroup}>
                                            <label>Importe (€)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={newRequest.amount}
                                                onChange={e => setNewRequest({ ...newRequest, amount: Number(e.target.value) })}
                                                className={styles.modalInput}
                                                required
                                            />
                                        </div>
                                    )}

                                    <div className={styles.formGroup}>
                                        <label>Descripción / Motivo</label>
                                        <textarea
                                            value={newRequest.description}
                                            onChange={e => setNewRequest({ ...newRequest, description: e.target.value })}
                                            className={styles.modalTextarea}
                                            placeholder="Detalla tu solicitud..."
                                            required
                                        />
                                    </div>

                                    <div className={styles.modalActions}>
                                        <Button type="button" variant="secondary" onClick={() => setShowRequestModal(false)}>Cancelar</Button>
                                        <Button type="submit">Enviar Solicitud</Button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function StatCard({ icon, label, value, color }: { icon: string, label: string, value: number, color: string }) {
    const colors: any = {
        blue: 'hsla(210, 100%, 50%, 0.1)',
        orange: 'hsla(30, 100%, 50%, 0.1)',
        green: 'hsla(150, 100%, 50%, 0.1)',
        purple: 'hsla(270, 100%, 50%, 0.1)',
    };

    return (
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
                width: '48px', height: '48px', borderRadius: '12px',
                background: colors[color], display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.5rem'
            }}>
                {icon}
            </div>
            <div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{label}</p>
                <p style={{ fontSize: '1.8rem', fontWeight: 'bold', lineHeight: 1 }}>{value}</p>
            </div>
        </div>
    );
}
