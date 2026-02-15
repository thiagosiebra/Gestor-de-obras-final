'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useApp, Invoice, BudgetItem } from '@/lib/context';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import styles from '../../presupuestos/novo/page.module.css';

export default function InvoiceDetailPage() {
    const params = useParams();
    const id = params.id as string;
    const router = useRouter();
    const { invoices, settings, updateInvoice, services, clients } = useApp();

    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState<Invoice | null>(null);

    const invoice = invoices.find(i => i.id === id);

    useEffect(() => {
        if (invoice && !formData) {
            setFormData({ ...invoice });
        }
    }, [invoice, formData]);

    const totals = useMemo(() => {
        if (!formData) return { subtotal: 0, iva: 0, total: 0, calculatedDepositValue: 0 };
        const subtotal = formData.items.reduce((acc, item) => acc + (item.quantity * item.rate), 0);
        const ivaTotal = formData.items.reduce((acc, item) => acc + (item.quantity * item.rate * (item.iva / 100)), 0);
        const total = subtotal + ivaTotal;

        let calculatedDepositValue = 0;
        if (formData.depositType === 'percentage') {
            calculatedDepositValue = total * (formData.depositValue / 100);
        } else if (formData.depositType === 'fixed') {
            calculatedDepositValue = formData.depositValue;
        }

        return {
            subtotal,
            iva: ivaTotal,
            total,
            calculatedDepositValue
        };
    }, [formData]);

    if (!invoice || !formData) {
        return (
            <div className={styles.container}>
                <div className="glass-panel p-8 text-center">
                    <h2 className={styles.title}>Factura no encontrada</h2>
                    <Button onClick={() => router.push('/facturas')}>Volver a Facturas</Button>
                </div>
            </div>
        );
    }

    const handlePrint = () => window.print();

    const handleStatusUpdate = (status: Invoice['status']) => {
        updateInvoice(id, { status });
        setFormData(prev => prev ? { ...prev, status } : null);
    };

    const handleSave = () => {
        if (!formData) return;
        setIsLoading(true);
        updateInvoice(id, formData);
        setTimeout(() => {
            setIsLoading(false);
            setIsEditing(false);
        }, 800);
    };

    const handleItemChange = (itemId: string, field: keyof BudgetItem, value: any) => {
        setFormData({
            ...formData,
            items: formData.items.map(item => item.id === itemId ? { ...item, [field]: value } : item)
        });
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

    const renderEditForm = () => (
        <div className={styles.mainGrid}>
            <div className={styles.sidebarColumn}>
                <div className={`glass-panel ${styles.card}`}>
                    <h3 className={styles.cardTitle}>Datos de la Factura</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <Input
                            id="invNumber"
                            label="Número de Factura"
                            value={formData.number}
                            onChange={e => setFormData({ ...formData, number: e.target.value })}
                        />
                        <Input
                            id="invDate"
                            label="Fecha de Emisión"
                            type="date"
                            value={formData.date}
                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                        />
                        <Input
                            id="invDueDate"
                            label="Fecha de Vencimiento"
                            type="date"
                            value={formData.dueDate}
                            onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                        />
                        <div className={styles.fieldWrapper}>
                            <label className={styles.label}>Estado</label>
                            <select
                                className={styles.select}
                                value={formData.status}
                                onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                            >
                                <option value="Emitida">Emitida</option>
                                <option value="Pagada">Pagada</option>
                                <option value="Anulada">Anulada</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className={`glass-panel ${styles.card}`}>
                    <h3 className={styles.cardTitle}>Totales</h3>
                    <div className={styles.totalsTable} style={{ width: '100%' }}>
                        <div className={styles.totalRow}>
                            <span>Subtotal</span>
                            <span>€ {totals.subtotal.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className={styles.totalRow}>
                            <span>IVA</span>
                            <span>€ {totals.iva.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className={`${styles.totalRow} ${styles.grandTotal}`}>
                            <span>Total</span>
                            <span>€ {totals.total.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
                        </div>
                    </div>
                    <Button
                        onClick={handleSave}
                        style={{ width: '100%', marginTop: '20px' }}
                        isLoading={isLoading}
                    >
                        Guardar Cambios
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={() => setIsEditing(false)}
                        style={{ width: '100%', marginTop: '10px' }}
                    >
                        Cancelar
                    </Button>
                </div>
            </div>

            <div className={styles.mainColumn}>
                <div className={`glass-panel ${styles.card}`}>
                    <div className={styles.cardHeaderFlex}>
                        <h3 className={styles.cardTitle}>Conceptos y Servicios</h3>
                        <Button variant="secondary" onClick={handleAddItem}>+ Añadir Línea</Button>
                    </div>
                    {formData.items.map((item) => (
                        <div key={item.id} className={styles.itemRow}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px' }}>
                                <Input
                                    id={`title-${item.id}`}
                                    label="Título"
                                    value={item.title}
                                    onChange={e => handleItemChange(item.id, 'title', e.target.value)}
                                />
                                <button className={styles.removeBtn} onClick={() => handleRemoveItem(item.id)}>🗑️</button>
                            </div>
                            <textarea
                                className={styles.textarea}
                                placeholder="Descripción detallada..."
                                value={item.description}
                                onChange={e => handleItemChange(item.id, 'description', e.target.value)}
                            />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                                <Input
                                    id={`qty-${item.id}`}
                                    label="Cantidad"
                                    type="number"
                                    value={item.quantity.toString()}
                                    onChange={e => handleItemChange(item.id, 'quantity', Number(e.target.value))}
                                />
                                <Input
                                    id={`rate-${item.id}`}
                                    label="Precio Unit."
                                    type="number"
                                    value={item.rate.toString()}
                                    onChange={e => handleItemChange(item.id, 'rate', Number(e.target.value))}
                                />
                                <div className={styles.fieldWrapper}>
                                    <label className={styles.label}>IVA %</label>
                                    <select
                                        className={styles.select}
                                        value={item.iva}
                                        onChange={e => handleItemChange(item.id, 'iva', Number(e.target.value))}
                                    >
                                        <option value={0}>0%</option>
                                        <option value={4}>4%</option>
                                        <option value={10}>10%</option>
                                        <option value={21}>21%</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    ))}
                    <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div className={styles.fieldWrapper}>
                            <label className={styles.label}>Instrucciones de Pago</label>
                            <textarea
                                className={styles.textarea}
                                value={formData.paymentInstructions}
                                onChange={e => setFormData({ ...formData, paymentInstructions: e.target.value })}
                            />
                        </div>
                        <div className={styles.fieldWrapper}>
                            <label className={styles.label}>Comentarios Internos / Notas</label>
                            <textarea
                                className={styles.textarea}
                                value={formData.comments}
                                onChange={e => setFormData({ ...formData, comments: e.target.value })}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

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
                                <span className={styles.mainLogo}>{settings.companyName.toUpperCase()}</span>
                                <span className={styles.subLogo}>& SERVICIOS</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className={styles.metaGrid}>
                    <div className={styles.companyInfo}>
                        <h2 className={styles.ownerName}>{settings.companyName}</h2>
                        <p>{settings.address || 'Rua da Finca Federico Narón 15570 A Coruña'}</p>
                        <p>{settings.phone || '651 45 28 69'}</p>
                        <p>{settings.adminEmail}</p>
                        <p>NIF / CIF: {settings.nif}</p>
                    </div>
                    <div className={styles.budgetMeta}>
                        <h2 className={styles.docTitle}>FACTURA</h2>
                        <div className={styles.metaRow}>
                            <span>Número:</span>
                            <strong>{formData.number}</strong>
                        </div>
                        <div className={styles.metaRow}>
                            <span>Fecha:</span>
                            <strong>{new Date(formData.date).toLocaleDateString('es-ES')}</strong>
                        </div>
                        <div className={styles.metaRow}>
                            <span>Vencimiento:</span>
                            <strong>{new Date(formData.dueDate).toLocaleDateString('es-ES')}</strong>
                        </div>
                    </div>
                </div>

                <div className={styles.separator} />

                <div className={styles.clientPreview}>
                    <span className={styles.targetLabel}>CLIENTE:</span>
                    <div className={styles.clientBox}>
                        {formData.nonRegisteredClient ? (
                            <>
                                <strong>{formData.nonRegisteredClient.name}</strong>
                                <p>{formData.nonRegisteredClient.address}</p>
                                <p>NIF: {formData.nonRegisteredClient.nif}</p>
                                <p>Tlf: {formData.nonRegisteredClient.phone}</p>
                                <p>Email: {formData.nonRegisteredClient.email}</p>
                            </>
                        ) : (
                            (() => {
                                const client = clients.find(c => c.id === formData.clientId);
                                return (
                                    <>
                                        <strong>{client?.name || formData.clientName}</strong>
                                        {client && (
                                            <>
                                                <p>{client.address}</p>
                                                <p>NIF: {client.nif}</p>
                                                <p>Tlf: {client.phone}</p>
                                                <p>Email: {client.email}</p>
                                            </>
                                        )}
                                        {!client && <p>Cód. Cliente: {formData.clientId}</p>}
                                    </>
                                );
                            })()
                        )}
                    </div>
                </div>

                <table className={styles.previewTable}>
                    <thead>
                        <tr>
                            <th style={{ textAlign: 'left' }}>Descripción del Servicio</th>
                            <th style={{ textAlign: 'center' }}>Cant.</th>
                            <th style={{ textAlign: 'right' }}>Precio</th>
                            <th style={{ textAlign: 'center' }}>IVA</th>
                            <th style={{ textAlign: 'right' }}>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {formData.items.map((item) => {
                            const amount = item.quantity * item.rate;
                            const total = amount * (1 + item.iva / 100);
                            return (
                                <tr key={item.id}>
                                    <td>
                                        <div className={styles.previewItemTitle}>{item.title}</div>
                                        <div className={styles.previewItemDesc}>{item.description}</div>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                                    <td style={{ textAlign: 'right' }}>€&nbsp;{item.rate.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</td>
                                    <td style={{ textAlign: 'center' }}>{item.iva}%</td>
                                    <td style={{ textAlign: 'right' }}>€&nbsp;{total.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                <div className={styles.totalsWrapper}>
                    <div className={styles.totalsTable}>
                        <div className={styles.totalRow}>
                            <span>Subtotal</span>
                            <span>€ {totals.subtotal.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className={styles.totalRow}>
                            <span>IVA</span>
                            <span>€ {totals.iva.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className={`${styles.totalRow} ${styles.grandTotal}`}>
                            <span>TOTAL FACTURA</span>
                            <span>€ {totals.total.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
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

                <div className={styles.noteBox} style={{ marginTop: '30px' }}>
                    <span className={styles.noteTitle}>Instrucciones de Pago:</span>
                    <p style={{ whiteSpace: 'pre-wrap' }}>{formData.paymentInstructions}</p>
                </div>

                {formData.comments && (
                    <div className={styles.noteBox} style={{ marginTop: '16px' }}>
                        <span className={styles.noteTitle}>Comentarios:</span>
                        <p style={{ whiteSpace: 'pre-wrap' }}>{formData.comments}</p>
                    </div>
                )}

                <div className={styles.signatures}>
                    <div className={styles.signatureBox}>
                        <div className={styles.sigLine} />
                        <span>Sello y Firma Emisor</span>
                        <strong>{settings.companyName}</strong>
                    </div>
                    <div className={styles.signatureBox}>
                        <div className={styles.sigLine} />
                        <span>Conformidad Cliente</span>
                        <strong>{formData.clientName}</strong>
                    </div>
                </div>
            </div>

            <div className={styles.previewActions} id="actions-non-printable">
                <Button onClick={handlePrint} variant="secondary">🖨️ Imprimir / PDF</Button>
                <Button onClick={() => setIsEditing(true)}>✏️ Editar Factura</Button>
                <Button onClick={() => router.push('/facturas')}>Cerrar</Button>
                {formData.status === 'Emitida' && (
                    <Button onClick={() => handleStatusUpdate('Pagada')} style={{ background: '#00c853' }}>
                        💳 Marcar como Pagada
                    </Button>
                )}
            </div>
        </div>
    );

    return (
        <div className={styles.container}>
            <header className={styles.header + " " + styles.noPrint}>
                <div>
                    <h1 className={styles.title}>{isEditing ? 'Editando Factura' : 'Detalle de Factura'}</h1>
                    <p className={styles.subtitle}>{isEditing ? 'Modifica los datos y servicios' : 'Gestionar cobros y descarga de PDF'}</p>
                </div>
            </header>

            {isEditing ? renderEditForm() : renderPreview()}
        </div>
    );
}
