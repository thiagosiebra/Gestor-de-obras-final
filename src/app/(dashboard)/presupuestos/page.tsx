'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/context';
import { Button } from '@/components/ui/Button';
import styles from './page.module.css';

export default function BudgetsPage() {
    const router = useRouter();
    const { budgets, deleteBudget, duplicateBudget } = useApp();

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Presupuestos</h1>
                    <p className={styles.subtitle}>Gestione los presupuestos y propuestas para sus clientes</p>
                </div>
                <Link href="/presupuestos/novo">
                    <Button>+ Nuevo Presupuesto</Button>
                </Link>
            </div>

            <div className={`glass-panel ${styles.tableCard}`}>
                {budgets.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>📄</div>
                        <h3>No hay presupuestos creados</h3>
                        <p>Empiece creando su primer presupuesto para un cliente.</p>
                        <Link href="/presupuestos/novo" style={{ marginTop: '16px' }}>
                            <Button variant="secondary">Crear Presupuesto</Button>
                        </Link>
                    </div>
                ) : (
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Número</th>
                                <th>Cliente</th>
                                <th>Concepto</th>
                                <th>Fecha</th>
                                <th>Estado</th>
                                <th>Total</th>
                                <th style={{ textAlign: 'right' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {budgets.map((budget) => {
                                const total = budget.items.reduce((acc, item) => acc + (item.quantity * item.rate * (1 + item.iva / 100)), 0);
                                return (
                                    <tr key={budget.id}>
                                        <td className={styles.numberCell} data-label="Número">{budget.number}</td>
                                        <td data-label="Cliente">{budget.clientName}</td>
                                        <td data-label="Concepto">{budget.concept}</td>
                                        <td data-label="Fecha">{new Date(budget.date).toLocaleDateString()}</td>
                                        <td data-label="Estado">
                                            <span className={`${styles.statusBadge} ${styles[budget.status?.toLowerCase() || 'borrador']}`}>
                                                {budget.status || 'Borrador'}
                                            </span>
                                        </td>
                                        <td className={styles.totalCell} data-label="Total">
                                            {total.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div className={styles.actions}>
                                                <Link href={`/presupuestos/${budget.id}`}>
                                                    <button className={styles.actionBtn} title="Ver / Editar">👁️</button>
                                                </Link>
                                                <button
                                                    className={styles.actionBtn}
                                                    title="Duplicar"
                                                    onClick={() => {
                                                        const newId = duplicateBudget(budget.id);
                                                        if (newId) router.push(`/presupuestos/${newId}`);
                                                    }}
                                                >
                                                    👯
                                                </button>
                                                <button
                                                    className={styles.actionBtn}
                                                    title="Eliminar"
                                                    onClick={() => {
                                                        if (confirm('¿Está seguro de eliminar este presupuesto?')) {
                                                            deleteBudget(budget.id);
                                                        }
                                                    }}
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
