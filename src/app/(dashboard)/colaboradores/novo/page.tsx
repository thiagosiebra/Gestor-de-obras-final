'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useApp } from '@/lib/context';
import styles from './page.module.css';

export default function NewEmployeePage() {
    const router = useRouter();
    const { addEmployee } = useApp();
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        role: '',
        salaryBase: '',
        overtimeRate: '',
        dni: '',
        address: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Simulate network delay for UX
        setTimeout(() => {
            addEmployee({
                ...formData,
                status: 'Activo'
            });
            setIsLoading(false);
            router.push('/colaboradores');
        }, 500);
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Nuevo Colaborador</h1>
                <Link href="/colaboradores" style={{ color: 'var(--text-secondary)' }}>
                    ← Volver a la lista
                </Link>
            </div>

            <div className={`${styles.card} glass-panel`}>
                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.grid}>
                        <Input
                            id="firstName"
                            label="Nombre"
                            value={formData.firstName}
                            onChange={handleChange}
                            required
                        />
                        <Input
                            id="lastName"
                            label="Apellidos"
                            value={formData.lastName}
                            onChange={handleChange}
                            required
                        />
                        <Input
                            id="email"
                            label="Correo Electrónico"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                        <Input
                            id="phone"
                            label="Teléfono"
                            type="tel"
                            value={formData.phone}
                            onChange={handleChange}
                            required
                        />
                        <Input
                            id="role"
                            label="Cargo / Rol (Ej: Pintor)"
                            value={formData.role}
                            onChange={handleChange}
                            required
                        />
                        <Input
                            id="dni"
                            label="DNI / NIE"
                            value={formData.dni}
                            onChange={handleChange}
                            required
                        />
                        <Input
                            id="address"
                            label="Dirección Completa"
                            value={formData.address}
                            onChange={handleChange}
                            required
                        />
                        <Input
                            id="password"
                            label="Contraseña de Acceso"
                            type="password"
                            placeholder="Defina una contraseña para el empleado"
                            value={(formData as any).password || ''}
                            onChange={handleChange}
                            required
                        />

                        <div style={{ gridColumn: '1 / -1', borderTop: '1px solid var(--border-subtle)', margin: '16px 0' }}></div>
                        <h3 style={{ gridColumn: '1 / -1', fontSize: '1.1rem', marginBottom: '8px' }}>💰 Información Financiera</h3>

                        <div className={styles.formGroup}>
                            <Input
                                id="salaryBase"
                                label="Salario Base Mensual (€)"
                                type="number"
                                value={formData.salaryBase}
                                onChange={handleChange}
                                required
                            />
                            {formData.salaryBase && (
                                <div style={{ fontSize: '0.85rem', color: '#4ade80', marginTop: '4px' }}>
                                    Valor Hora (Estimado /160h): <strong>{(parseFloat(formData.salaryBase) / 160).toFixed(2)} €/h</strong>
                                </div>
                            )}
                        </div>

                        <Input
                            id="overtimeRate"
                            label="Valor Hora Extra (€)"
                            type="number"
                            value={formData.overtimeRate}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className={styles.actions}>
                        <Link href="/colaboradores">
                            <Button type="button" variant="secondary">Cancelar</Button>
                        </Link>
                        <Button type="submit" isLoading={isLoading}>Registrar Colaborador</Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
