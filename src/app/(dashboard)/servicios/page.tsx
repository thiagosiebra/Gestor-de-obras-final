'use client';

import React, { useState } from 'react';
import { useApp, Service } from '@/lib/context';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import styles from './page.module.css';

export default function ServicesPage() {
    const { services, addService, updateService, deleteService } = useApp();
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [form, setForm] = useState<Omit<Service, 'id'>>({
        title: '',
        description: '',
        defaultRate: 0,
        defaultIva: 21,
        subTasks: []
    });

    const handleSave = () => {
        if (editingId) {
            updateService(editingId, form);
            setEditingId(null);
        } else {
            addService(form);
            setIsAdding(false);
        }
        setForm({ title: '', description: '', defaultRate: 0, defaultIva: 21 });
    };

    const handleEdit = (service: Service) => {
        setForm({
            title: service.title,
            description: service.description,
            defaultRate: service.defaultRate,
            defaultIva: service.defaultIva,
            subTasks: service.subTasks || []
        });
        setEditingId(service.id);
        setIsAdding(true);
    };

    const addSubTask = () => {
        setForm({
            ...form,
            subTasks: [...(form.subTasks || []), { title: '', points: 1, timeLimit: 30 }]
        });
    };

    const updateSubTask = (index: number, data: any) => {
        const newSubTasks = [...(form.subTasks || [])];
        newSubTasks[index] = { ...newSubTasks[index], ...data };
        setForm({ ...form, subTasks: newSubTasks });
    };

    const removeSubTask = (index: number) => {
        const newSubTasks = (form.subTasks || []).filter((_, i) => i !== index);
        setForm({ ...form, subTasks: newSubTasks });
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Catálogo de Servicios</h1>
                    <p className={styles.subtitle}>Gestione sus servicios frecuentes para agilizar presupuestos</p>
                </div>
                {!isAdding && (
                    <Button onClick={() => setIsAdding(true)}>+ Nuevo Servicio</Button>
                )}
            </div>

            {isAdding && (
                <div className={`glass-panel ${styles.formCard}`}>
                    <h3 className={styles.cardTitle}>{editingId ? 'Editar Servicio' : 'Nuevo Servicio'}</h3>
                    <div className={styles.formGrid}>
                        <div style={{ gridColumn: 'span 2' }}>
                            <Input
                                id="title"
                                label="Título del Servicio"
                                value={form.title}
                                placeholder="Ej: Pintura Plástica Interior"
                                onChange={e => setForm({ ...form, title: e.target.value })}
                            />
                        </div>
                        <div className={styles.fieldWrapper}>
                            <Input
                                id="rate"
                                label="Tarifa Predeterminada (€)"
                                type="number"
                                value={form.defaultRate}
                                onChange={e => setForm({ ...form, defaultRate: Number(e.target.value) })}
                            />
                        </div>
                        <div className={styles.fieldWrapper}>
                            <Input
                                id="iva"
                                label="IVA Predeterminado (%)"
                                type="number"
                                value={form.defaultIva}
                                onChange={e => setForm({ ...form, defaultIva: Number(e.target.value) })}
                            />
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                            <div className={styles.subTasksHeader}>
                                <h4 className={styles.label}>📋 Tareas Recurrentes (Pasos de ejecución)</h4>
                                <Button variant="secondary" onClick={addSubTask}>+ Añadir Paso</Button>
                            </div>
                            <div className={styles.subTasksList}>
                                {form.subTasks?.map((st, index) => (
                                    <div key={index} className={styles.subTaskRow}>
                                        <input
                                            className={styles.subTaskTitle}
                                            placeholder="Ej: Empapelado de suelo"
                                            value={st.title}
                                            onChange={e => updateSubTask(index, { title: e.target.value })}
                                        />
                                        <div className={styles.subTaskMeta}>
                                            <div className={styles.metaItemShort}>
                                                <small>Pts</small>
                                                <input
                                                    type="number"
                                                    value={st.points}
                                                    onChange={e => updateSubTask(index, { points: Number(e.target.value) })}
                                                />
                                            </div>
                                            <div className={styles.metaItemShort}>
                                                <small>Min</small>
                                                <input
                                                    type="number"
                                                    value={st.timeLimit}
                                                    onChange={e => updateSubTask(index, { timeLimit: Number(e.target.value) })}
                                                />
                                            </div>
                                            <button className={styles.removeBtn} onClick={() => removeSubTask(index)}>✕</button>
                                        </div>
                                    </div>
                                ))}
                                {(!form.subTasks || form.subTasks.length === 0) && (
                                    <p className={styles.emptySubtasks}>No hay pasos definidos. Al aceptar el presupuesto, se generará una sola tarea genérica.</p>
                                )}
                            </div>
                        </div>

                        <div style={{ gridColumn: 'span 2' }}>
                            <label className={styles.label}>Descripción Detallada (Materiales...)</label>
                            <textarea
                                className={styles.textarea}
                                value={form.description}
                                placeholder="Describa el servicio..."
                                onChange={e => setForm({ ...form, description: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className={styles.formActions}>
                        <Button variant="secondary" onClick={() => { setIsAdding(false); setEditingId(null); }}>Cancelar</Button>
                        <Button onClick={handleSave}>Guardar Servicio</Button>
                    </div>
                </div>
            )}

            <div className={styles.servicesGrid}>
                {services.map(service => (
                    <div key={service.id} className={`glass-panel ${styles.serviceCard}`}>
                        <div className={styles.serviceHeader}>
                            <h3 className={styles.serviceTitle}>{service.title}</h3>
                            <div className={styles.serviceRate}>
                                {service.defaultRate.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                <span className={styles.ivaLabel}> + {service.defaultIva}% IVA</span>
                            </div>
                        </div>
                        <p className={styles.serviceDesc}>{service.description}</p>
                        {service.subTasks && service.subTasks.length > 0 && (
                            <div className={styles.templateBadge}>
                                🔄 Incluye {service.subTasks.length} tareas automáticas
                            </div>
                        )}
                        <div className={styles.serviceActions}>
                            <button onClick={() => handleEdit(service)} className={styles.editBtn}>✏️ Editar</button>
                            <button onClick={() => deleteService(service.id)} className={styles.deleteBtn}>🗑️ Eliminar</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
