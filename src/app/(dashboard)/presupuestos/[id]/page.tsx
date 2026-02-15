'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useApp, Budget, BudgetItem, Client, Service, ProjectPhoto, Work, Invoice } from '@/lib/context';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { deduplicateAddress } from '@/lib/utils';
import styles from '../novo/page.module.css'; // Reuse novo styles

export default function BudgetDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const { budgets, clients, settings, updateBudget, services, addWork, addClient, addInvoice } = useApp();

    const [isLoading, setIsLoading] = useState(false);
    const [previewMode, setPreviewMode] = useState(false);
    const [formData, setFormData] = useState<Budget | null>(null);
    const [isNewClient, setIsNewClient] = useState(false);
    const [tempClient, setTempClient] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        nif: ''
    });

    // Load budget data
    useEffect(() => {
        const budget = budgets.find(b => b.id === id);
        if (budget) {
            setFormData({ ...budget });
            if (budget.nonRegisteredClient) {
                setIsNewClient(true);
                setTempClient(budget.nonRegisteredClient);
            } else {
                setIsNewClient(false);
            }
        } else {
            router.push('/presupuestos');
        }
    }, [id, budgets, router]);

    // Update client name when selection changes
    useEffect(() => {
        if (!isNewClient && formData?.clientId) {
            const client = clients.find(c => c.id === formData.clientId);
            if (client) {
                setFormData(prev => prev ? ({ ...prev, clientName: client.name }) : null);
            }
        }
    }, [formData?.clientId, isNewClient, clients]);

    const totals = useMemo(() => {
        if (!formData) return { subtotal: 0, ivaTotal: 0, total: 0, calculatedDepositValue: 0 };
        const subtotal = formData.items.reduce((acc, item) => acc + (item.quantity * item.rate), 0);
        const ivaTotal = formData.items.reduce((acc, item) => acc + (item.quantity * item.rate * (item.iva / 100)), 0);
        const total = subtotal + ivaTotal;

        let calculatedDepositValue = 0;
        if (formData.depositType === 'percentage') {
            calculatedDepositValue = total * (formData.depositValue / 100);
        } else if (formData.depositType === 'fixed') {
            calculatedDepositValue = formData.depositValue;
        }

        return { subtotal, ivaTotal, total, calculatedDepositValue };
    }, [formData]);

    if (!formData) return <div style={{ padding: '40px', textAlign: 'center' }}>Cargando presupuesto...</div>;

    const handleItemChange = (itemId: string, field: keyof BudgetItem, value: any) => {
        setFormData({
            ...formData,
            items: formData.items.map(item => item.id === itemId ? { ...item, [field]: value } : item)
        });
    };

    const handleSelectService = (itemId: string, serviceId: string) => {
        if (!serviceId) return;
        const service = services.find(s => s.id === serviceId);
        if (service) {
            setFormData({
                ...formData,
                items: formData.items.map(item => item.id === itemId ? {
                    ...item,
                    title: service.title,
                    description: service.description,
                    rate: service.defaultRate,
                    iva: service.defaultIva
                } : item)
            });
        }
    };

    const handleAddItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, { id: Date.now().toString(), title: '', description: '', quantity: 1, rate: 0, iva: 21 }]
        });
    };

    const handleRemoveItem = (itemId: string) => {
        if (formData.items.length === 1) return;
        setFormData({
            ...formData,
            items: formData.items.filter(item => item.id !== itemId)
        });
    };

    const handleSave = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!formData) return;

        setIsLoading(true);

        try {
            let finalClientId = formData.clientId;

            // Register new client if saving in edit mode
            if (isNewClient && tempClient.name) {
                finalClientId = await addClient({
                    name: tempClient.name,
                    email: tempClient.email,
                    phone: tempClient.phone,
                    address: tempClient.address,
                    city: '',
                    nif: tempClient.nif,
                    contactPerson: tempClient.name,
                    status: 'Activo'
                });
            }

            const finalData = {
                ...formData,
                clientId: finalClientId,
                nonRegisteredClient: undefined, // Clear after registration
                clientName: isNewClient ? tempClient.name : formData.clientName
            } as Budget;

            await updateBudget(id, finalData);
            setFormData(finalData);
            setIsNewClient(false);
            setPreviewMode(true);
        } catch (error) {
            console.error('Error updating budget:', error);
            alert('Error al guardar el presupuesto.');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleShareWhatsApp = () => {
        const text = `Hola! Te envío el presupuesto Nº ${formData.number} de ${settings.companyName}.\nTotal: ${totals.total.toLocaleString('es-ES')}€.\nConcepto: ${formData.concept}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    };

    const handleShareEmail = () => {
        const clientEmail = formData.nonRegisteredClient?.email || clients.find(c => c.id === formData.clientId)?.email || '';
        const subject = `Presupuesto Nº ${formData.number} - ${settings.companyName}`;
        const body = `Hola,\n\nAdjunto el presupuesto solicitado para ${formData.concept}.\n\nTotal: ${totals.total.toLocaleString('es-ES')}€.\n\nSaludos,\n${settings.companyName}`;
        window.location.href = `mailto:${clientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    };

    const handleAcceptBudget = async () => {
        if (!formData) return;

        setIsLoading(true);

        let finalClientId = formData.clientId;

        // If it's a non-registered client, register them first
        if (isNewClient && formData.nonRegisteredClient) {
            finalClientId = await addClient({
                name: formData.nonRegisteredClient.name,
                email: formData.nonRegisteredClient.email,
                phone: formData.nonRegisteredClient.phone,
                address: formData.nonRegisteredClient.address,
                city: '', // Default
                nif: formData.nonRegisteredClient.nif,
                contactPerson: formData.nonRegisteredClient.name,
                status: 'Activo' as const
            });
        }

        // updateBudget in context already handles addWork when status is 'Aceptado'
        await updateBudget(id, {
            ...formData,
            status: 'Aceptado',
            clientId: finalClientId,
            nonRegisteredClient: undefined // Clear temp client as it's now registered
        });

        // Short delay to ensure state update is processed or just navigate direct
        // Redirect to the new work
        setTimeout(() => {
            setIsLoading(false);
            router.push(`/obras`); // Redirect to works list
        }, 800);
    };

    const handleGenerateInvoice = async () => {
        if (!formData) return;

        setIsLoading(true);
        try {
            const newInvoiceId = await addInvoice({
                clientId: formData.clientId,
                nonRegisteredClient: formData.nonRegisteredClient,
                clientName: formData.clientName,
                date: new Date().toISOString().split('T')[0],
                dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 15 days
                concept: formData.concept,
                items: formData.items,
                paymentInstructions: formData.paymentInstructions,
                depositType: formData.depositType,
                depositValue: formData.depositValue,
                plannedStartDate: formData.plannedStartDate,
                comments: formData.comments,
                terms: formData.terms,
                status: 'Emitida',
                budgetId: id
            });

            router.push(`/facturas/${newInvoiceId}`);
        } catch (error) {
            console.error('Error generating invoice:', error);
            alert('Error al generar la factura.');
        } finally {
            setIsLoading(false);
        }
    };

    const renderPreview = () => (
        <div className={styles.previewContainer}>
            <div className={styles.budgetPaper} id="budget-printable">
                {/* Header Logo */}
                <div className={styles.previewHeaderLogo}>
                    {settings.logoUrl ? (
                        <img src={settings.logoUrl} alt="Logo" className={styles.logoImgPreview} />
                    ) : (
                        <div className={styles.logoImg}>
                            <div className={styles.logoIconContainer}>🖌️</div>
                            <div className={styles.logoTextContainer}>
                                <span className={styles.mainLogo}>{settings.companyName.toUpperCase()}</span>
                                <span className={styles.subLogo}>SISTEMA DE GESTIÓN</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Company & Budget Meta */}
                <div className={styles.metaGrid}>
                    <div className={styles.companyInfo}>
                        <h2 className={styles.ownerName}>{settings.companyName}</h2>
                        <p>{settings.address || 'Rua da Finca Federico Narón 15570 A Coruña'}</p>
                        <p>{settings.phone || '651 45 28 69'}</p>
                        <p>{settings.adminEmail}</p>
                        <p>NIF / CIF: {settings.nif}</p>
                    </div>
                    <div className={styles.budgetMeta}>
                        <h1 className={styles.docTitle}>Presupuesto</h1>
                        <div className={styles.metaRow}>
                            <span>Presupuesto nº:</span>
                            <strong>{formData.number}</strong>
                        </div>
                        <div className={styles.metaRow}>
                            <span>Fecha:</span>
                            <strong>{new Date(formData.date).toLocaleDateString('es-ES')}</strong>
                        </div>
                        <div className={styles.metaRow}>
                            <span>Concepto:</span>
                            <strong>{formData.concept || 'Pintura General'}</strong>
                        </div>
                        <div className={styles.metaRow}>
                            <span>Validez:</span>
                            <strong>{formData.validity}</strong>
                        </div>
                    </div>
                </div>

                <div className={styles.separator} />

                {/* Client Data */}
                <div className={styles.clientPreview}>
                    <span className={styles.targetLabel}>Para:</span>
                    <div className={styles.clientBox}>
                        <strong>{formData.nonRegisteredClient?.name || (clients.find(c => c.id === formData.clientId)?.name || 'Cliente')}</strong>
                        <p>{deduplicateAddress(formData.nonRegisteredClient?.address || clients.find(c => c.id === formData.clientId)?.address || '')}</p>
                        <p>CIF/NIF: {formData.nonRegisteredClient?.nif || clients.find(c => c.id === formData.clientId)?.nif}</p>
                        <p>Tlf: {formData.nonRegisteredClient?.phone || clients.find(c => c.id === formData.clientId)?.phone}</p>
                        <p>Email: {formData.nonRegisteredClient?.email || clients.find(c => c.id === formData.clientId)?.email}</p>
                    </div>
                </div>

                {/* Items Table */}
                <table className={styles.previewTable}>
                    <thead>
                        <tr>
                            <th style={{ width: '50%' }}>Descripción</th>
                            <th style={{ textAlign: 'center' }}>Cantidad</th>
                            <th style={{ textAlign: 'right' }}>Tarifa</th>
                            <th style={{ textAlign: 'center' }}>IVA</th>
                            <th style={{ textAlign: 'right' }}>Importe</th>
                        </tr>
                    </thead>
                    <tbody>
                        {formData.items.map((item, i) => {
                            const amount = item.quantity * item.rate;
                            return (
                                <tr key={item.id}>
                                    <td>
                                        <div className={styles.previewItemTitle}>{item.title || 'Servicio'}</div>
                                        <div className={styles.previewItemDesc}>{item.description}</div>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                                    <td style={{ textAlign: 'right' }}>€&nbsp;{item.rate.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</td>
                                    <td style={{ textAlign: 'center' }}>{item.iva}%</td>
                                    <td style={{ textAlign: 'right' }}>€&nbsp;{amount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {/* Totals Block */}
                <div className={styles.totalsWrapper}>
                    <div className={styles.totalsTable}>
                        <div className={styles.totalRow}>
                            <span>Subtotal</span>
                            <span>€&nbsp;{totals.subtotal.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className={styles.totalRow}>
                            <span>IVA Total</span>
                            <span>€&nbsp;{totals.ivaTotal.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className={`${styles.totalRow} ${styles.grandTotal}`}>
                            <span>Total</span>
                            <span>€&nbsp;{totals.total.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
                        </div>
                    </div>
                </div>

                {/* Deposit Section */}
                {formData.depositType !== 'none' && (
                    <div className={styles.depositBox}>
                        <span className={styles.sectionTitle}>Solicitud de deposito para inicio de obra</span>
                        <p>
                            Se requiere un pago inicial de
                            <strong> {formData.depositType === 'percentage' ? `${formData.depositValue}%` : `${formData.depositValue.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €`} </strong>
                            {formData.depositType === 'percentage' && (
                                <span>(equivalente a <strong>{totals.calculatedDepositValue.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</strong>)</span>
                            )}
                            {" "}para la reserva de fecha.
                        </p>
                        {formData.plannedStartDate && (
                            <p>Inicio previsto de las obras: <strong>{new Date(formData.plannedStartDate).toLocaleDateString('es-ES')}</strong></p>
                        )}
                    </div>
                )}

                {/* Instructions, Comments & Terms */}
                <div className={styles.noteBox} style={{ marginTop: '30px' }}>
                    <span className={styles.noteTitle}>Instrucciones de Pago:</span>
                    <p style={{ whiteSpace: 'pre-wrap' }}>{formData.paymentInstructions}</p>
                </div>

                <div className={styles.noteBox} style={{ marginTop: '16px' }}>
                    <span className={styles.noteTitle}>Comentarios:</span>
                    <p style={{ whiteSpace: 'pre-wrap' }}>{formData.comments}</p>
                </div>

                <div className={styles.noteBox} style={{ marginTop: '16px' }}>
                    <span className={styles.noteTitle}>Términos y Condiciones:</span>
                    <p className={styles.tinyText}>{formData.terms}</p>
                </div>

                {/* Footer Signatures */}
                <div className={styles.signatures}>
                    <div className={styles.signatureBox}>
                        <div className={styles.sigLine} />
                        <span>Firma de la Empresa</span>
                        <strong>{settings.companyName}</strong>
                    </div>
                    <div className={styles.signatureBox}>
                        <div className={styles.sigLine} />
                        <span>Firma del Cliente</span>
                        <strong>{formData.nonRegisteredClient?.name || (clients.find(c => c.id === formData.clientId)?.name || '---')}</strong>
                    </div>
                </div>
            </div>

            <div className={styles.previewActions} id="actions-non-printable">
                <Button onClick={() => setPreviewMode(false)} variant="secondary">✏️ Editar Datos</Button>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <Button onClick={handlePrint} variant="secondary">🖨️ Imprimir / PDF</Button>
                    <Button onClick={handleShareWhatsApp} variant="secondary" style={{ background: '#25D366', color: 'white', border: 'none' }}>🟢 WhatsApp</Button>
                    <Button onClick={handleShareEmail} variant="secondary">📧 Email</Button>
                </div>
                {formData.status !== 'Aceptado' ? (
                    <Button onClick={handleAcceptBudget} style={{ background: '#00c853', color: 'white', border: 'none' }} disabled={isLoading}>
                        {isLoading ? '⌛ Procesando...' : '✅ Aceptar y Crear Obra'}
                    </Button>
                ) : (
                    <Button onClick={handleGenerateInvoice} style={{ background: '#3b82f6', color: 'white', border: 'none' }} disabled={isLoading}>
                        {isLoading ? '⌛ Creando...' : '💰 Generar Factura'}
                    </Button>
                )}
                <Button onClick={() => router.push('/presupuestos')}>Cerrar</Button>
            </div>
        </div>
    );

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>{previewMode ? 'Detalles del Presupuesto' : 'Editar Presupuesto'}</h1>
                <Link href="/presupuestos" style={{ color: 'var(--text-secondary)' }}>
                    ← Volver a la lista
                </Link>
            </div>

            {previewMode ? renderPreview() : (
                <form onSubmit={handleSave} className={styles.form}>
                    <div className={styles.mainGrid}>
                        {/* LEFT: Budget Info & Client (Simplified for edit) */}
                        <div className={styles.sidebarColumn}>
                            <div className={`glass-panel ${styles.card}`}>
                                <h3 className={styles.cardTitle}>Datos Generales</h3>
                                <div className={styles.inputGrid}>
                                    <Input
                                        id="number"
                                        label="Nº Presupuesto"
                                        value={formData.number}
                                        onChange={e => setFormData({ ...formData, number: e.target.value })}
                                        required
                                    />
                                    <Input
                                        id="date"
                                        label="Fecha"
                                        type="date"
                                        value={formData.date}
                                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                                        required
                                    />
                                    <div style={{ gridColumn: 'span 2' }}>
                                        <Input
                                            id="concept"
                                            label="Concepto / Obra"
                                            value={formData.concept}
                                            onChange={e => setFormData({ ...formData, concept: e.target.value })}
                                        />
                                    </div>
                                    <Input
                                        id="validity"
                                        label="Validez"
                                        value={formData.validity}
                                        onChange={e => setFormData({ ...formData, validity: e.target.value })}
                                    />
                                    <div className={styles.fieldWrapper}>
                                        <label className={styles.label}>Estado</label>
                                        <select
                                            className={styles.select}
                                            value={formData.status}
                                            onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                                        >
                                            <option value="Borrador">Borrador</option>
                                            <option value="Enviado">Enviado</option>
                                            <option value="Aceptado">Aceptado</option>
                                            <option value="Rechazado">Rechazado</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className={`glass-panel ${styles.card}`}>
                                <div className={styles.cardHeaderFlex}>
                                    <h3 className={styles.cardTitle}>Cliente</h3>
                                    <button
                                        type="button"
                                        className={styles.toggleBtn}
                                        onClick={() => setIsNewClient(!isNewClient)}
                                    >
                                        {isNewClient ? 'Seleccionar Existente' : '+ Nuevo Cliente'}
                                    </button>
                                </div>

                                {isNewClient ? (
                                    <div className={styles.inputGrid}>
                                        <Input
                                            id="tempName"
                                            label="Nombre / Razón Social"
                                            value={tempClient.name}
                                            onChange={e => setTempClient({ ...tempClient, name: e.target.value })}
                                            required
                                        />
                                        <Input
                                            id="tempNif"
                                            label="NIF / CIF"
                                            value={tempClient.nif}
                                            onChange={e => setTempClient({ ...tempClient, nif: e.target.value })}
                                        />
                                        <Input
                                            id="tempEmail"
                                            label="Email"
                                            value={tempClient.email}
                                            onChange={e => setTempClient({ ...tempClient, email: e.target.value })}
                                        />
                                        <Input
                                            id="tempPhone"
                                            label="Teléfono"
                                            value={tempClient.phone}
                                            onChange={e => setTempClient({ ...tempClient, phone: e.target.value })}
                                        />
                                        <div style={{ gridColumn: 'span 2' }}>
                                            <Input
                                                id="tempAddress"
                                                label="Dirección"
                                                value={tempClient.address}
                                                onChange={e => setTempClient({ ...tempClient, address: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className={styles.fieldWrapper}>
                                        <label className={styles.label}>Buscar Cliente Registrado</label>
                                        <select
                                            className={styles.select}
                                            value={formData.clientId}
                                            onChange={e => setFormData({ ...formData, clientId: e.target.value })}
                                            required
                                        >
                                            <option value="">Seleccione un cliente...</option>
                                            {clients.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>

                            <div className={`glass-panel ${styles.card}`}>
                                <h3 className={styles.cardTitle}>Depósito de Obra</h3>
                                <div className={styles.inputGrid}>
                                    <div className={styles.fieldWrapper}>
                                        <label className={styles.label}>Tipo</label>
                                        <select
                                            className={styles.select}
                                            value={formData.depositType}
                                            onChange={e => setFormData({ ...formData, depositType: e.target.value as any })}
                                        >
                                            <option value="none">Sin Depósito</option>
                                            <option value="percentage">Porcentaje (%)</option>
                                            <option value="fixed">Valor Fijo (€)</option>
                                        </select>
                                    </div>
                                    <Input
                                        id="depVal"
                                        label="Valor"
                                        type="number"
                                        value={formData.depositValue}
                                        onChange={e => setFormData({ ...formData, depositValue: Number(e.target.value) })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: Items & Editor */}
                        <div className={styles.mainColumn}>
                            <div className={`glass-panel ${styles.card}`}>
                                <div className={styles.cardHeaderFlex}>
                                    <h3 className={styles.cardTitle}>Líneas de Detalle</h3>
                                    <Button type="button" variant="secondary" onClick={handleAddItem}>+ Añadir</Button>
                                </div>
                                <div className={styles.itemsList}>
                                    {formData.items.map((item) => (
                                        <div key={item.id} className={styles.itemRow}>
                                            <div className={styles.itemMain}>
                                                <div className={styles.productSearchRow}>
                                                    <select
                                                        className={styles.select}
                                                        onChange={(e) => handleSelectService(item.id, e.target.value)}
                                                        defaultValue=""
                                                    >
                                                        <option value="" disabled>Seleccione del catálogo para rellenar...</option>
                                                        {services.map(s => (
                                                            <option key={s.id} value={s.id}>{s.title}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className={styles.inputGrid}>
                                                    <div style={{ gridColumn: 'span 2' }}>
                                                        <Input
                                                            id={`t-${item.id}`}
                                                            label="Título"
                                                            value={item.title}
                                                            onChange={e => handleItemChange(item.id, 'title', e.target.value)}
                                                        />
                                                    </div>
                                                    <div style={{ gridColumn: 'span 2' }}>
                                                        <textarea
                                                            className={styles.textarea}
                                                            value={item.description}
                                                            onChange={e => handleItemChange(item.id, 'description', e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={styles.itemQuantities}>
                                                <Input id={`q-${item.id}`} label="Cant." type="number" value={item.quantity} onChange={e => handleItemChange(item.id, 'quantity', Number(e.target.value))} />
                                                <Input id={`r-${item.id}`} label="Tarifa" type="number" value={item.rate} onChange={e => handleItemChange(item.id, 'rate', Number(e.target.value))} />
                                                <button type="button" className={styles.removeBtn} onClick={() => handleRemoveItem(item.id)}>✕</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className={styles.totalsSection}>
                                    <div className={styles.totalsTable}>
                                        <div className={styles.totalRow}>
                                            <span>Subtotal:</span>
                                            <span>{totals.subtotal.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</span>
                                        </div>
                                        <div className={`${styles.totalRow} ${styles.grandTotal}`}>
                                            <span>TOTAL:</span>
                                            <span>{totals.total.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className={styles.formActions}>
                                <Button type="submit">Actualizar y Ver Preview</Button>
                            </div>
                        </div>
                    </div>
                </form>
            )}
        </div>
    );
}
