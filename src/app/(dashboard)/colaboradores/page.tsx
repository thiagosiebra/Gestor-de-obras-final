'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useApp } from '@/lib/context';
import styles from './page.module.css';

export default function CollaboratorsPage() {
    const { employees } = useApp();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredEmployees = employees.filter(emp =>
        emp.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Colaboradores</h1>
                    <p className={styles.subtitle}>Gestione su equipo de trabajo</p>
                </div>
                <Link href="/colaboradores/novo">
                    <Button>+ Nuevo Colaborador</Button>
                </Link>
            </div>

            <div className={styles.controls}>
                <div className={styles.searchWrapper}>
                    <Input
                        id="search"
                        label="Buscar por nombre o cargo..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className={styles.grid}>
                {filteredEmployees.map((employee) => (
                    <div key={employee.id} className={`${styles.card} glass-panel`}>
                        <div className={styles.cardHeader}>
                            <div className={styles.avatar}>{employee.firstName.charAt(0)}</div>
                            <div>
                                <h3 className={styles.name}>{employee.firstName} {employee.lastName}</h3>
                                <p className={styles.role}>{employee.role}</p>
                            </div>
                        </div>

                        <div className={styles.cardInfo}>
                            <div className={styles.infoRow}>
                                <span>Estado:</span>
                                <span className={`${styles.status} ${styles[employee.status === 'Activo' ? 'active' : employee.status === 'En Obra' ? 'busy' : 'inactive']}`}>
                                    {employee.status}
                                </span>
                            </div>
                            <div className={styles.infoRow}>
                                <span>Email:</span>
                                <span>{employee.email}</span>
                            </div>
                        </div>

                        <div className={styles.actions}>
                            <Link href={`/colaboradores/${employee.id}`} style={{ width: '100%' }}>
                                <Button variant="secondary" className={styles.actionBtn}>Editar</Button>
                            </Link>
                        </div>
                    </div>
                ))}

                {filteredEmployees.length === 0 && (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                        No se encontraron colaboradores.
                    </div>
                )}
            </div>
        </div>
    );
}
