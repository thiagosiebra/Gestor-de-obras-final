'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useApp } from '@/lib/context';
import styles from './page.module.css';

export default function EditEmployeePage() {
    const router = useRouter();
    const params = useParams();
    const { employees, updateEmployee, deleteEmployee } = useApp();
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
        address: '',
        status: ''
    });

    useEffect(() => {
        if (params.id) {
            const emp = employees.find(e => e.id === params.id);
            if (emp) {
                setFormData({
                    firstName: emp.firstName,
                    lastName: emp.lastName,
                    email: emp.email,
                    phone: emp.phone,
                    role: emp.role,
                    salaryBase: emp.salaryBase || '',
                    overtimeRate: emp.overtimeRate || '',
                    dni: emp.dni || '',
                    address: emp.address || '',
                    status: emp.status
                });
            } else {
                router.push('/colaboradores');
            }
        }
    }, [params.id, employees, router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        setTimeout(() => {
            if (typeof params.id === 'string') {
                updateEmployee(params.id, formData as any);
            }
            setIsLoading(false);
            router.push('/colaboradores');
        }, 500);
    };

    const handleDelete = () => {
        if (confirm('¿Está seguro de que desea eliminar este colaborador?')) {
            if (typeof params.id === 'string') deleteEmployee(params.id);
            router.push('/colaboradores');
        }
    };

    const handleResetPassword = () => {
        if (confirm('¿Resetear la contraseña de este usuario? Se enviará un email con las instrucciones.')) {
            alert('Se ha enviado un correo de restablecimiento de contraseña.');
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Editar Colaborador</h1>
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
                            label="Cargo / Rol"
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

                        <div className={styles.fieldWrapper}>
                            <label htmlFor="status" className={styles.label}>Estado</label>
                            <select
                                id="status"
                                value={formData.status}
                                onChange={handleChange}
                                className={styles.select}
                            >
                                <option value="Activo">Activo</option>
                                <option value="En Obra">En Obra</option>
                                <option value="Inactivo">Inactivo</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ margin: '24px 0', borderTop: '1px solid var(--border-subtle)', paddingTop: '24px' }}>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', color: '#f59e0b' }}>⚠️ Zona de Seguridad</h3>
                        <Button type="button" variant="secondary" onClick={handleResetPassword}>
                            🔑 Enviar Email de Redefinición de Contraseña
                        </Button>
                    </div>

                    <div className={styles.actions} style={{ justifyContent: 'space-between', marginTop: '0' }}>
                        <Button type="button" variant="outline" onClick={handleDelete} style={{ borderColor: '#ef4444', color: '#ef4444' }}>
                            Eliminar Colaborador
                        </Button>
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <Link href="/colaboradores">
                                <Button type="button" variant="secondary">Cancelar</Button>
                            </Link>
                            <Button type="submit" isLoading={isLoading}>Guardar Cambios</Button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
