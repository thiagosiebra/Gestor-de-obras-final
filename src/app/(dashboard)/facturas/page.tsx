'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/context';
import { Button } from '@/components/ui/Button';
import styles from '../presupuestos/page.module.css';

export default function InvoicesPage() {
    const router = useRouter();
    const { invoices, deleteInvoice } = useApp();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredInvoices = invoices.filter(inv =>
        inv.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.concept.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Emitida': return '#3b82f6';
            case 'Pagada': return '#00c853';
            case 'Anulada': return '#ef4444';
            default: return 'var(--text-secondary)';
        }
    };

    const calculateTotal = (items: any[]) => {
        return items.reduce((acc, item) => {
            const sub = item.quantity * item.rate;
            const iva = sub * (item.iva / 100);
            return acc + sub + iva;
        }, 0);
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.title}>Facturas</h1>
                    <p className={styles.subtitle}>Gestión de facturación y cobros</p>
                </div>
            </header>

            <div className={`${styles.tableCard} glass-panel`}>
                <div className={styles.tableActions}>
                    <input
                        type="text"
                        placeholder="Buscar por número, cliente o concepto..."
                        className={styles.searchInput}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Nº Factura</th>
                            <th>Fecha</th>
                            <th>Cliente</th>
                            <th>Concepto</th>
                            <th>Total</th>
                            <th style={{ textAlign: 'center' }}>Estado</th>
                            <th style={{ textAlign: 'center' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredInvoices.length === 0 ? (
                            <tr>
                                <td colSpan={7} className={styles.emptyTable}>No se encontraron facturas.</td>
                            </tr>
                        ) : (
                            filteredInvoices.map((inv) => (
                                <tr key={inv.id}>
                                    <td className={styles.bold} data-label="Nº Factura">{inv.number}</td>
                                    <td data-label="Fecha">{new Date(inv.date).toLocaleDateString('es-ES')}</td>
                                    <td data-label="Cliente">{inv.clientName}</td>
                                    <td data-label="Concepto">{inv.concept}</td>
                                    <td className={styles.bold} data-label="Total">{calculateTotal(inv.items).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</td>
                                    <td style={{ textAlign: 'center' }} data-label="Estado">
                                        <span
                                            className={styles.statusBadge}
                                            style={{ backgroundColor: `${getStatusColor(inv.status)}20`, color: getStatusColor(inv.status), border: `1px solid ${getStatusColor(inv.status)}40` }}
                                        >
                                            {inv.status}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <div className={styles.actionGroup}>
                                            <button
                                                className={styles.actionBtn}
                                                title="Ver / Imprimir"
                                                onClick={() => router.push(`/facturas/${inv.id}`)}
                                            >
                                                👁️
                                            </button>
                                            <button
                                                className={styles.actionBtn}
                                                title="Eliminar"
                                                onClick={() => { if (confirm('¿Eliminar factura?')) deleteInvoice(inv.id); }}
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
