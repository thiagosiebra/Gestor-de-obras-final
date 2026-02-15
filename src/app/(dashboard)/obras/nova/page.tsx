'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useApp } from '@/lib/context';
import styles from '../page.module.css';

export default function NewWorkPage() {
    const router = useRouter();
    const { addWork, clients } = useApp();
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        clientId: '',
        startDate: '',
        endDate: '',
        budget: '',
        description: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        setTimeout(() => {
            addWork({
                title: formData.title,
                clientId: formData.clientId,
                startDate: formData.startDate,
                endDate: formData.endDate,
                description: formData.description,
                progress: 0,
                status: 'Pendiente',
                tasks: [],
                assignedEmployees: [],
                photos: [],
                totalBudget: Number(formData.budget) || 0,
                totalCosts: 0,
                paymentStatus: 'Pendiente',
                paidAmount: 0
            });
            setIsLoading(false);
            router.push('/obras');
        }, 1000);
    };

    return (
        <div className={styles.container} style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className={styles.header}>
                <h1 className={styles.title}>Nueva Obra</h1>
                <Link href="/obras" style={{ color: 'var(--text-secondary)' }}>
                    ← Volver a la lista
                </Link>
            </div>

            <div className={`${styles.card} glass-panel`} style={{ padding: '40px' }}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
                        <Input
                            id="title"
                            label="Título de la Obra"
                            value={formData.title}
                            onChange={handleChange}
                            required
                        />

                        <div className={styles.fieldWrapper}>
                            <label htmlFor="clientId" style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                Cliente
                            </label>
                            <select
                                id="clientId"
                                value={formData.clientId}
                                onChange={handleChange}
                                style={{
                                    width: '100%',
                                    padding: '16px',
                                    borderRadius: '12px',
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border-subtle)',
                                    color: 'var(--text-primary)',
                                    fontFamily: 'inherit'
                                }}
                                required
                            >
                                <option value="">Seleccionar Cliente...</option>
                                {clients.map(client => (
                                    <option key={client.id} value={client.id}>{client.name}</option>
                                ))}
                            </select>
                            {clients.length === 0 && <p style={{ fontSize: '0.8rem', color: '#fbbf24', marginTop: '4px' }}>⚠ Necesita registrar clientes primero.</p>}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
                        <Input
                            id="startDate"
                            label="Fecha de Inicio"
                            type="date"
                            value={formData.startDate}
                            onChange={handleChange}
                            required
                        />
                        <Input
                            id="endDate"
                            label="Fecha de Fin Estimada"
                            type="date"
                            value={formData.endDate}
                            onChange={handleChange}
                            required
                        />
                        <Input
                            id="budget"
                            label="Presupuesto Estimado (€)"
                            type="number"
                            value={formData.budget}
                            onChange={handleChange}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            Descripción del Trabajo
                        </label>
                        <textarea
                            id="description"
                            value={formData.description}
                            onChange={handleChange}
                            style={{
                                width: '100%',
                                padding: '16px',
                                borderRadius: '8px',
                                background: 'var(--bg-card)',
                                border: '1px solid var(--border-subtle)',
                                color: 'var(--text-primary)',
                                minHeight: '120px',
                                fontFamily: 'inherit'
                            }}
                            placeholder="Detalles sobre pintura, materiales, áreas a reformar..."
                        ></textarea>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '16px' }}>
                        <Link href="/obras">
                            <Button type="button" variant="secondary">Cancelar</Button>
                        </Link>
                        <Button type="submit" isLoading={isLoading}>Crear Obra</Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
