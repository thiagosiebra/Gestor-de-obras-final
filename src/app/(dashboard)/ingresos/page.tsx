'use client';

import React, { useMemo } from 'react';
import { useApp, Invoice } from '@/lib/context';
import { Button } from '@/components/ui/Button';
import styles from './page.module.css';

export default function IngresosPage() {
    const { invoices, settings } = useApp();

    // 1. Calculations for KPIs
    const stats = useMemo(() => {
        const totalInvoiced = invoices.reduce((acc, inv) => {
            const sum = inv.items.reduce((s, i) => s + (i.quantity * i.rate * (1 + i.iva / 100)), 0);
            return acc + sum;
        }, 0);

        const totalPaid = invoices
            .filter(inv => inv.status === 'Pagada')
            .reduce((acc, inv) => {
                const sum = inv.items.reduce((s, i) => s + (i.quantity * i.rate * (1 + i.iva / 100)), 0);
                return acc + sum;
            }, 0);

        const totalPending = invoices
            .filter(inv => inv.status === 'Emitida')
            .reduce((acc, inv) => {
                const sum = inv.items.reduce((s, i) => s + (i.quantity * i.rate * (1 + i.iva / 100)), 0);
                return acc + sum;
            }, 0);

        const collectionRate = totalInvoiced > 0 ? (totalPaid / totalInvoiced) * 100 : 0;

        return { totalInvoiced, totalPaid, totalPending, collectionRate };
    }, [invoices]);

    // 2. Overdue Invoices
    const overdueInvoices = useMemo(() => {
        const today = new Date();
        return invoices.filter(inv => {
            if (inv.status !== 'Emitida') return false;
            const dueDate = new Date(inv.dueDate);
            return dueDate < today;
        }).map(inv => {
            const dueDate = new Date(inv.dueDate);
            const diffTime = Math.abs(today.getTime() - dueDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const total = inv.items.reduce((s, i) => s + (i.quantity * i.rate * (1 + i.iva / 100)), 0);
            return { ...inv, diffDays, total };
        }).sort((a, b) => b.diffDays - a.diffDays);
    }, [invoices]);

    // 3. Monthly Chart Data (Mocking last 6 months)
    const monthlyData = useMemo(() => {
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const result = [];
        const now = new Date();

        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const mIdx = d.getMonth();
            const year = d.getFullYear();

            const monthTotal = invoices
                .filter(inv => {
                    const invDate = new Date(inv.date);
                    return invDate.getMonth() === mIdx && invDate.getFullYear() === year;
                })
                .reduce((acc, inv) => {
                    const sum = inv.items.reduce((s, i) => s + (i.quantity * i.rate * (1 + i.iva / 100)), 0);
                    return acc + sum;
                }, 0);

            result.push({ label: `${months[mIdx]}`, value: monthTotal });
        }
        return result;
    }, [invoices]);

    const maxValue = Math.max(...monthlyData.map(d => d.value), 1000);

    // 4. Distribution by Client (Top 5)
    const clientDistribution = useMemo(() => {
        const distribution: Record<string, number> = {};
        invoices.forEach(inv => {
            const total = inv.items.reduce((s, i) => s + (i.quantity * i.rate * (1 + i.iva / 100)), 0);
            distribution[inv.clientName] = (distribution[inv.clientName] || 0) + total;
        });

        return Object.entries(distribution)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
    }, [invoices]);

    const handleWhatsAppRemind = (inv: any) => {
        const text = `Hola ${inv.clientName}, te escribo de ${settings.companyName} para recordarte que la factura ${inv.number} por importe de € ${inv.total.toLocaleString()} tiene el vencimiento pendiente desde hace ${inv.diffDays} días. ¿Podrías confirmarnos el estado del pago? ¡Gracias!`;
        window.open(`https://wa.me/${inv.nonRegisteredClient?.phone || ''}?text=${encodeURIComponent(text)}`, '_blank');
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.title}>Panel de Ingresos</h1>
                    <p className={styles.subtitle}>Gestión financiera y seguimiento de cobros</p>
                </div>
            </header>

            <div className={styles.statsGrid}>
                <div className={`${styles.statCard} glass-panel`}>
                    <span className={styles.statIcon}>📈</span>
                    <div className={styles.statInfo}>
                        <label>Facturación Bruta</label>
                        <strong>€&nbsp;{stats.totalInvoiced.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</strong>
                    </div>
                </div>
                <div className={`${styles.statCard} glass-panel`}>
                    <span className={styles.statIcon} style={{ background: 'rgba(0, 200, 83, 0.1)', color: '#00c853' }}>💰</span>
                    <div className={styles.statInfo}>
                        <label>Dinero en Caja</label>
                        <strong style={{ color: '#00c853' }}>€&nbsp;{stats.totalPaid.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</strong>
                    </div>
                </div>
                <div className={`${styles.statCard} glass-panel`}>
                    <span className={styles.statIcon} style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>⏳</span>
                    <div className={styles.statInfo}>
                        <label>Total a Cobrar</label>
                        <strong style={{ color: '#3b82f6' }}>€&nbsp;{stats.totalPending.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</strong>
                    </div>
                </div>
                <div className={`${styles.statCard} glass-panel`}>
                    <span className={styles.statIcon} style={{ background: 'rgba(255, 214, 0, 0.1)', color: '#ffd600' }}>🎯</span>
                    <div className={styles.statInfo}>
                        <label>Tasa de Cobro</label>
                        <strong style={{ color: '#ffd600' }}>{stats.collectionRate.toFixed(1)}%</strong>
                    </div>
                </div>
            </div>

            <div className={styles.mainGrid}>
                <div className={`${styles.chartSection} glass-panel`}>
                    <h3 className={styles.sectionTitle}>📊 Flujo de Caja (Últimos 6 Meses)</h3>
                    <div className={styles.chartContainer}>
                        {monthlyData.map((data, idx) => (
                            <div key={idx} className={styles.barWrapper}>
                                <div
                                    className={styles.bar}
                                    style={{ height: `${(data.value / maxValue) * 100}%` }}
                                    title={`€ ${data.value.toLocaleString()}`}
                                >
                                    <span className={styles.barValue}>€&nbsp;{Math.round(data.value / 1000)}k</span>
                                </div>
                                <span className={styles.barLabel}>{data.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className={`${styles.distributionSection} glass-panel`}>
                    <h3 className={styles.sectionTitle}>🤝 Mayores Clientes</h3>
                    <div className={styles.clientList}>
                        {clientDistribution.map(([name, value], idx) => (
                            <div key={idx} className={styles.clientRow}>
                                <div className={styles.clientMain}>
                                    <span className={styles.clientName}>{name}</span>
                                    <div className={styles.miniProgress}>
                                        <div
                                            className={styles.miniFill}
                                            style={{ width: `${(value / (stats.totalInvoiced || 1)) * 100}%` }}
                                        />
                                    </div>
                                </div>
                                <span className={styles.clientValue}>€&nbsp;{value.toLocaleString()}</span>
                            </div>
                        ))}
                        {clientDistribution.length === 0 && <p className={styles.emptyText}>Sin facturación registrada.</p>}
                    </div>
                </div>
            </div>

            <div className={`${styles.overdueSection} glass-panel`}>
                <div className={styles.overdueHeader}>
                    <h3 className={styles.sectionTitle}>🚨 Cobros en Atraso</h3>
                    <span className={styles.badge}>{overdueInvoices.length} facturas</span>
                </div>
                {overdueInvoices.length > 0 ? (
                    <div className={styles.overdueGrid}>
                        {overdueInvoices.map((inv) => (
                            <div key={inv.id} className={styles.overdueCard}>
                                <div className={styles.overdueInfo}>
                                    <strong>{inv.clientName}</strong>
                                    <span>#{inv.number} • Venció hace {inv.diffDays} días</span>
                                </div>
                                <div className={styles.overdueAction}>
                                    <div className={styles.overdueAmount}>€&nbsp;{inv.total.toLocaleString()}</div>
                                    <Button
                                        variant="secondary"
                                        onClick={() => handleWhatsAppRemind(inv)}
                                        style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                                    >
                                        📲 Recordar
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className={styles.noOverdue}>
                        <span className={styles.checkIcon}>✅</span>
                        <p>¡Vaya suerte! No existen cobros en atraso en este momento.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
