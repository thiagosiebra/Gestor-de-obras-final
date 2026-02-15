'use client';

import React, { useState, useMemo } from 'react';
import { useApp, Expense, Work } from '@/lib/context';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import styles from './page.module.css';

export default function FinancePage() {
    const { providers, addProvider, stock, addStockItem, updateStockItem, expenses, works, addExpense, deleteExpense, budgets } = useApp();

    const [showModal, setShowModal] = useState(false);
    const [isScanning, setIsScanning] = useState(false);

    // Form State
    const [formData, setFormData] = useState<Omit<Expense, 'id'>>({
        description: '',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        category: 'Material',
        workId: '',
        items: []
    });

    // Summary Calculations
    const totalRevenue = useMemo(() => {
        // Sum of all accepted budgets total
        return budgets
            .filter(b => b.status === 'Aceptado')
            .reduce((acc, b) => {
                const sub = b.items.reduce((sum, i) => sum + (i.quantity * i.rate), 0);
                const iva = b.items.reduce((sum, i) => sum + (i.quantity * i.rate * (i.iva / 100)), 0);
                return acc + sub + iva;
            }, 0);
    }, [budgets]);

    const totalExpenses = useMemo(() => {
        return expenses.reduce((acc, e) => acc + e.amount, 0);
    }, [expenses]);

    const netProfit = totalRevenue - totalExpenses;

    const handleSimulateScan = () => {
        setIsScanning(true);
        // Mock OCR Logic with Provider and Stock integration
        setTimeout(() => {
            const providerName = 'Leroy Merlin Getafe';
            const mockData = {
                description: `Factura ${providerName} - Pintura y Herramientas`,
                amount: 142.50,
                provider: {
                    name: providerName,
                    cif: 'A80001000',
                    email: 'contacto@leroymerlin.es',
                    phone: '910002000',
                    address: 'Polígono Industrial Getafe, Madrid',
                    category: 'Materiales'
                },
                items: [
                    { name: 'Pintura Blanca 15L', quantity: 2, price: 55.00, unit: 'L', category: 'Pintura' },
                    { name: 'Rodillo Profesional 22cm', quantity: 3, price: 10.83, unit: 'Unid', category: 'Herramientas' }
                ],
                category: 'Material' as const
            };

            // Check if provider exists, if not, add it
            const exists = providers.find(p => p.name === providerName || p.cif === mockData.provider.cif);
            if (!exists) {
                addProvider(mockData.provider);
            }

            // Update Stock
            mockData.items.forEach(item => {
                const stockItem = stock.find(s => s.name.toLowerCase() === item.name.toLowerCase());
                if (stockItem) {
                    updateStockItem(stockItem.id, { quantity: stockItem.quantity + item.quantity });
                } else {
                    addStockItem({
                        name: item.name,
                        category: item.category,
                        quantity: item.quantity,
                        unit: item.unit,
                        minStock: 5,
                        lastUpdate: new Date().toISOString()
                    });
                }
            });

            setFormData(prev => ({
                ...prev,
                description: mockData.description,
                amount: mockData.amount,
                items: mockData.items,
                category: mockData.category
            }));
            setIsScanning(false);
            alert('IA: Proveedor identificado y stock actualizado automáticamente.');
        }, 2000);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        addExpense(formData);
        setShowModal(false);
        setFormData({
            description: '',
            amount: 0,
            date: new Date().toISOString().split('T')[0],
            category: 'Material',
            workId: '',
            items: []
        });
    };

    const getWorkTitle = (id?: string) => {
        if (!id) return 'General';
        const work = works.find(w => w.id === id);
        return work ? work.title : 'Desconocida';
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Costo y Finanzas</h1>
                    <p className={styles.subtitle}>Seguimiento de gastos por obra y rentabilidad total</p>
                </div>
                <Button onClick={() => setShowModal(true)}>+ Registrar Gastos</Button>
            </div>

            <div className={styles.summary}>
                <div className={`${styles.summaryCard} glass-panel`}>
                    <div className={styles.summaryTitle}>Ingresos Totales (Presupuestos Aceptados)</div>
                    <div className={`${styles.summaryValue} ${styles.positive}`}>
                        {totalRevenue.toLocaleString('es-ES')} €
                    </div>
                </div>
                <div className={`${styles.summaryCard} glass-panel`}>
                    <div className={styles.summaryTitle}>Gastos Totales</div>
                    <div className={`${styles.summaryValue} ${styles.negative}`}>
                        -{totalExpenses.toLocaleString('es-ES')} €
                    </div>
                </div>
                <div className={`${styles.summaryCard} glass-panel`}>
                    <div className={styles.summaryTitle}>Beneficio Neto Est.</div>
                    <div className={`${styles.summaryValue} ${netProfit >= 0 ? styles.positive : styles.negative}`}>
                        {netProfit.toLocaleString('es-ES')} €
                    </div>
                </div>
                <div className={`${styles.summaryCard} glass-panel`}>
                    <div className={styles.summaryTitle}>Margen de Beneficio</div>
                    <div className={styles.summaryValue}>
                        {totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0}%
                    </div>
                </div>
            </div>

            <div className={styles.mainGrid}>
                <div className={`${styles.tableContainer} glass-panel`}>
                    <div className={styles.tableHeader}>
                        <h2 className={styles.tableTitle}>Últimos Gastos</h2>
                    </div>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Descripción</th>
                                <th>Categoría</th>
                                <th>Obra / Proyecto</th>
                                <th style={{ textAlign: 'right' }}>Importe</th>
                                <th style={{ textAlign: 'center' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {expenses.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>No hay gastos registrados</td>
                                </tr>
                            ) : (
                                expenses.map(e => (
                                    <tr key={e.id}>
                                        <td>{new Date(e.date).toLocaleDateString()}</td>
                                        <td>
                                            <div style={{ fontWeight: 500 }}>{e.description}</div>
                                            {e.items && e.items.length > 0 && (
                                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                                    {e.items.length} productos detectados
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            <span className={`${styles.categoryBadge} ${styles[e.category.replace(/ /g, '')]}`}>
                                                {e.category}
                                            </span>
                                        </td>
                                        <td>
                                            {e.workId ? (
                                                <a href={`/obras/${e.workId}`} className={styles.workLink}>
                                                    {getWorkTitle(e.workId)}
                                                </a>
                                            ) : 'Gasto General'}
                                        </td>
                                        <td style={{ textAlign: 'right', fontWeight: 600 }}>
                                            {e.amount.toLocaleString('es-ES')} €
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <button
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}
                                                onClick={() => { if (confirm('¿Eliminar gasto?')) deleteExpense(e.id); }}
                                            >🗑️</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className={`${styles.summaryCard} glass-panel`}>
                    <h3 style={{ marginBottom: '16px' }}>Rentabilidad por Obra</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {works.filter(w => w.status !== 'Finalizado').slice(0, 5).map(w => {
                            const margin = w.totalBudget > 0 ? ((w.totalBudget - w.totalCosts) / w.totalBudget) * 100 : 0;
                            return (
                                <div key={w.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <span style={{ fontWeight: 500 }}>{w.title}</span>
                                        <span style={{ color: margin > 30 ? '#00c853' : '#ffd600' }}>{margin.toFixed(0)}%</span>
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Costo: {w.totalCosts.toLocaleString()}€</span>
                                        <span>Pres: {w.totalBudget.toLocaleString()}€</span>
                                    </div>
                                </div>
                            );
                        })}
                        {works.length === 0 && <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>No hay obras activas para analizar.</p>}
                    </div>
                </div>
            </div>

            {showModal && (
                <div className={styles.modal}>
                    <div className={`${styles.modalContent} glass-panel`}>
                        <h2 className={styles.modalTitle}>Registrar Gasto</h2>

                        <div className={styles.scanSection} onClick={handleSimulateScan}>
                            {isScanning ? (
                                <div>
                                    <span className={styles.scanIcon}>⌛</span>
                                    <span className={styles.scanText}>Escaneando Factura...</span>
                                </div>
                            ) : (
                                <div>
                                    <span className={styles.scanIcon}>📸</span>
                                    <span className={styles.scanText}>Subir Foto / Escanear Factura</span>
                                    <p style={{ fontSize: '12px', opacity: 0.7, marginTop: '8px' }}>Se detectarán automáticamente artículos, precios e IVA</p>
                                </div>
                            )}
                        </div>

                        {formData.items && formData.items.length > 0 && (
                            <div className={styles.ocrPreview}>
                                <strong>DETECCIÓN AUTOMÁTICA (MOCK OCR):</strong>
                                {formData.items.map((it, idx) => (
                                    <div key={idx}>- {it.name} x{it.quantity}: {it.price}€</div>
                                ))}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} style={{ marginTop: '24px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <Input
                                    id="desc"
                                    label="Descripción del Gasto"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    required
                                />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <Input
                                        id="amount"
                                        label="Importe Total (€)"
                                        type="number"
                                        value={formData.amount}
                                        onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })}
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
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div className={styles.fieldWrapper}>
                                        <label style={{ fontSize: '14px', display: 'block', marginBottom: '8px' }}>Categoría</label>
                                        <select
                                            className={styles.filterSelect}
                                            style={{ width: '100%' }}
                                            value={formData.category}
                                            onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                                        >
                                            <option value="Material">Material</option>
                                            <option value="Herramientas">Herramientas</option>
                                            <option value="Combustible">Combustible</option>
                                            <option value="Mano de Obra">Mano de Obra</option>
                                            <option value="Comida">Comida</option>
                                            <option value="Café">Café</option>
                                            <option value="Gestoría">Gestoría</option>
                                            <option value="Préstamos">Préstamos</option>
                                            <option value="Tarjetas">Tarjetas</option>
                                            <option value="Móvil">Móvil</option>
                                            <option value="Otros">Otros</option>
                                        </select>
                                    </div>
                                    <div className={styles.fieldWrapper}>
                                        <label style={{ fontSize: '14px', display: 'block', marginBottom: '8px' }}>Asignar a Obra</label>
                                        <select
                                            className={styles.filterSelect}
                                            style={{ width: '100%' }}
                                            value={formData.workId}
                                            onChange={e => setFormData({ ...formData, workId: e.target.value })}
                                        >
                                            <option value="">Gasto General (Sin obra)</option>
                                            {works.filter(w => w.status !== 'Finalizado').map(w => (
                                                <option key={w.id} value={w.id}>{w.title}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.modalActions}>
                                <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
                                <Button type="submit">Guardar Gasto</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
