'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useApp, ProjectPhoto, Work } from '@/lib/context';
import { Button } from '@/components/ui/Button';
import styles from './page.module.css';

const SignaturePad = ({ onSave, onCancel }: { onSave: (data: string) => void, onCancel: () => void }) => {
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [canvasWidth, setCanvasWidth] = useState(500);

    useEffect(() => {
        const updateWidth = () => {
            const width = Math.min(window.innerWidth - 60, 500);
            setCanvasWidth(width);
        };
        updateWidth();
        window.addEventListener('resize', updateWidth);
        return () => window.removeEventListener('resize', updateWidth);
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
    }, [canvasWidth]);

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDrawing(true);
        draw(e);
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx?.beginPath();
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        const rect = canvas.getBoundingClientRect();
        let x, y;

        if ('touches' in e) {
            x = e.touches[0].clientX - rect.left;
            y = e.touches[0].clientY - rect.top;
        } else {
            x = (e as React.MouseEvent).clientX - rect.left;
            y = (e as React.MouseEvent).clientY - rect.top;
        }

        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const clear = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (canvas && ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    };

    const save = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            onSave(canvas.toDataURL());
        }
    };

    return (
        <div className={styles.signatureModal}>
            <div className={`${styles.signatureModalContent} glass-panel`}>
                <h3>✍️ Firma de Entrega</h3>
                <p>El cliente debe firmar abajo para confirmar la entrega de la obra.</p>
                <canvas
                    ref={canvasRef}
                    width={canvasWidth}
                    height={250}
                    className={styles.signatureCanvas}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseOut={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                />
                <div className={styles.signatureActions}>
                    <Button variant="secondary" onClick={clear}>Limpiar</Button>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <Button variant="secondary" onClick={onCancel}>Cancelar</Button>
                        <Button onClick={save}>Finalizar Obra</Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function WorkDetailsPage() {
    const params = useParams();
    const { works, clients, currentUser, updateWork, employees, budgets, expenses, addExpense, deleteExpense } = useApp();
    const workId = params?.id as string;

    const work = works.find(w => w.id === workId);
    const client = work ? clients.find(c => c.id === work.clientId) : null;
    const budget = work ? budgets.find(b => b.id === work.budgetId) : null;

    const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
    const [signatureData, setSignatureData] = useState<string | null>(null);
    const [isSigning, setIsSigning] = useState(false);
    const [signed, setSigned] = useState(!!work?.digitalSignature);
    const [expandedConcepts, setExpandedConcepts] = useState<string[]>([]);
    const [selectedPhoto, setSelectedPhoto] = useState<ProjectPhoto | null>(null);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [activeConceptId, setActiveConceptId] = useState<string | null>(null);
    const [taskFormData, setTaskFormData] = useState({
        title: '',
        points: 10,
        timeLimit: 60,
        rate: 0
    });
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
    const [expenseFormData, setExpenseFormData] = useState({
        description: '',
        amount: 0,
        isFromStock: false,
        date: new Date().toISOString().split('T')[0],
        receiptPhoto: ''
    });

    const workExpenses = expenses.filter(e => e.workId === workId);
    const totalWorkExpenses = workExpenses.reduce((sum, e) => sum + e.amount, 0);

    if (!work) {
        return <div className="p-8 text-center">Obra no encontrada</div>;
    }

    const isAdmin = currentUser?.role === 'admin';

    const handleUpdateTask = (taskId: string, data: Partial<any>) => {
        const updatedTasks = work.tasks.map(t => t.id === taskId ? { ...t, ...data } : t);
        updateWork(work.id, { tasks: updatedTasks });
    };

    const handleTaskPhoto = (taskId: string, type: 'before' | 'progress' | 'after', source: 'camera' | 'gallery') => {
        const legend = prompt('Añada uma legenda para esta foto (ex: Inicio de habitacion, reparo de socalo...):') || '';

        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        if (source === 'camera') fileInput.capture = 'environment';

        fileInput.onchange = (e: any) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const newPhoto: ProjectPhoto = {
                        id: crypto.randomUUID(),
                        url: reader.result as string,
                        type: type,
                        date: new Date().toISOString(),
                        note: legend
                    };
                    const task = work.tasks.find(t => t.id === taskId);
                    if (task) {
                        const existingPhotos = task.photos || [];
                        handleUpdateTask(taskId, { photos: [...existingPhotos, newPhoto] });
                    }
                };
                reader.readAsDataURL(file);
            }
        };
        fileInput.click();
    };

    const handleAddPhoto = (source: 'camera' | 'gallery') => {
        const legend = prompt('Añada uma legenda para esta foto (ex: Vista inicial, detalle de acabado...):') || '';
        const typeStr = prompt('Tipo de foto: antes, progreso, después', 'antes');
        if (!typeStr) return;
        const normalizedType = typeStr === 'antes' ? 'before' : typeStr === 'progreso' ? 'progress' : 'after';

        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        if (source === 'camera') fileInput.capture = 'environment';

        fileInput.onchange = (e: any) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const newPhoto: ProjectPhoto = {
                        id: crypto.randomUUID(),
                        url: reader.result as string,
                        type: normalizedType as any,
                        date: new Date().toISOString(),
                        note: legend
                    };
                    const currentPhotos = work.photos || [];
                    updateWork(work.id, { photos: [...currentPhotos, newPhoto] });
                };
                reader.readAsDataURL(file);
            }
        };
        fileInput.click();
    };

    const startTask = (taskId: string) => {
        const source = confirm('¿Desea capturar foto desde la CÁMARA? (Aceptar = Cámara, Cancelar = Galería)') ? 'camera' : 'gallery';
        handleTaskPhoto(taskId, 'before', source);
        handleUpdateTask(taskId, {
            status: 'En Progreso',
            startDate: new Date().toISOString()
        });
    };

    const finishTask = (task: any) => {
        const source = confirm('¿Desea capturar foto de FINALIZACIÓN desde la CÁMARA? (Aceptar = Cámara, Cancelar = Galería)') ? 'camera' : 'gallery';
        handleTaskPhoto(task.id, 'after', source);
        const start = task.startDate ? new Date(task.startDate).getTime() : Date.now();
        const actualTime = Math.floor((Date.now() - start) / 60000); // to minutes

        handleUpdateTask(task.id, {
            status: 'Completada',
            completedDate: new Date().toISOString(),
            actualTime: actualTime
        });
    };

    const handleSign = (data: string) => {
        setIsSigning(true);
        setTimeout(() => {
            updateWork(work.id, {
                digitalSignature: data,
                status: 'Finalizado',
                progress: 100
            });
            setSigned(true);
            setIsSigning(false);
            setIsSignatureModalOpen(false);
            alert('Obra finalizada y firmada correctamente.');
        }, 1000);
    };

    const handleCreateTask = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingTaskId) {
            const updatedTasks = work.tasks.map(t =>
                t.id === editingTaskId
                    ? {
                        ...t,
                        title: taskFormData.title,
                        points: taskFormData.points,
                        timeLimit: taskFormData.timeLimit,
                        rate: taskFormData.rate
                    }
                    : t
            );
            updateWork(work.id, { tasks: updatedTasks });
            setEditingTaskId(null);
        } else if (activeConceptId) {
            const newTask: any = {
                id: crypto.randomUUID(),
                title: taskFormData.title,
                points: taskFormData.points,
                timeLimit: taskFormData.timeLimit,
                rate: taskFormData.rate,
                assignedTo: [],
                status: 'Pendiente',
                budgetItemId: activeConceptId,
                quantity: 1,
                unit: 'ud',
                iva: 0
            };
            updateWork(work.id, { tasks: [...work.tasks, newTask] });
        }

        setIsTaskModalOpen(false);
        setTaskFormData({ title: '', points: 10, timeLimit: 60, rate: 0 });
        setActiveConceptId(null);
    };

    const handleDeleteTask = (taskId: string) => {
        if (confirm('¿Estás seguro de que deseas eliminar esta tarea?')) {
            const updatedTasks = work.tasks.filter(t => t.id !== taskId);
            updateWork(work.id, { tasks: updatedTasks });
        }
    };

    const toggleAssignment = (taskId: string, employeeId: string) => {
        const task = work.tasks.find(t => t.id === taskId);
        if (!task) return;
        const assignedTo = task.assignedTo.includes(employeeId)
            ? task.assignedTo.filter(id => id !== employeeId)
            : [...task.assignedTo, employeeId];
        handleUpdateTask(taskId, { assignedTo });
    };

    const toggleWorkAssignment = (employeeId: string) => {
        const assignedEmployees = work.assignedEmployees || [];
        const newSelection = assignedEmployees.includes(employeeId)
            ? assignedEmployees.filter(id => id !== employeeId)
            : [...assignedEmployees, employeeId];
        updateWork(work.id, { assignedEmployees: newSelection });
    };

    const getStatusTextClass = (status: string) => {
        switch (status) {
            case 'En Progreso': return styles.textInProgress;
            case 'Finalizado':
            case 'Completada':
            case 'Validada': return styles.textDone;
            case 'Pendiente': return styles.textPending;
            default: return '';
        }
    };

    const TaskTimer = ({ startTime, timeLimit }: { startTime: string, timeLimit: number }) => {
        const [elapsed, setElapsed] = useState(0);

        useEffect(() => {
            const start = new Date(startTime).getTime();
            const interval = setInterval(() => {
                setElapsed(Math.floor((Date.now() - start) / 1000));
            }, 1000);
            return () => clearInterval(interval);
        }, [startTime]);

        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        const isOvertime = minutes >= timeLimit;
        const isUrgent = minutes >= timeLimit * 0.8;

        return (
            <div className={`${styles.stopwatch} ${isOvertime ? styles.overtime : isUrgent ? styles.urgent : ''}`}>
                ⏱ {minutes}:{seconds.toString().padStart(2, '0')}
                {isOvertime && <span className={styles.overtimeTag}>! Límite excedido</span>}
                {!isOvertime && isUrgent && <span className={styles.urgentTag}>Pronto</span>}
            </div>
        );
    };

    const handleExpenseReceipt = (source: 'camera' | 'gallery') => {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        if (source === 'camera') fileInput.capture = 'environment';

        fileInput.onchange = (e: any) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setExpenseFormData(prev => ({ ...prev, receiptPhoto: reader.result as string }));
                };
                reader.readAsDataURL(file);
            }
        };
        fileInput.click();
    };

    const toggleEmployeeAssignment = (taskId: string, employeeId: string) => {
        const task = work.tasks.find(t => t.id === taskId);
        if (!task) return;

        const assignedTo = task.assignedTo.includes(employeeId)
            ? task.assignedTo.filter(id => id !== employeeId)
            : [...task.assignedTo, employeeId];

        handleUpdateTask(taskId, { assignedTo });
    };

    const handleAddExpense = (e: React.FormEvent) => {
        e.preventDefault();
        addExpense({
            workId: workId,
            description: expenseFormData.description + (expenseFormData.isFromStock ? ' (Stock)' : ''),
            amount: expenseFormData.amount,
            date: expenseFormData.date,
            category: 'Material',
            receiptPhoto: expenseFormData.receiptPhoto
        });
        setIsExpenseModalOpen(false);
        setExpenseFormData({
            description: '',
            amount: 0,
            isFromStock: false,
            date: new Date().toISOString().split('T')[0],
            receiptPhoto: ''
        });
    };

    const margin = work.totalBudget > 0 ? ((work.totalBudget - totalWorkExpenses) / work.totalBudget) * 100 : 0;

    const currentUserEmail = currentUser?.email;
    const currentEmployee = employees.find(e => e.email === currentUserEmail);
    const employeePoints = work.tasks
        .filter(t => (t.status === 'Completada' || t.status === 'Validada') && t.assignedTo.includes(currentEmployee?.id || ''))
        .reduce((sum, t) => sum + (t.points || 0), 0);

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <Link href="/obras" className={styles.backLink}>← Volver a Obras</Link>
                        <div className={styles.titleSection}>
                            <div>
                                <h1 className={styles.title}>{work.title}</h1>
                                <p className={styles.clientName}>🏢 {client?.name || 'Cliente Desconocido'}</p>
                            </div>
                        </div>
                    </div>
                    {!isAdmin && (
                        <div className={`${styles.employeeHeaderStats} glass-panel`}>
                            <span className={styles.pointsTitle}>🏆 Mis Puntos</span>
                            <span className={styles.pointsValue}>{employeePoints}</span>
                        </div>
                    )}
                </div>

                <div className={styles.titleSection} style={{ marginTop: '16px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <span className={`glass-panel ${styles.statusBadge} ${getStatusTextClass(work.status)}`}>
                            {work.status}
                        </span>
                        {isAdmin && (
                            <select
                                className={styles.statusBadge}
                                style={{ background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
                                value={work.status}
                                onChange={(e) => updateWork(work.id, { status: e.target.value as any })}
                            >
                                <option value="Pendiente">Pendiente</option>
                                <option value="En Progreso">En Progreso</option>
                                <option value="Pausado">Pausado</option>
                                <option value="Finalizado">Finalizado</option>
                            </select>
                        )}
                    </div>
                </div>
            </header>

            <div className={styles.dashboardGrid}>
                <div className={styles.mainColumn}>
                    <div className={`${styles.statsCard} glass-panel`}>
                        <div className={styles.progressContainer}>
                            <div className={styles.progressLabel}>
                                <span>Progreso General</span>
                                <span>{work.progress}%</span>
                            </div>
                            <div className={styles.progressBar}>
                                <div className={styles.progressFill} style={{ width: `${work.progress}%` }} />
                            </div>
                        </div>

                        {isAdmin && (
                            <div className={styles.statsGrid}>
                                <div className={styles.statItem}>
                                    <span className={styles.statLabel}>Presupuesto Total</span>
                                    <span className={styles.statValue}>{work.totalBudget.toLocaleString()} €</span>
                                </div>
                                <div className={styles.statItem}>
                                    <span className={styles.statLabel}>Costos Materiales</span>
                                    <span className={styles.statValue} style={{ color: '#ff4d4d' }}>{totalWorkExpenses.toLocaleString()} €</span>
                                </div>
                                <div className={styles.statItem}>
                                    <span className={styles.statLabel}>Beneficio Estimado</span>
                                    <span className={styles.statValue} style={{ color: '#00c853' }}>{(work.totalBudget - totalWorkExpenses).toLocaleString()} €</span>
                                </div>
                                <div className={styles.statItem}>
                                    <span className={styles.statLabel}>Margen Real</span>
                                    <span className={styles.statValue}>{margin.toFixed(1)}%</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className={`${styles.statsCard} glass-panel`}>
                        <div className={styles.sectionTitle}>
                            <h2>📸 Galería de Obra</h2>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <Button variant="secondary" onClick={() => handleAddPhoto('camera')} title="Cámara">📸</Button>
                                <Button variant="secondary" onClick={() => handleAddPhoto('gallery')} title="Galería">🖼️</Button>
                            </div>
                        </div>
                        <div className={styles.galleryGrid}>
                            {work.photos?.map(photo => (
                                <div key={photo.id} className={styles.photoCard} onClick={() => setSelectedPhoto(photo)}>
                                    <img src={photo.url} alt="Progreso" className={styles.photoImg} />
                                    <div className={styles.photoOverlay}>
                                        <span className={styles.photoTag}>
                                            {photo.type === 'before' ? 'Antes' : photo.type === 'after' ? 'Después' : 'Progreso'}
                                        </span>
                                        {photo.note && <p className={styles.photoNotePreview}>{photo.note}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className={`${styles.statsCard} glass-panel`}>
                        <div className={styles.sectionTitle}>
                            <h2>📋 Tareas y Recompensas</h2>
                        </div>
                        <div className={styles.conceptsList}>
                            {budget?.items.map((concept) => {
                                const conceptTasks = work.tasks.filter(t => t.budgetItemId === concept.id);

                                // Sort: assigned to me first
                                const sortedTasks = [...conceptTasks].sort((a, b) => {
                                    const aMe = a.assignedTo.includes(currentEmployee?.id || '') ? 1 : 0;
                                    const bMe = b.assignedTo.includes(currentEmployee?.id || '') ? 1 : 0;
                                    return bMe - aMe;
                                });

                                const totalPoints = conceptTasks.reduce((sum, t) => sum + (t.points || 0), 0);
                                const totalTime = conceptTasks.reduce((sum, t) => sum + (t.timeLimit || 0), 0);
                                const isExpanded = expandedConcepts.includes(concept.id);
                                const conceptValue = concept.quantity * concept.rate;

                                return (
                                    <div key={concept.id} className={`${styles.conceptGroup} glass-panel`}>
                                        <div
                                            className={styles.conceptHeader}
                                            onClick={() => setExpandedConcepts(prev =>
                                                prev.includes(concept.id) ? prev.filter(id => id !== concept.id) : [...prev, concept.id]
                                            )}
                                        >
                                            <div className={styles.conceptMainInfo}>
                                                <span className={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</span>
                                                <h3 className={styles.conceptTitle}>{concept.title}</h3>
                                            </div>
                                            <div className={styles.conceptMeta}>
                                                <div className={styles.conceptBadge}>🏆 {totalPoints} pts</div>
                                                <div className={styles.conceptBadge}>⏱️ {totalTime} min</div>
                                                {isAdmin && <div className={styles.conceptBadge} style={{ color: '#4ade80' }}>{conceptValue.toLocaleString()} €</div>}
                                            </div>
                                        </div>

                                        {isExpanded && (
                                            <div className={styles.conceptTasks}>
                                                {sortedTasks.map((task) => {
                                                    const isMyTask = task.assignedTo.includes(currentEmployee?.id || '');
                                                    return (
                                                        <div key={task.id} className={`${styles.taskItem} ${isMyTask ? styles.myTaskCard : ''}`}>
                                                            <div className={styles.taskMainRow}>
                                                                <div className={styles.taskSummary}>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                                                                        <div>
                                                                            <h4 className={isMyTask ? styles.myTaskTitle : ''}>
                                                                                {isMyTask && '⭐️ '}{task.title}
                                                                            </h4>
                                                                            <span className={`${styles.statusBadgeSmall} ${getStatusTextClass(task.status)}`}>{task.status}</span>
                                                                        </div>
                                                                        {isAdmin && (
                                                                            <div className={styles.adminTaskActions}>
                                                                                <button
                                                                                    className={styles.iconBtn}
                                                                                    onClick={() => {
                                                                                        setEditingTaskId(task.id);
                                                                                        setTaskFormData({
                                                                                            title: task.title,
                                                                                            points: task.points || 0,
                                                                                            timeLimit: task.timeLimit || 0,
                                                                                            rate: task.rate || 0
                                                                                        });
                                                                                        setIsTaskModalOpen(true);
                                                                                    }}
                                                                                    title="Editar Tarea"
                                                                                >
                                                                                    ✏️
                                                                                </button>
                                                                                <button
                                                                                    className={styles.iconBtn}
                                                                                    onClick={() => handleDeleteTask(task.id)}
                                                                                    title="Eliminar Tarea"
                                                                                    style={{ color: '#ff4d4d' }}
                                                                                >
                                                                                    🗑️
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className={styles.taskActionsRow}>
                                                                    {isAdmin ? (
                                                                        <div style={{ display: 'flex', gap: '4px' }}>
                                                                            {employees.map(e => (
                                                                                <button
                                                                                    key={e.id}
                                                                                    className={`${styles.assigneeBtn} ${task.assignedTo.includes(e.id) ? styles.assigned : ''}`}
                                                                                    onClick={() => toggleAssignment(task.id, e.id)}
                                                                                    title={`${e.firstName} ${task.assignedTo.includes(e.id) ? '(Asignado)' : '(No asignado)'}`}
                                                                                >
                                                                                    {e.firstName[0]}
                                                                                </button>
                                                                            ))}
                                                                        </div>
                                                                    ) : isMyTask && (
                                                                        <div className={styles.employeeActionsMini}>
                                                                            {task.status === 'Pendiente' && <Button onClick={() => startTask(task.id)}>Iniciar</Button>}
                                                                            {task.status === 'En Progreso' && (
                                                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                                                    <Button variant="secondary" onClick={() => {
                                                                                        const source = confirm('¿Capturar progreso con CÁMARA?') ? 'camera' : 'gallery';
                                                                                        handleTaskPhoto(task.id, 'progress', source);
                                                                                    }}>📸 Foto</Button>
                                                                                    <Button onClick={() => finishTask(task)}>Finalizar</Button>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {task.status === 'En Progreso' && task.startDate && (
                                                                <TaskTimer startTime={task.startDate} timeLimit={task.timeLimit} />
                                                            )}

                                                            <div className={styles.taskPhotoMiniList}>
                                                                {task.photos?.map(p => (
                                                                    <img
                                                                        key={p.id}
                                                                        src={p.url}
                                                                        className={styles.taskThumb}
                                                                        title={p.note || p.type}
                                                                        onClick={() => setSelectedPhoto(p)}
                                                                    />
                                                                ))}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                                {isAdmin && (
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => {
                                                            setActiveConceptId(concept.id);
                                                            setTaskFormData({ title: '', points: 10, timeLimit: 60, rate: 0 });
                                                            setIsTaskModalOpen(true);
                                                        }}
                                                        style={{ width: '100%', borderStyle: 'dashed', marginTop: '8px' }}
                                                    >
                                                        + Añadir Tarea para "{concept.title}"
                                                    </Button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className={styles.sideColumn}>
                    <div className={`${styles.statsCard} glass-panel`}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ margin: 0 }}>👥 Equipo Asignado</h3>
                            {isAdmin && (
                                <Button variant="outline" onClick={() => setShowAssignModal(!showAssignModal)}>
                                    {showAssignModal ? 'Cerrar' : 'Asignar'}
                                </Button>
                            )}
                        </div>

                        {showAssignModal && isAdmin && (
                            <div className={styles.assignList}>
                                {employees.map(e => (
                                    <div
                                        key={e.id}
                                        className={`${styles.assignOption} ${work.assignedEmployees?.includes(e.id) ? styles.active : ''}`}
                                        onClick={() => toggleWorkAssignment(e.id)}
                                    >
                                        <div className={styles.avatarMini}>{e.firstName[0]}</div>
                                        <span>{e.firstName} {e.lastName}</span>
                                        {work.assignedEmployees?.includes(e.id) && <span className={styles.checkIcon}>✓</span>}
                                    </div>
                                ))}
                            </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {employees.filter(e => work.assignedEmployees?.includes(e.id)).map(e => (
                                <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                        {e.firstName[0]}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '14px', fontWeight: 500 }}>{e.firstName} {e.lastName}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{e.role}</div>
                                    </div>
                                </div>
                            ))}
                            {work.assignedEmployees?.length === 0 && (
                                <p style={{ fontSize: '13px', opacity: 0.5, textAlign: 'center' }}>Ninguém atribuído ainda</p>
                            )}
                        </div>
                    </div>

                    {isAdmin && (
                        <div className={`${styles.statsCard} glass-panel`} style={{ marginTop: '24px' }}>
                            <h3 style={{ marginBottom: '16px' }}>💳 Control de Cobros</h3>
                            <div className={styles.paymentModule}>
                                <div className={styles.paymentRow}>
                                    <span className={styles.statLabel}>Estado Actual:</span>
                                    <select
                                        value={work.paymentStatus || 'Pendiente'}
                                        onChange={(e) => updateWork(work.id, { paymentStatus: e.target.value as any })}
                                        className={styles.statusSelect}
                                        style={{
                                            background: (work.paymentStatus === 'Totalmente Pagado') ? 'rgba(0, 200, 83, 0.2)' :
                                                (work.paymentStatus === 'Señal Pagada') ? 'rgba(251, 191, 36, 0.2)' :
                                                    'rgba(255, 255, 255, 0.05)',
                                            color: (work.paymentStatus === 'Totalmente Pagado') ? '#00c853' :
                                                (work.paymentStatus === 'Señal Pagada') ? '#fbbf24' :
                                                    'white'
                                        }}
                                    >
                                        <option value="Pendiente">❌ Pendiente</option>
                                        <option value="Señal Pagada">🌗 Señal (50%)</option>
                                        <option value="Totalmente Pagado">✅ Pagado Total</option>
                                    </select>
                                </div>

                                <div className={styles.paymentProgress}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
                                        <span>Cobrado: <strong style={{ color: '#00c853' }}>{(work.paidAmount || 0).toLocaleString()} €</strong></span>
                                        <span>Restante: <strong style={{ color: '#ff4d4d' }}>{(work.totalBudget - (work.paidAmount || 0)).toLocaleString()} €</strong></span>
                                    </div>
                                    <div className={styles.progressBarWrapper}>
                                        <div className={styles.progressBarFill} style={{ width: `${((work.paidAmount || 0) / work.totalBudget) * 100}%` }}></div>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max={work.totalBudget}
                                        value={work.paidAmount || 0}
                                        onChange={(e) => updateWork(work.id, { paidAmount: Number(e.target.value) })}
                                        className={styles.paymentRange}
                                    />
                                </div>

                                <div className={styles.quickPaymentBtns}>
                                    <button
                                        className={styles.pBtn}
                                        onClick={() => updateWork(work.id, { paidAmount: Math.round(work.totalBudget * 0.5), paymentStatus: 'Señal Pagada' })}
                                    >
                                        Sinal (50%)
                                    </button>
                                    <button
                                        className={styles.pBtn}
                                        style={{ borderColor: '#00c853', color: '#00c853' }}
                                        onClick={() => updateWork(work.id, { paidAmount: work.totalBudget, paymentStatus: 'Totalmente Pagado' })}
                                    >
                                        Total (100%)
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className={`${styles.statsCard} glass-panel`}>
                        <h3 style={{ marginBottom: '16px' }}>✍️ Firma de Entrega</h3>
                        {signed ? (
                            <div style={{ textAlign: 'center', padding: '10px' }}>
                                <div style={{ fontSize: '40px', marginBottom: '8px' }}>✅</div>
                                <p style={{ fontWeight: 600, color: '#00c853', marginBottom: '12px' }}>Obra Firmada y Entregada</p>
                                {work.digitalSignature && (
                                    <div className={styles.savedSignatureContainer}>
                                        <img src={work.digitalSignature} alt="Firma" className={styles.savedSignature} />
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div>
                                <div className={styles.signaturePad} onClick={() => setIsSignatureModalOpen(true)}>
                                    {isSigning ? <span>⚙️ Procesando...</span> : <span className={styles.placeholderSig}>Haga clic aquí para que el cliente firme</span>}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className={`${styles.statsCard} glass-panel`} style={{ marginTop: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ margin: 0 }}>📊 Control de Gastos</h3>
                            <Button onClick={() => setIsExpenseModalOpen(true)}>+ Añadir Gasto</Button>
                        </div>

                        <div className={styles.expenseList}>
                            {workExpenses.length === 0 ? (
                                <p className={styles.emptyText}>No hay gastos registrados en esta obra.</p>
                            ) : (
                                workExpenses.map(expense => (
                                    <div key={expense.id} className={styles.expenseItem}>
                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                            {expense.receiptPhoto && (
                                                <img
                                                    src={expense.receiptPhoto}
                                                    className={styles.receiptThumbSmall}
                                                    onClick={() => setSelectedPhoto({ id: expense.id, url: expense.receiptPhoto!, date: expense.date, type: 'progress', note: expense.description })}
                                                />
                                            )}
                                            <div className={styles.expenseInfo}>
                                                <span className={styles.expenseDate}>{new Date(expense.date).toLocaleDateString()}</span>
                                                <span className={styles.expenseDesc}>{expense.description}</span>
                                            </div>
                                        </div>
                                        <div className={styles.expenseValue}>
                                            <span className={styles.amount}>-{expense.amount.toLocaleString()} €</span>
                                            {isAdmin && <button className={styles.deleteMini} onClick={() => deleteExpense(expense.id)}>×</button>}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {isTaskModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={`${styles.modalContent} glass-panel`}>
                        <div className={styles.modalHeader}>
                            <h3>{editingTaskId ? 'Editar Tarea' : 'Añadir Nueva Tarea'}</h3>
                            <button className={styles.closeBtn} onClick={() => {
                                setIsTaskModalOpen(false);
                                setEditingTaskId(null);
                            }}>×</button>
                        </div>
                        <form onSubmit={handleCreateTask} className={styles.taskForm}>
                            <div className={styles.formGroup}>
                                <label>Descripción de la Tarea</label>
                                <input
                                    type="text"
                                    required
                                    value={taskFormData.title}
                                    onChange={(e) => setTaskFormData({ ...taskFormData, title: e.target.value })}
                                    placeholder="Ex: Pintura de techos, Lijado de paredes..."
                                />
                            </div>
                            <div className={styles.formGrid}>
                                <div className={styles.formGroup}>
                                    <label>Puntos (Recompensa)</label>
                                    <input
                                        type="number"
                                        required
                                        value={taskFormData.points}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value);
                                            setTaskFormData({ ...taskFormData, points: isNaN(val) ? 0 : val });
                                        }}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Tiempo (Minutos)</label>
                                    <input
                                        type="number"
                                        required
                                        value={taskFormData.timeLimit}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value);
                                            setTaskFormData({ ...taskFormData, timeLimit: isNaN(val) ? 0 : val });
                                        }}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Valor de la Tarea (€)</label>
                                    <input
                                        type="number"
                                        required
                                        value={taskFormData.rate}
                                        onChange={(e) => {
                                            const val = parseFloat(e.target.value);
                                            setTaskFormData({ ...taskFormData, rate: isNaN(val) ? 0 : val });
                                        }}
                                    />
                                </div>
                            </div>
                            <div className={styles.formActions}>
                                <Button type="button" variant="secondary" onClick={() => {
                                    setIsTaskModalOpen(false);
                                    setEditingTaskId(null);
                                }}>Cancelar</Button>
                                <Button type="submit">{editingTaskId ? 'Actualizar Tarea' : 'Crear Tarea'}</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isExpenseModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={`${styles.modalContent} glass-panel`}>
                        <div className={styles.modalHeader}>
                            <h3>Añadir Gasto de Material</h3>
                            <button className={styles.closeBtn} onClick={() => setIsExpenseModalOpen(false)}>×</button>
                        </div>
                        <form onSubmit={handleAddExpense} className={styles.taskForm}>
                            <div className={styles.formGroup}>
                                <label>Descripción del Material</label>
                                <input
                                    type="text"
                                    required
                                    value={expenseFormData.description}
                                    onChange={(e) => setExpenseFormData({ ...expenseFormData, description: e.target.value })}
                                    placeholder="Ex: 5L Pintura Blanca, Rodillos, etc."
                                />
                            </div>
                            <div className={styles.formGrid}>
                                <div className={styles.formGroup}>
                                    <label>Importe (€)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={expenseFormData.amount}
                                        onChange={(e) => setExpenseFormData({ ...expenseFormData, amount: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Fecha</label>
                                    <input
                                        type="date"
                                        required
                                        value={expenseFormData.date}
                                        onChange={(e) => setExpenseFormData({ ...expenseFormData, date: e.target.value })}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Origen</label>
                                    <div className={styles.toggleRow} onClick={() => setExpenseFormData({ ...expenseFormData, isFromStock: !expenseFormData.isFromStock })}>
                                        <div className={`${styles.toggle} ${expenseFormData.isFromStock ? styles.active : ''}`}>
                                            <div className={styles.toggleKnob}></div>
                                        </div>
                                        <span>{expenseFormData.isFromStock ? 'De Stock' : 'Compra Nueva'}</span>
                                    </div>
                                </div>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Foto del Recibo / Ticket</label>
                                <div className={styles.receiptCaptureRow}>
                                    {expenseFormData.receiptPhoto ? (
                                        <div className={styles.receiptPreviewContainer}>
                                            <img src={expenseFormData.receiptPhoto} className={styles.receiptPreview} />
                                            <button type="button" className={styles.removePhoto} onClick={() => setExpenseFormData({ ...expenseFormData, receiptPhoto: '' })}>×</button>
                                        </div>
                                    ) : (
                                        <div className={styles.photoActions}>
                                            <Button type="button" variant="secondary" onClick={() => handleExpenseReceipt('camera')}>📸 Cámara</Button>
                                            <Button type="button" variant="secondary" onClick={() => handleExpenseReceipt('gallery')}>🖼️ Galería</Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className={styles.formActions}>
                                <Button type="button" variant="secondary" onClick={() => setIsExpenseModalOpen(false)}>Cancelar</Button>
                                <Button type="submit">Guardar Gasto</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {selectedPhoto && (
                <div className={styles.lightbox} onClick={() => setSelectedPhoto(null)}>
                    <div className={styles.lightboxContent} onClick={e => e.stopPropagation()}>
                        <img src={selectedPhoto.url} alt="Ampliación" />
                        <div className={styles.lightboxMeta}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'center' }}>
                                <span style={{ fontSize: '1.2rem', fontWeight: 600, color: 'white' }}>{selectedPhoto.note || 'Sin leyenda'}</span>
                                <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', opacity: 0.7 }}>
                                    <span>Tipo: {selectedPhoto.type === 'before' ? 'Antes' : selectedPhoto.type === 'after' ? 'Después' : 'Progreso'}</span>
                                    <span>Fecha: {new Date(selectedPhoto.date).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                        <button className={styles.closeLightbox} onClick={() => setSelectedPhoto(null)}>×</button>
                    </div>
                </div>
            )}
            {isSignatureModalOpen && (
                <SignaturePad
                    onSave={handleSign}
                    onCancel={() => setIsSignatureModalOpen(false)}
                />
            )}
        </div>
    );
}
