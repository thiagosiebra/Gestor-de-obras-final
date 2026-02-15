'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/context';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import styles from './page.module.css';

export default function ProfilePage() {
    const { currentUser, settings, updateSettings } = useApp();
    const [isLoading, setIsLoading] = useState(false);
    const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // State for common profile data
    const [formData, setFormData] = useState({
        name: currentUser?.email?.split('@')[0] || 'Usuario',
        email: currentUser?.email || '',
        phone: settings.phone || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [businessData, setBusinessData] = useState({
        companyName: settings.companyName,
        nif: settings.nif,
        address: settings.address,
        activitySector: settings.activitySector,
        currency: settings.currency || 'EUR'
    });

    const getInitials = (email: string) => {
        return email.substring(0, 2).toUpperCase();
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMsg(null);

        // Simulate API call
        setTimeout(() => {
            setIsLoading(false);
            if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
                setMsg({ type: 'error', text: 'Las contraseñas no coinciden.' });
                return;
            }

            // Update app context settings
            if (currentUser?.role === 'admin') {
                updateSettings({
                    phone: formData.phone,
                    companyName: businessData.companyName,
                    nif: businessData.nif,
                    address: businessData.address,
                    activitySector: businessData.activitySector,
                    currency: businessData.currency
                });
            }

            setMsg({ type: 'success', text: 'Perfil y configuración actualizados correctamente.' });
            setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
        }, 1000);
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Mi Perfil</h1>
                <p className={styles.subtitle}>Gestiona tu información personal y configuración del negocio</p>
            </div>

            <div className={`glass-panel ${styles.profileCard}`}>
                <div className={styles.avatarSection}>
                    <div className={styles.avatar}>
                        {getInitials(currentUser?.email || 'User')}
                    </div>
                    <div className={styles.avatarInfo}>
                        <h2>{formData.name}</h2>
                        <span className={styles.roleBadge}>
                            {currentUser?.role === 'admin' ? 'Administrador' : 'Colaborador'}
                        </span>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className={styles.sectionTitle}>👤 Datos Personales</div>
                    <div className={styles.formGrid}>
                        <Input
                            id="name"
                            label="Nombre Completo"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                        <Input
                            id="email"
                            label="Correo Electrónico"
                            value={formData.email}
                            disabled
                        />
                        <Input
                            id="phone"
                            label="Teléfono"
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        />
                    </div>

                    {currentUser?.role === 'admin' && (
                        <div className={styles.adminExtraSection}>
                            <div className={styles.sectionTitle}>🏢 Información del Negocio</div>
                            <div className={styles.formGrid}>
                                <Input
                                    id="companyName"
                                    label="Nombre de la Empresa"
                                    value={businessData.companyName}
                                    onChange={e => setBusinessData({ ...businessData, companyName: e.target.value })}
                                />
                                <Input
                                    id="nif"
                                    label="CIF / NIF"
                                    value={businessData.nif}
                                    onChange={e => setBusinessData({ ...businessData, nif: e.target.value })}
                                />
                                <Input
                                    id="activitySector"
                                    label="Sector de Actividad"
                                    value={businessData.activitySector}
                                    onChange={e => setBusinessData({ ...businessData, activitySector: e.target.value })}
                                />
                                <div style={{ gridColumn: 'span 2' }}>
                                    <Input
                                        id="address"
                                        label="Dirección Fiscal"
                                        value={businessData.address}
                                        onChange={e => setBusinessData({ ...businessData, address: e.target.value })}
                                    />
                                </div>
                                <div className={styles.fieldWrapper}>
                                    <label className={styles.label}>Moneda Principal</label>
                                    <select
                                        className={styles.select}
                                        value={businessData.currency}
                                        onChange={e => setBusinessData({ ...businessData, currency: e.target.value })}
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                                    >
                                        <option value="EUR">Euro (€)</option>
                                        <option value="USD">Dólar ($)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className={styles.passwordSection}>
                        <div className={styles.sectionTitle}>🔒 Seguridad</div>
                        <div className={styles.formGrid}>
                            <Input
                                id="currentPass"
                                label="Contraseña Actual"
                                type="password"
                                value={formData.currentPassword}
                                onChange={e => setFormData({ ...formData, currentPassword: e.target.value })}
                            />
                            <Input
                                id="newPass"
                                label="Nueva Contraseña"
                                type="password"
                                value={formData.newPassword}
                                onChange={e => setFormData({ ...formData, newPassword: e.target.value })}
                            />
                            <Input
                                id="confirmPass"
                                label="Confirmar Contraseña"
                                type="password"
                                value={formData.confirmPassword}
                                onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className={styles.actions}>
                        {msg && (
                            <div style={{
                                color: msg.type === 'success' ? '#4ade80' : '#f87171',
                                alignSelf: 'center',
                                fontSize: '0.9rem'
                            }}>
                                {msg.text}
                            </div>
                        )}
                        <Button type="submit" isLoading={isLoading}>
                            Guardar Cambios
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
