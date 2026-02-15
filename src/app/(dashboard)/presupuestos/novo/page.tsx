'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp, Budget, BudgetItem, Client, Service } from '@/lib/context';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import styles from './page.module.css';

export default function NewBudgetPage() {
    const router = useRouter();
    const { clients, settings, addBudget, budgets, services } = useApp();
    const [isLoading, setIsLoading] = useState(false);
    const [previewMode, setPreviewMode] = useState(false);

    // Auto-generate budget number
    const nextNumber = useMemo(() => {
        if (budgets.length === 0) return '001000';
        const lastNum = Math.max(...budgets.map(b => parseInt(b.number) || 0));
        return (lastNum + 1).toString().padStart(6, '0');
    }, [budgets]);

    const [formData, setFormData] = useState<Omit<Budget, 'id'>>({
        number: nextNumber,
        date: new Date().toISOString().split('T')[0],
        validity: '30 días',
        concept: '',
        clientName: '',
        clientId: '',
        items: [
            { id: '1', title: '', description: '', quantity: 1, rate: 0, iva: 21 }
        ],
        paymentInstructions: settings.defaultPaymentInstructions,
        depositType: 'none',
        depositValue: 0,
        plannedStartDate: '',
        comments: settings.defaultComments,
        terms: settings.defaultTerms,
        status: 'Borrador'
    });

    const [isNewClient, setIsNewClient] = useState(false);
    const [tempClient, setTempClient] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        nif: ''
    });

    // Update client name when selection changes
    useEffect(() => {
        if (!isNewClient && formData.clientId) {
            const client = clients.find(c => c.id === formData.clientId);
            if (client) {
                setFormData(prev => ({ ...prev, clientName: client.name }));
            }
        }
    }, [formData.clientId, isNewClient, clients]);

    const handleAddItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, { id: Date.now().toString(), title: '', description: '', quantity: 1, rate: 0, iva: 21 }]
        });
    };

    const handleRemoveItem = (id: string) => {
        if (formData.items.length === 1) return;
        setFormData({
            ...formData,
            items: formData.items.filter(item => item.id !== id)
        });
    };

    const handleItemChange = (id: string, field: keyof BudgetItem, value: any) => {
        setFormData({
            ...formData,
            items: formData.items.map(item => item.id === id ? { ...item, [field]: value } : item)
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

    const totals = useMemo(() => {
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
    }, [formData.items, formData.depositType, formData.depositValue]);

    const budgetToSave = {
        ...formData,
        nonRegisteredClient: isNewClient ? tempClient : undefined,
        clientName: isNewClient ? tempClient.name : formData.clientName
    };

    const handlePrint = () => {
        window.print();
    };

    const handleShareWhatsApp = () => {
        const text = `Hola! Te envío el presupuesto Nº ${formData.number} de ${settings.companyName}.\nTotal: ${totals.total.toLocaleString('es-ES')}€.\nConcepto: ${formData.concept}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    };

    const handleShareEmail = () => {
        const clientEmail = isNewClient ? tempClient.email : clients.find(c => c.id === formData.clientId)?.email || '';
        const subject = `Presupuesto Nº ${formData.number} - ${settings.companyName}`;
        const body = `Hola,\n\nAdjunto el presupuesto solicitado para ${formData.concept}.\n\nTotal: ${totals.total.toLocaleString('es-ES')}€.\n\nSaludos,\n${settings.companyName}`;
        window.location.href = `mailto:${clientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        setTimeout(() => {
            addBudget(budgetToSave);
            setIsLoading(false);
            router.push('/presupuestos');
        }, 1000);
    };

    const renderPreview = () => (
        <div className={styles.previewContainer}>
            <div className={styles.budgetPaper}>
                {/* Header Logo */}
                <div className={styles.previewHeaderLogo}>
                    {settings.logoUrl ? (
                        <img src={settings.logoUrl} alt="Logo" className={styles.logoImgPreview} />
                    ) : (
                        <div className={styles.logoImg}>
                            <div className={styles.logoIconContainer}>🖌️</div>
                            <div className={styles.logoTextContainer}>
                                <span className={styles.mainLogo}>VILANOVA PINTURAS</span>
                                <span className={styles.subLogo}>& SERVICIOS</span>
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
                        <strong>{isNewClient ? tempClient.name : (clients.find(c => c.id === formData.clientId)?.name || 'Cliente')}</strong>
                        <p>{isNewClient ? tempClient.email : clients.find(c => c.id === formData.clientId)?.email}</p>
                        <p>{isNewClient ? tempClient.address : clients.find(c => c.id === formData.clientId)?.address}</p>
                        <p>{isNewClient ? tempClient.phone : clients.find(c => c.id === formData.clientId)?.phone}</p>
                        <p>NIF/CIF: {isNewClient ? tempClient.nif : clients.find(c => c.id === formData.clientId)?.nif}</p>
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
                            <strong> {formData.depositType === 'percentage' ? `${formData.depositValue}%` : `€ ${formData.depositValue.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`} </strong>
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
                    <p>{formData.paymentInstructions}</p>
                </div>

                <div className={styles.noteBox} style={{ marginTop: '16px' }}>
                    <span className={styles.noteTitle}>Comentarios:</span>
                    <p>{formData.comments}</p>
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
                        <strong>{isNewClient ? tempClient.name : (clients.find(c => c.id === formData.clientId)?.name || '---')}</strong>
                    </div>
                </div>
            </div>

            <div className={styles.previewActions} id="actions-non-printable">
                <Button onClick={() => setPreviewMode(false)} variant="secondary">✏️ Editar Datos</Button>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <Button onClick={handlePrint} variant="secondary">🖨️ Imprimir / PDF</Button>
                    <Button onClick={handleShareWhatsApp} variant="secondary" style={{ backgroundColor: '#25D366', color: 'white', border: 'none' }}>📱 WhatsApp</Button>
                    <Button onClick={handleShareEmail} variant="secondary">📧 Email</Button>
                </div>
                <Button onClick={handleSubmit} isLoading={isLoading}>Guardar Finalizar</Button>
            </div>
        </div>
    );

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>{previewMode ? 'Vista Previa Presupuesto' : 'Nuevo Presupuesto'}</h1>
                <Link href="/presupuestos" style={{ color: 'var(--text-secondary)' }}>
                    ← Volver a la lista
                </Link>
            </div>

            {previewMode ? renderPreview() : (
                <form onSubmit={(e) => { e.preventDefault(); setPreviewMode(true); }} className={styles.form}>
                    <div className={styles.mainGrid}>
                        {/* LEFT: Budget Info & Client */}
                        <div className={styles.sidebarColumn}>
                            <div className={`glass-panel ${styles.card}`}>
                                <h3 className={styles.cardTitle}>Datos del Documento</h3>
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
                                    <Input
                                        id="validity"
                                        label="Validez"
                                        value={formData.validity}
                                        onChange={e => setFormData({ ...formData, validity: e.target.value })}
                                    />
                                    <Input
                                        id="concept"
                                        label="Concepto / Obra"
                                        placeholder="Ej: Pintura Fachada Principal"
                                        value={formData.concept}
                                        onChange={e => setFormData({ ...formData, concept: e.target.value })}
                                    />
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
                                <h3 className={styles.cardTitle}>Condiciones de Depósito</h3>
                                <div className={styles.inputGrid}>
                                    <div className={styles.fieldWrapper}>
                                        <label className={styles.label}>Tipo de Depósito</label>
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
                                    {formData.depositType !== 'none' && (
                                        <Input
                                            id="depositValue"
                                            label={formData.depositType === 'percentage' ? 'Porcentaje %' : 'Monto €'}
                                            type="number"
                                            value={formData.depositValue}
                                            onChange={e => setFormData({ ...formData, depositValue: Number(e.target.value) })}
                                        />
                                    )}
                                    <div style={{ gridColumn: 'span 2' }}>
                                        <Input
                                            id="plannedStartDate"
                                            label="Fecha prevista de inicio de obra"
                                            type="date"
                                            value={formData.plannedStartDate}
                                            onChange={e => setFormData({ ...formData, plannedStartDate: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: Items & Totals */}
                        <div className={styles.mainColumn}>
                            <div className={`glass-panel ${styles.card}`}>
                                <div className={styles.cardHeaderFlex}>
                                    <h3 className={styles.cardTitle}>Partidas del Presupuesto</h3>
                                    <Button type="button" variant="secondary" onClick={handleAddItem}>+ Añadir Línea</Button>
                                </div>
                                <div className={styles.itemsList}>
                                    {formData.items.map((item, index) => (
                                        <div key={item.id} className={styles.itemRow}>
                                            <div className={styles.itemMain}>
                                                <div className={styles.productSearchRow}>
                                                    <label className={styles.label}>Buscar en Catálogo</label>
                                                    <select
                                                        className={styles.select}
                                                        onChange={(e) => handleSelectService(item.id, e.target.value)}
                                                        defaultValue=""
                                                    >
                                                        <option value="" disabled>Seleccione un servicio guardado...</option>
                                                        {services.map(s => (
                                                            <option key={s.id} value={s.id}>{s.title}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className={styles.inputGrid}>
                                                    <div style={{ gridColumn: 'span 2' }}>
                                                        <Input
                                                            id={`title-${item.id}`}
                                                            label="Título del Servicio"
                                                            value={item.title}
                                                            placeholder="Ej: Pintura de Habitación hasta 15m2"
                                                            onChange={e => handleItemChange(item.id, 'title', e.target.value)}
                                                            required
                                                        />
                                                    </div>
                                                    <div style={{ gridColumn: 'span 2' }}>
                                                        <label className={styles.label}>Descripción Detallada (Materiales, procesos...)</label>
                                                        <textarea
                                                            className={styles.textarea}
                                                            value={item.description}
                                                            placeholder="Ej: El trabajo incluye pintura acrílica mate, empapelado de suelo, encintado de marcos..."
                                                            onChange={e => handleItemChange(item.id, 'description', e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={styles.itemQuantities}>
                                                <Input
                                                    id={`qty-${item.id}`}
                                                    label="Cant."
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={e => handleItemChange(item.id, 'quantity', Number(e.target.value))}
                                                />
                                                <Input
                                                    id={`rate-${item.id}`}
                                                    label="Tarifa (€)"
                                                    type="number"
                                                    value={item.rate}
                                                    onChange={e => handleItemChange(item.id, 'rate', Number(e.target.value))}
                                                />
                                                <Input
                                                    id={`iva-${item.id}`}
                                                    label="IVA (%)"
                                                    type="number"
                                                    value={item.iva}
                                                    onChange={e => handleItemChange(item.id, 'iva', Number(e.target.value))}
                                                />
                                                <button
                                                    type="button"
                                                    className={styles.removeBtn}
                                                    onClick={() => handleRemoveItem(item.id)}
                                                    title="Eliminar partida"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className={styles.totalsSection}>
                                    <div className={styles.totalsTable}>
                                        <div className={styles.totalRow}>
                                            <span>Subtotal:</span>
                                            <span>€&nbsp;{totals.subtotal.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className={styles.totalRow}>
                                            <span>IVA:</span>
                                            <span>€&nbsp;{totals.ivaTotal.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className={`${styles.totalRow} ${styles.grandTotal}`}>
                                            <span>TOTAL:</span>
                                            <span>€&nbsp;{totals.total.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className={`glass-panel ${styles.card}`}>
                                <h3 className={styles.cardTitle}>Instrucciones y Condiciones</h3>
                                <div className={styles.inputGrid}>
                                    <div style={{ gridColumn: 'span 2' }}>
                                        <label className={styles.label}>Instrucciones de Pago</label>
                                        <textarea
                                            className={styles.textarea}
                                            value={formData.paymentInstructions}
                                            onChange={e => setFormData({ ...formData, paymentInstructions: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className={styles.label}>Comentarios adicionales</label>
                                        <textarea
                                            className={styles.textarea}
                                            value={formData.comments}
                                            onChange={e => setFormData({ ...formData, comments: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className={styles.label}>Términos y Condiciones</label>
                                        <textarea
                                            className={styles.textarea}
                                            value={formData.terms}
                                            onChange={e => setFormData({ ...formData, terms: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className={styles.formActions}>
                                <Button type="submit">Generar Vista Previa</Button>
                            </div>
                        </div>
                    </div>
                </form>
            )}
        </div>
    );
}
