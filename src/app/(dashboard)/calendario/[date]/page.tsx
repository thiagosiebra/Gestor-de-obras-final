'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useApp } from '@/lib/context';
import styles from './page.module.css';

export default function DayViewPage() {
    const params = useParams();
    const router = useRouter();
    const { works, currentUser, employees, tasks, addTask, deleteTask, updateTask } = useApp();
    const dateStr = decodeURIComponent(params.date as string);
    const isAdmin = currentUser?.role === 'admin';
    const currentEmployee = employees.find(e => e.email === currentUser?.email);

    // Request State (Shared/Employee)
    const [showModal, setShowModal] = useState(false);
    const [requestType, setRequestType] = useState<'material' | 'ausencia' | 'obra_admin' | 'visita_admin' | 'obs_admin' | null>(null);
    const [ausenciaSubtype, setAusenciaSubtype] = useState<string>('');

    // Material State
    const [materialUrgency, setMaterialUrgency] = useState<'baja' | 'media' | 'alta'>('baja');
    const [materialItems, setMaterialItems] = useState<string[]>([]);
    const [newItem, setNewItem] = useState('');
    const [recentMaterials, setRecentMaterials] = useState<string[]>([]);

    // Admin State
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [adminFormData, setAdminFormData] = useState({
        title: '',
        assignedTo: '',
        address: '',
        workId: '',
        note: '',
        isGlobal: false,
        rewardValue: 0,
        estimatedHours: 0
    });
    const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);

    const [formData, setFormData] = useState({
        note: '',
        startTime: '',
        endTime: '',
        startDate: '',
        endDate: ''
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(dateStr);
    const diffTime = selectedDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const canRequestAbsence = diffDays >= 5;

    // Load material history
    React.useEffect(() => {
        const history = localStorage.getItem('material_history');
        if (history) setRecentMaterials(JSON.parse(history));
    }, []);

    // Filter items active on this date
    // 1. Projects (Works)
    const activeWorks = works.filter(w => {
        return w.startDate <= dateStr && w.endDate >= dateStr;
    });

    // 2. Calendar Tasks (Visits, Obs, Assigned Works)
    const dayTasks = tasks.filter(t => {
        if (t.date !== dateStr) return false;
        if (isAdmin) return true;
        if (t.isGlobal) return true;
        return t.assignedTo === currentEmployee?.id;
    });

    const handleRequest = (type: 'material' | 'ausencia') => {
        if (type === 'ausencia' && !canRequestAbsence) {
            alert('Las solicitudes de ausencia deben realizarse con al menos 5 días de antelación.');
            return;
        }
        setRequestType(type);
        setEditingTaskId(null);
        setAusenciaSubtype('');
        setMaterialUrgency('baja');
        setMaterialItems([]);
        setNewItem('');
        setFormData({ note: '', startTime: '', endTime: '', startDate: dateStr, endDate: dateStr });
        setShowModal(true);
    };

    const handleAdminAction = (type: 'obra_admin' | 'visita_admin' | 'obs_admin') => {
        setRequestType(type);
        setEditingTaskId(null);
        setAdminFormData({ title: '', assignedTo: '', address: '', workId: '', note: '', isGlobal: false, rewardValue: 0, estimatedHours: 0 });
        setShowModal(true);
    };

    const handleEditTask = (task: any) => {
        const typeMapInv = {
            'obra': 'obra_admin',
            'visita': 'visita_admin',
            'observacion': 'obs_admin'
        } as const;
        setRequestType(typeMapInv[task.type as keyof typeof typeMapInv]);
        setEditingTaskId(task.id);
        setAdminFormData({
            title: task.title,
            assignedTo: task.assignedTo,
            address: task.address || '',
            workId: task.workId || '',
            note: task.note || '',
            isGlobal: task.isGlobal || false,
            rewardValue: task.rewardValue || 0,
            estimatedHours: task.estimatedHours || 0
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingTaskId(null);
    };

    const handleAddItem = (e: React.MouseEvent | React.KeyboardEvent) => {
        e.preventDefault();
        if (!newItem.trim()) return;
        if (!materialItems.includes(newItem.trim())) {
            setMaterialItems([...materialItems, newItem.trim()]);
        }
        setNewItem('');
    };

    const handleRemoveItem = (itemToRemove: string) => {
        setMaterialItems(materialItems.filter(item => item !== itemToRemove));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (requestType === 'material') {
            const newHistory = Array.from(new Set([...recentMaterials, ...materialItems]));
            localStorage.setItem('material_history', JSON.stringify(newHistory));
            setRecentMaterials(newHistory);
            alert('Solicitud de Material Enviada');
        } else if (requestType === 'ausencia') {
            alert('Solicitud de Ausencia Enviada');
        } else {
            // Admin Actions
            const typeMap = {
                'obra_admin': 'obra',
                'visita_admin': 'visita',
                'obs_admin': 'observacion'
            } as const;

            const taskData = {
                type: typeMap[requestType as keyof typeof typeMap],
                title: adminFormData.title,
                date: dateStr,
                assignedTo: adminFormData.isGlobal ? 'all' : adminFormData.assignedTo,
                address: adminFormData.address,
                workId: adminFormData.workId,
                note: adminFormData.note,
                isGlobal: adminFormData.isGlobal,
                rewardValue: adminFormData.rewardValue,
                estimatedHours: adminFormData.estimatedHours,
            };

            if (editingTaskId) {
                updateTask(editingTaskId, taskData);
                alert('Tarea actualizada correctamente');
            } else {
                addTask({ ...taskData, status: 'Pendiente' });
                alert('Tarea programada correctamente');
            }
        }

        closeModal();
    };

    const getModalTitle = () => {
        if (editingTaskId) return `Editar ${getTaskLabel(requestType)}`;
        switch (requestType) {
            case 'material': return 'Solicitud de Material';
            case 'ausencia': return 'Gestión de Ausencia';
            case 'obra_admin': return '🏗️ Programar Obra';
            case 'visita_admin': return '🚗 Programar Visita';
            case 'obs_admin': return '📝 Añadir Observación';
            default: return '';
        }
    };

    const getTaskLabel = (type: any) => {
        if (type === 'obra_admin') return 'Obra';
        if (type === 'visita_admin') return 'Visita';
        if (type === 'obs_admin') return 'Observación';
        return '';
    };

    const filteredSuggestions = recentMaterials.filter(m =>
        m.toLowerCase().includes(newItem.toLowerCase()) && !materialItems.includes(m)
    ).slice(0, 5);

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.dateTitle}>Detalles del Día</h1>
                    <p className={styles.dateSubtitle}>{new Date(dateStr).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                </div>
                <Link href="/calendario" className={styles.backLink}>← Volver al Calendario</Link>
            </header>

            <div className={styles.requestButtons} style={{ marginBottom: '32px' }}>
                {!isAdmin ? (
                    <>
                        <button className={`${styles.reqBtn} ${styles.reqMaterial}`} onClick={() => handleRequest('material')}>
                            <span style={{ fontSize: '1.5rem' }}>🧱</span>
                            <span>Solicitar Material</span>
                        </button>
                        <div style={{ position: 'relative' }}>
                            <button
                                className={`${styles.reqBtn} ${styles.reqAusencia}`}
                                onClick={() => handleRequest('ausencia')}
                                style={{ opacity: canRequestAbsence ? 1 : 0.5, cursor: canRequestAbsence ? 'pointer' : 'not-allowed', width: '100%' }}
                                title={canRequestAbsence ? '' : 'Requiere 5 días de antelación'}
                            >
                                <span style={{ fontSize: '1.5rem' }}>🏖️</span>
                                <span>Ausencia / Permiso</span>
                            </button>
                            {!canRequestAbsence && (
                                <div style={{ position: 'absolute', bottom: '-25px', left: 0, right: 0, textAlign: 'center', fontSize: '0.75rem', color: '#ef4444' }}>
                                    Mín. 5 días antelación
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        <button className={`${styles.reqBtn}`} onClick={() => handleAdminAction('obra_admin')} style={{ borderColor: 'var(--primary-color)' }}>
                            <span style={{ fontSize: '1.5rem' }}>🏗️</span>
                            <span>Programar Obra</span>
                        </button>
                        <button className={`${styles.reqBtn}`} onClick={() => handleAdminAction('visita_admin')} style={{ borderColor: '#f59e0b' }}>
                            <span style={{ fontSize: '1.5rem' }}>🚗</span>
                            <span>Programar Visita</span>
                        </button>
                        <button className={`${styles.reqBtn}`} onClick={() => handleAdminAction('obs_admin')} style={{ borderColor: 'var(--text-secondary)' }}>
                            <span style={{ fontSize: '1.5rem' }}>📝</span>
                            <span>Observación</span>
                        </button>
                    </>
                )}
            </div>

            <h2 className={styles.sectionTitle}>📋 Tareas y Eventos</h2>

            <div style={{ display: 'grid', gap: '16px' }}>
                {/* 1. Global / Assigned Tasks (Visits, Obs) */}
                {dayTasks.map(task => {
                    const assignedEmp = employees.find(e => e.id === task.assignedTo);
                    const isCompleted = task.status === 'Completada' || task.status === 'Validada';

                    return (
                        <div key={task.id} className={styles.workCard} style={{
                            borderLeft: `4px solid ${task.type === 'visita' ? '#f59e0b' : task.type === 'obra' ? 'var(--primary-color)' : 'var(--text-secondary)'}`,
                            opacity: isCompleted ? 0.7 : 1
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                        <span style={{ fontSize: '1.2rem' }}>
                                            {task.type === 'visita' ? '🚗' : task.type === 'obra' ? '🏗️' : '📝'}
                                        </span>
                                        <h3 style={{ fontSize: '1.1rem', textDecoration: isCompleted ? 'line-through' : 'none' }}>{task.title}</h3>
                                        {task.isGlobal && <span style={{ fontSize: '0.7rem', background: '#ef4444', color: 'white', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>Global</span>}
                                        {isCompleted && <span style={{ fontSize: '0.7rem', background: '#22c55e', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>{task.status}</span>}
                                    </div>

                                    {task.address && <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>📍 {task.address}</p>}
                                    {task.note && <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginTop: '8px', fontStyle: 'italic' }}>"{task.note}"</p>}

                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', marginTop: '12px' }}>
                                        <span className={styles.statusBadge} style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>
                                            {task.type.toUpperCase()}
                                        </span>
                                        {task.rewardValue ? (
                                            <span style={{ fontSize: '0.85rem', color: '#22c55e', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                💰 {task.rewardValue}€
                                            </span>
                                        ) : null}
                                        {task.estimatedHours ? (
                                            <span style={{ fontSize: '0.85rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                ⏱️ {task.estimatedHours}h
                                            </span>
                                        ) : null}
                                        {isAdmin && !task.isGlobal && (
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                                Para: {assignedEmp ? `${assignedEmp.firstName} ${assignedEmp.lastName}` : 'Desconocido'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    {!isAdmin && !isCompleted && task.assignedTo === currentEmployee?.id && (
                                        <button
                                            className={styles.reqBtn}
                                            style={{ padding: '4px 12px', fontSize: '0.8rem', borderColor: '#22c55e', color: '#22c55e' }}
                                            onClick={() => {
                                                if (confirm('¿Has terminado esta tarea?')) {
                                                    updateTask(task.id, { status: 'Completada' });
                                                }
                                            }}
                                        >
                                            Terminar
                                        </button>
                                    )}
                                    {isAdmin && (
                                        <>
                                            {task.status === 'Completada' && (
                                                <button
                                                    className={styles.reqBtn}
                                                    style={{ padding: '4px 12px', fontSize: '0.8rem', borderColor: '#3b82f6', color: '#3b82f6' }}
                                                    onClick={() => {
                                                        if (confirm('¿Validar esta tarea? Se confirmará la recompensa para el empleado.')) {
                                                            updateTask(task.id, { status: 'Validada' });
                                                        }
                                                    }}
                                                >
                                                    Validar
                                                </button>
                                            )}
                                            <button className={styles.iconBtn} onClick={() => handleEditTask(task)} title="Editar">✏️</button>
                                            <button className={styles.iconBtn} onClick={() => deleteTask(task.id)} title="Eliminar" style={{ color: '#ef4444' }}>🗑️</button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* 2. Projects (Standard Works) */}
                {activeWorks.map(work => (
                    <div key={work.id} className={styles.workCard} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <span style={{ fontSize: '1.2rem' }}>🏢</span>
                                <h3 style={{ fontSize: '1.1rem' }}>{work.title}</h3>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <span className={styles.statusBadge}>{work.status}</span>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Proyecto Activo</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <Link href={`/obras/${work.id}`}>
                                <Button variant="secondary" style={{ fontSize: '0.85rem' }}>Ver Detalles</Button>
                            </Link>
                        </div>
                    </div>
                ))}

                {dayTasks.length === 0 && activeWorks.length === 0 && (
                    <div style={{ padding: '40px', textAlign: 'center', opacity: 0.7, background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                        No hay tareas programadas para este día.
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h3 className={styles.modalTitle}>{getModalTitle()}</h3>

                        <form onSubmit={handleSubmit} className={styles.form}>
                            {/* Material Form */}
                            {requestType === 'material' && (
                                <>
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Nivel de Urgencia</label>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            {['baja', 'media', 'alta'].map((level) => (
                                                <button
                                                    key={level}
                                                    type="button"
                                                    onClick={() => setMaterialUrgency(level as any)}
                                                    style={{
                                                        flex: 1, padding: '8px', borderRadius: '8px',
                                                        background: materialUrgency === level
                                                            ? (level === 'alta' ? '#ef4444' : level === 'media' ? '#f59e0b' : '#22c55e')
                                                            : 'rgba(255,255,255,0.1)',
                                                        color: 'white', fontWeight: 'bold', cursor: 'pointer', border: 'none'
                                                    }}
                                                >
                                                    {level.charAt(0).toUpperCase() + level.slice(1)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Items / Herramientas</label>
                                        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                            <div style={{ flex: 1, position: 'relative' }}>
                                                <Input
                                                    id="newItem"
                                                    label="Añadir Item"
                                                    placeholder="Ej: Pintura Blanca..."
                                                    value={newItem}
                                                    onChange={(e) => setNewItem(e.target.value)}
                                                    autoComplete="off"
                                                />
                                                {newItem && filteredSuggestions.length > 0 && (
                                                    <div style={{
                                                        position: 'absolute', top: '100%', left: 0, right: 0,
                                                        background: '#1f2937', border: '1px solid #374151',
                                                        zIndex: 10, borderRadius: '8px', overflow: 'hidden'
                                                    }}>
                                                        {filteredSuggestions.map(s => (
                                                            <div key={s} onClick={() => setNewItem(s)} style={{ padding: '8px', cursor: 'pointer', borderBottom: '1px solid #374151' }}>{s}</div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <Button type="button" onClick={handleAddItem} style={{ alignSelf: 'flex-end', height: '44px' }}>+</Button>
                                        </div>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', minHeight: '40px', padding: '8px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                                            {materialItems.map((item, idx) => (
                                                <span key={idx} style={{ background: 'var(--primary-color)', color: 'white', padding: '4px 8px', borderRadius: '16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    {item}
                                                    <button type="button" onClick={() => handleRemoveItem(item)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>×</button>
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Ausencia Form */}
                            {requestType === 'ausencia' && (
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Motivo</label>
                                    <select className={styles.select} value={ausenciaSubtype} onChange={(e) => setAusenciaSubtype(e.target.value)} required>
                                        <option value="">Seleccione...</option>
                                        <option value="horas_libres">Horas Libres</option>
                                        <option value="vacaciones">Vacaciones</option>
                                        <option value="cita_medica">Cita Médica</option>
                                        <option value="enfermedad">Baja / Enfermedad</option>
                                    </select>
                                    {ausenciaSubtype === 'horas_libres' && (
                                        <div className={styles.row} style={{ marginTop: '16px' }}>
                                            <Input id="startTime" label="Desde" type="time" value={formData.startTime} onChange={(e) => setFormData({ ...formData, startTime: e.target.value })} required />
                                            <Input id="endTime" label="Hasta" type="time" value={formData.endTime} onChange={(e) => setFormData({ ...formData, endTime: e.target.value })} required />
                                        </div>
                                    )}
                                    {ausenciaSubtype === 'vacaciones' && (
                                        <div className={styles.row} style={{ marginTop: '16px' }}>
                                            <Input id="startDate" label="Desde" type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} required />
                                            <Input id="endDate" label="Hasta" type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} required />
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Admin Forms */}
                            {(requestType === 'obra_admin' || requestType === 'visita_admin' || requestType === 'obs_admin') && (
                                <>
                                    <Input
                                        id="adminTitle"
                                        label={requestType === 'obs_admin' ? 'Título del Aviso' : 'Nombre / Descripción'}
                                        placeholder="Escriba aquí..."
                                        value={adminFormData.title}
                                        onChange={(e) => setAdminFormData({ ...adminFormData, title: e.target.value })}
                                        required
                                    />

                                    {requestType === 'visita_admin' && (
                                        <div style={{ position: 'relative' }}>
                                            <Input
                                                id="adminAddress"
                                                label="Dirección de la Visita"
                                                placeholder="Ej: Calle Mayor 10..."
                                                value={adminFormData.address}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setAdminFormData({ ...adminFormData, address: val });
                                                    if (val.length > 2) {
                                                        const suggestions = [
                                                            `${val} Principal, 15001 A Coruña`,
                                                            `${val} Avenida, 15002 A Coruña`,
                                                            `${val} Plaza, 15003 A Coruña`,
                                                            `Rúa ${val}, 15005 A Coruña`
                                                        ].filter(s => s.toLowerCase().includes(val.toLowerCase()));
                                                        setAddressSuggestions(suggestions);
                                                    } else {
                                                        setAddressSuggestions([]);
                                                    }
                                                }}
                                                required
                                            />
                                            {addressSuggestions.length > 0 && (
                                                <div className={styles.suggestionsDropdown}>
                                                    {addressSuggestions.map((s, i) => (
                                                        <div
                                                            key={i}
                                                            className={styles.suggestionItem}
                                                            onClick={() => {
                                                                setAdminFormData({ ...adminFormData, address: s });
                                                                setAddressSuggestions([]);
                                                            }}
                                                        >
                                                            {s}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {(requestType === 'obra_admin' || requestType === 'obs_admin') && (
                                        <div className={styles.formGroup}>
                                            <label className={styles.label}>Vincular a Proyecto (Obra)</label>
                                            <select
                                                className={styles.select}
                                                value={adminFormData.workId}
                                                onChange={(e) => setAdminFormData({ ...adminFormData, workId: e.target.value })}
                                            >
                                                <option value="">Seleccione obra (opcional)</option>
                                                {works.map(w => (
                                                    <option key={w.id} value={w.id}>{w.title}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Asignar a Colaborador</label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <select
                                                className={styles.select}
                                                style={{ flex: 1 }}
                                                value={adminFormData.assignedTo}
                                                onChange={(e) => setAdminFormData({ ...adminFormData, assignedTo: e.target.value })}
                                                disabled={adminFormData.isGlobal}
                                                required={!adminFormData.isGlobal && requestType !== 'obs_admin'}
                                            >
                                                <option value="">Seleccione...</option>
                                                {employees.map(emp => (
                                                    <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                                                ))}
                                            </select>

                                            {requestType === 'obs_admin' && (
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={adminFormData.isGlobal}
                                                        onChange={(e) => setAdminFormData({ ...adminFormData, isGlobal: e.target.checked })}
                                                    />
                                                    <span style={{ fontSize: '0.85rem' }}>Enviar a todos</span>
                                                </label>
                                            )}
                                        </div>
                                    </div>

                                    <div className={styles.row} style={{ gap: '16px' }}>
                                        <Input
                                            id="adminReward"
                                            label="Recompensa (€)"
                                            type="number"
                                            value={adminFormData.rewardValue.toString()}
                                            onChange={(e) => setAdminFormData({ ...adminFormData, rewardValue: parseFloat(e.target.value) || 0 })}
                                        />
                                        <Input
                                            id="adminHours"
                                            label="Horas Estimadas"
                                            type="number"
                                            value={adminFormData.estimatedHours.toString()}
                                            onChange={(e) => setAdminFormData({ ...adminFormData, estimatedHours: parseFloat(e.target.value) || 0 })}
                                        />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Notas adicionales / Observaciones</label>
                                        <textarea
                                            className={styles.textarea}
                                            value={adminFormData.note}
                                            onChange={(e) => setAdminFormData({ ...adminFormData, note: e.target.value })}
                                            placeholder="Detalles internos..."
                                        />
                                    </div>
                                </>
                            )}

                            {(requestType === 'material' || requestType === 'ausencia') && (
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Observaciones</label>
                                    <textarea className={styles.textarea} value={formData.note} onChange={(e) => setFormData({ ...formData, note: e.target.value })} placeholder="Opcional..." />
                                </div>
                            )}

                            <div className={styles.modalActions}>
                                <Button type="button" variant="secondary" onClick={closeModal}>Cancelar</Button>
                                <Button type="submit">Guardar</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

