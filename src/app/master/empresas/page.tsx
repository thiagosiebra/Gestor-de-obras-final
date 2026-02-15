'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/lib/context';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import styles from './page.module.css';

interface AccessLog {
    type: 'login' | 'logout';
    timestamp: string;
}

interface Company {
    id: string;
    name: string;
    adminEmail: string;
    address: string;
    phone: string;
    nif: string;
    createdAt: string;
    employeeCount: number;
    status: 'Activa' | 'Suspendida';
    paymentStatus: 'Al día' | 'Pendiente' | 'Atrasado';
    nextPaymentDate: string;
    accessLogs: AccessLog[];
    planType: 'autonomo' | 'pro' | 'enterprise';
    monthlyPrice: number;
}

export default function MasterCompaniesPage() {
    const { currentUser, logout } = useApp();
    const router = useRouter();
    const [companies, setCompanies] = useState<Company[]>([]);
    const [isAdding, setIsAdding] = useState(false);
    const [viewingDetails, setViewingDetails] = useState<Company | null>(null);
    const [editingCompany, setEditingCompany] = useState<Company | null>(null);

    // Form states for new/edit company
    const [formData, setFormData] = useState({
        name: '',
        adminEmail: '',
        address: '',
        phone: '',
        nif: '',
        paymentStatus: 'Al día' as Company['paymentStatus'],
        nextPaymentDate: new Date().toISOString().split('T')[0],
        planType: 'pro' as Company['planType'],
        monthlyPrice: 39.90
    });

    useEffect(() => {
        if (!currentUser || currentUser.role !== 'super-admin') {
            router.push('/master/login');
        }

        // Initialized as empty for a fresh start
        setCompanies([]);
    }, [currentUser, router]);

    const handleSaveCompany = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingCompany) {
            // Update existing
            setCompanies(prev => prev.map(c => c.id === editingCompany.id ? { ...c, ...formData } : c));
            setEditingCompany(null);
        } else {
            // Add new
            const companyToAdd: Company = {
                id: Math.random().toString(36).substr(2, 9),
                ...formData,
                createdAt: new Date().toISOString().split('T')[0],
                employeeCount: 0,
                status: 'Activa',
                accessLogs: []
            };
            setCompanies([...companies, companyToAdd]);
            setIsAdding(false);
        }

        // Reset form
        setFormData({ name: '', adminEmail: '', address: '', phone: '', nif: '', paymentStatus: 'Al día', nextPaymentDate: new Date().toISOString().split('T')[0], planType: 'pro', monthlyPrice: 39.90 });
    };

    const startEditing = (company: Company) => {
        setEditingCompany(company);
        setFormData({
            name: company.name,
            adminEmail: company.adminEmail,
            address: company.address,
            phone: company.phone,
            nif: company.nif,
            paymentStatus: company.paymentStatus,
            nextPaymentDate: company.nextPaymentDate,
            planType: company.planType || 'pro',
            monthlyPrice: company.monthlyPrice || 39.90
        });
    };

    const handleDeleteCompany = (id: string) => {
        if (confirm('¿Estás seguro de que deseas eliminar esta empresa? Esta acción es irreversible.')) {
            setCompanies(companies.filter(c => c.id !== id));
            if (viewingDetails?.id === id) setViewingDetails(null);
            if (editingCompany?.id === id) setEditingCompany(null);
        }
    };

    const getPaymentColor = (status: Company['paymentStatus']) => {
        switch (status) {
            case 'Al día': return '#10b981';
            case 'Pendiente': return '#f59e0b';
            case 'Atrasado': return '#ef4444';
            default: return '#fff';
        }
    };

    if (!currentUser || currentUser.role !== 'super-admin') return null;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.title}>System Control Master</h1>
                    <p className={styles.subtitle}>Gestión Profesional de Empresas y Tenantes</p>
                </div>
                <Button onClick={() => logout().then(() => router.push('/master/login'))} variant="outline" style={{ borderColor: '#ef4444', color: '#ef4444' }}>
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
                        <span className={styles.statLabel}>Ventas Totales (Mes)</span>
                        <span className={styles.statValue} style={{ color: '#10b981' }}>€ {companies.reduce((sum, c) => sum + (c.monthlyPrice || 0), 0).toFixed(2)}</span>
                    </div>
                    <div className={`${styles.statCard} glass-panel`}>
                        <span className={styles.statLabel}>Pagos Atrasados</span>
                        <span className={styles.statValue} style={{ color: '#ef4444' }}>{companies.filter(c => c.paymentStatus === 'Atrasado').length}</span>
                    </div>
                </div>

                <div className={styles.tableHeader}>
                    <h2>Listado Global de Empresas</h2>
                    <Button onClick={() => {
                        setIsAdding(true);
                        setFormData({ name: '', adminEmail: '', address: '', phone: '', nif: '', paymentStatus: 'Al día', nextPaymentDate: new Date().toISOString().split('T')[0], planType: 'pro', monthlyPrice: 39.90 });
                    }}>+ Registrar Nueva Empresa</Button>
                </div>

                {/* MODAL: REGISTRAR / EDITAR EMPRESA */}
                {(isAdding || editingCompany) && (
                    <div className={`${styles.modalOverlay}`} onClick={() => { setIsAdding(false); setEditingCompany(null); }}>
                        <div className={`${styles.modal} glass-panel`} onClick={e => e.stopPropagation()}>
                            <h3>{editingCompany ? 'Editar Empresa' : 'Registrar Empresa con Blindaje Total'}</h3>
                            <p style={{ marginTop: '-1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                {editingCompany ? 'Modifica los datos fiscales y de facturación.' : 'Introduce todos los datos fiscales para habilitar el acceso.'}
                            </p>
                            <form onSubmit={handleSaveCompany} className={styles.form}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <Input id="name" label="Nombre Comercial" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                                    <Input id="nif" label="NIF / CIF" value={formData.nif} onChange={e => setFormData({ ...formData, nif: e.target.value })} required />
                                    <Input id="email" label="Email Administrador" type="email" value={formData.adminEmail} onChange={e => setFormData({ ...formData, adminEmail: e.target.value })} required />
                                    <Input id="phone" label="Teléfono" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} required />
                                </div>
                                <Input id="address" label="Dirección Postal" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} required />

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <div className={styles.fieldWrapper}>
                                        <label className={styles.label}>Próxima Fecha de Pago</label>
                                        <input
                                            type="date"
                                            className={styles.input}
                                            style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
                                            value={formData.nextPaymentDate}
                                            onChange={e => setFormData({ ...formData, nextPaymentDate: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className={styles.fieldWrapper}>
                                        <label className={styles.label}>Estado de Pago</label>
                                        <select
                                            className={styles.select}
                                            value={formData.paymentStatus}
                                            onChange={e => setFormData({ ...formData, paymentStatus: e.target.value as any })}
                                            style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
                                        >
                                            <option value="Al día">Al día</option>
                                            <option value="Pendiente">Pendiente</option>
                                            <option value="Atrasado">Atrasado</option>
                                        </select>
                                    </div>
                                    <div className={styles.fieldWrapper}>
                                        <label className={styles.label}>Plan Seleccionado</label>
                                        <select
                                            className={styles.select}
                                            value={formData.planType}
                                            onChange={e => {
                                                const p = e.target.value as Company['planType'];
                                                let price = 39.90;
                                                if (p === 'autonomo') price = 19.90;
                                                if (p === 'enterprise') price = 99.90;
                                                setFormData({ ...formData, planType: p, monthlyPrice: price });
                                            }}
                                            style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
                                        >
                                            <option value="autonomo">Plan Autónomo (€ 19,90)</option>
                                            <option value="pro">Plan Empresa Pro (€ 39,90)</option>
                                            <option value="enterprise">Plan Enterprise (€ 99,90)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className={styles.modalActions}>
                                    <Button type="button" variant="outline" onClick={() => { setIsAdding(false); setEditingCompany(null); }}>Cancelar</Button>
                                    <Button type="submit">{editingCompany ? 'Guardar Cambios' : 'Habilitar Empresa'}</Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* MODAL: DETALLES (LOGS Y PAGOS) */}
                {viewingDetails && (
                    <div className={`${styles.modalOverlay}`} onClick={() => setViewingDetails(null)}>
                        <div className={`${styles.modal} glass-panel`} style={{ maxWidth: '700px' }} onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <h3>Control de Accesos y Financiero</h3>
                                    <p className={styles.subtitle}>{viewingDetails.name} ({viewingDetails.nif})</p>
                                </div>
                                <div style={{ padding: '8px 16px', borderRadius: '8px', background: getPaymentColor(viewingDetails.paymentStatus) + '22', color: getPaymentColor(viewingDetails.paymentStatus), fontWeight: 700 }}>
                                    PAGO: {viewingDetails.paymentStatus.toUpperCase()}
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginTop: '10px' }}>
                                <div>
                                    <h4 style={{ marginBottom: '15px', color: '#6366f1' }}>🕒 Historial de Accesos</h4>
                                    <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {viewingDetails.accessLogs.length > 0 ? viewingDetails.accessLogs.map((log, i) => (
                                            <div key={i} style={{ padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                                <span>{log.type === 'login' ? '📥 Login' : '📤 Logout'}</span>
                                                <span style={{ color: 'var(--text-secondary)' }}>{log.timestamp}</span>
                                            </div>
                                        )) : <p style={{ color: 'var(--text-secondary)' }}>Sin registros de acceso.</p>}
                                    </div>
                                </div>
                                <div>
                                    <h4 style={{ marginBottom: '15px', color: '#10b981' }}>💰 Información de Pagos</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                        <div className="glass-panel" style={{ padding: '15px' }}>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Mensualidad Actual ({viewingDetails.planType.toUpperCase()})</p>
                                            <p style={{ fontSize: '1.2rem', fontWeight: 700 }}>€ {viewingDetails.monthlyPrice.toLocaleString('es-ES', { minimumFractionDigits: 2 })} / mes</p>
                                        </div>
                                        <div className="glass-panel" style={{ padding: '15px' }}>
                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Próximo Vencimiento</p>
                                            <p style={{ fontSize: '1rem', fontWeight: 600, color: viewingDetails.paymentStatus === 'Atrasado' ? '#ef4444' : '#fff' }}>
                                                {viewingDetails.nextPaymentDate}
                                                {viewingDetails.paymentStatus === 'Atrasado' && ' (VENCIDO)'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.modalActions} style={{ marginTop: '20px' }}>
                                <Button onClick={() => setViewingDetails(null)} variant="outline" style={{ width: '100%' }}>Cerrar Informe</Button>
                            </div>
                        </div>
                    </div>
                )}

                <div className={`${styles.tableWrapper} glass-panel`}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Empresa / CIF</th>
                                <th>Admin Email</th>
                                <th>Alta</th>
                                <th>Status Pago</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {companies.map(company => (
                                <tr key={company.id}>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <strong>{company.name}</strong>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{company.nif}</span>
                                        </div>
                                    </td>
                                    <td>{company.adminEmail}</td>
                                    <td>{company.createdAt}</td>
                                    <td>
                                        <span className={styles.badge} style={{
                                            background: getPaymentColor(company.paymentStatus) + '11',
                                            color: getPaymentColor(company.paymentStatus)
                                        }}>
                                            {company.paymentStatus}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '5px' }}>
                                            <button
                                                className={styles.iconBtn}
                                                title="Editar Empresa"
                                                onClick={() => startEditing(company)}
                                            >⚙️</button>
                                            <button
                                                className={styles.iconBtn}
                                                title="Informe de Accesos y Pagos"
                                                onClick={() => setViewingDetails(company)}
                                            >📊</button>
                                            <button
                                                className={styles.iconBtn}
                                                title="Eliminar Empresa"
                                                onClick={() => handleDeleteCompany(company.id)}
                                                style={{ color: '#ef4444', opacity: 0.8 }}
                                            >🗑️</button>
                                        </div>
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
