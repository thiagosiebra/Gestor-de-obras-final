'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/lib/context';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import styles from './page.module.css';

interface Company {
    id: string;
    name: string;
    adminEmail: string;
    createdAt: string;
    employeeCount: number;
    status: 'Activa' | 'Suspendida';
}

export default function MasterCompaniesPage() {
    const { currentUser, logout } = useApp();
    const router = useRouter();
    const [companies, setCompanies] = useState<Company[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [newCompanyName, setNewCompanyName] = useState('');
    const [newAdminEmail, setNewAdminEmail] = useState('');

    useEffect(() => {
        if (!currentUser || currentUser.role !== 'super-admin') {
            router.push('/master/login');
        }

        // Mock data for companies
        setCompanies([
            { id: '1', name: 'Vilanova Pinturas', adminEmail: 'admin@vilanovapinturas.es', createdAt: '2025-01-01', employeeCount: 5, status: 'Activa' },
            { id: '2', name: 'Reformas Express', adminEmail: 'contacto@reformas.es', createdAt: '2025-01-10', employeeCount: 2, status: 'Activa' }
        ]);
    }, [currentUser, router]);

    const handleAddCompany = (e: React.FormEvent) => {
        e.preventDefault();
        const newCompany: Company = {
            id: Math.random().toString(36).substr(2, 9),
            name: newCompanyName,
            adminEmail: newAdminEmail,
            createdAt: new Date().toISOString().split('T')[0],
            employeeCount: 0,
            status: 'Activa'
        };
        setCompanies([...companies, newCompany]);
        setIsAdding(false);
        setNewCompanyName('');
        setNewAdminEmail('');
    };

    if (!currentUser || currentUser.role !== 'super-admin') return null;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.title}>Panel de Sistemas</h1>
                    <p className={styles.subtitle}>Gestión Global de Empresas y Tenantes</p>
                </div>
                <Button onClick={() => logout().then(() => router.push('/master/login'))} variant="outline">
                    Cerrar Sesión Master
                </Button>
            </header>

            <main className={styles.main}>
                <div className={styles.statsGrid}>
                    <div className={`${styles.statCard} glass-panel`}>
                        <span className={styles.statLabel}>Total Empresas</span>
                        <span className={styles.statValue}>{companies.length}</span>
                    </div>
                    <div className={`${styles.statCard} glass-panel`}>
                        <span className={styles.statLabel}>Usuarios Activos</span>
                        <span className={styles.statValue}>{companies.reduce((a, b) => a + b.employeeCount, 0)}</span>
                    </div>
                </div>

                <div className={styles.tableHeader}>
                    <h2>Listado de Empresas</h2>
                    <Button onClick={() => setIsAdding(true)}>+ Nueva Empresa</Button>
                </div>

                {isAdding && (
                    <div className={`${styles.modalOverlay}`}>
                        <div className={`${styles.modal} glass-panel`}>
                            <h3>Registrar Nueva Empresa</h3>
                            <form onSubmit={handleAddCompany} className={styles.form}>
                                <Input
                                    id="companyName"
                                    label="Nombre de la Empresa"
                                    value={newCompanyName}
                                    onChange={e => setNewCompanyName(e.target.value)}
                                    required
                                />
                                <Input
                                    id="adminEmail"
                                    label="Email del Administrador"
                                    type="email"
                                    value={newAdminEmail}
                                    onChange={e => setNewAdminEmail(e.target.value)}
                                    required
                                />
                                <div className={styles.modalActions}>
                                    <Button type="button" variant="outline" onClick={() => setIsAdding(false)}>Cancelar</Button>
                                    <Button type="submit">Crear Tenant</Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                <div className={`${styles.tableWrapper} glass-panel`}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Admin Email</th>
                                <th>Fecha Alta</th>
                                <th>Empleados</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {companies.map(company => (
                                <tr key={company.id}>
                                    <td><strong>{company.name}</strong></td>
                                    <td>{company.adminEmail}</td>
                                    <td>{company.createdAt}</td>
                                    <td>{company.employeeCount}</td>
                                    <td><span className={styles.badge}>{company.status}</span></td>
                                    <td>
                                        <button className={styles.iconBtn}>⚙️</button>
                                        <button className={styles.iconBtn}>📊</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
}
