'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/context';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Link from 'next/link';
import styles from './page.module.css';

export default function SettingsPage() {
    const { currentUser, settings, updateSettings } = useApp();
    const [localSettings, setLocalSettings] = useState(settings);
    const [isLoading, setIsLoading] = useState(false);
    const [newCategory, setNewCategory] = useState('');

    if (currentUser?.role !== 'admin') {
        return (
            <div className={styles.container} style={{ textAlign: 'center', marginTop: '100px' }}>
                <h1>Acceso Restringido</h1>
                <p>Solo los administradores pueden ver esta página.</p>
                <Link href="/configuracion/perfil">
                    <Button style={{ marginTop: '20px' }}>Ir a mi Perfil</Button>
                </Link>
            </div>
        );
    }

    const handleSave = () => {
        setIsLoading(true);
        updateSettings(localSettings);
        setTimeout(() => setIsLoading(false), 800);
    };

    const handleAddCategory = () => {
        if (!newCategory.trim()) return;
        if (localSettings.inventoryCategories.includes(newCategory.trim())) return;

        setLocalSettings({
            ...localSettings,
            inventoryCategories: [...localSettings.inventoryCategories, newCategory.trim()]
        });
        setNewCategory('');
    };

    const handleRemoveCategory = (cat: string) => {
        setLocalSettings({
            ...localSettings,
            inventoryCategories: localSettings.inventoryCategories.filter(c => c !== cat)
        });
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Configuración del Sistema</h1>
                <p className={styles.subtitle}>Gestione los datos de su empresa, numeración y categorías</p>
            </div>

            <div className={styles.sectionsGrid}>
                {/* Budget Defaults Section */}
                <div className={`glass-panel ${styles.card}`}>
                    <div className={styles.sectionTitle}>📄 Configuración de Presupuestos</div>
                    <div className={styles.logoUpload}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
                            <div className={styles.logoPreview}>
                                {localSettings.logoUrl ? (
                                    <img src={localSettings.logoUrl} alt="Logo" style={{ maxWidth: '100px', maxHeight: '100px' }} />
                                ) : (
                                    <div style={{ padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>Sin Logo</div>
                                )}
                            </div>
                            <Button variant="secondary" onClick={() => document.getElementById('logoInput')?.click()}>Subir Logo</Button>
                            <input
                                id="logoInput"
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        const reader = new FileReader();
                                        reader.onloadend = () => setLocalSettings({ ...localSettings, logoUrl: reader.result as string });
                                        reader.readAsDataURL(file);
                                    }
                                }}
                            />
                        </div>
                    </div>
                    <div className={styles.textareaGrid}>
                        <div className={styles.fieldWrapper}>
                            <label className={styles.label}>Instrucciones de Pago (Predeterminado)</label>
                            <textarea
                                className={styles.textarea}
                                value={localSettings.defaultPaymentInstructions}
                                onChange={e => setLocalSettings({ ...localSettings, defaultPaymentInstructions: e.target.value })}
                            />
                        </div>
                        <div className={styles.fieldWrapper}>
                            <label className={styles.label}>Comentarios (Predeterminado)</label>
                            <textarea
                                className={styles.textarea}
                                value={localSettings.defaultComments}
                                onChange={e => setLocalSettings({ ...localSettings, defaultComments: e.target.value })}
                            />
                        </div>
                        <div className={styles.fieldWrapper} style={{ gridColumn: 'span 2' }}>
                            <label className={styles.label}>Términos y Condiciones (Predeterminado)</label>
                            <textarea
                                className={styles.textarea}
                                value={localSettings.defaultTerms}
                                onChange={e => setLocalSettings({ ...localSettings, defaultTerms: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                {/* Numbering Management */}
                <div className={`glass-panel ${styles.card}`}>
                    <div className={styles.sectionTitle}>🔢 Numeración de Documentos</div>
                    <p className={styles.sectionNotice}>Ajuste el siguiente número correlativo para sus documentos.</p>
                    <div className={styles.formGrid}>
                        <Input
                            id="nextBudget"
                            label="Próximo Nº Presupuesto"
                            type="number"
                            value={localSettings.nextBudgetNumber.toString()}
                            onChange={e => setLocalSettings({ ...localSettings, nextBudgetNumber: parseInt(e.target.value) || 0 })}
                        />
                        <Input
                            id="nextInvoice"
                            label="Próximo Nº Factura"
                            type="number"
                            value={localSettings.nextInvoiceNumber.toString()}
                            onChange={e => setLocalSettings({ ...localSettings, nextInvoiceNumber: parseInt(e.target.value) || 0 })}
                        />
                    </div>
                </div>

                {/* Inventory Categories */}
                <div className={`glass-panel ${styles.card}`}>
                    <div className={styles.sectionTitle}>📦 Categorías de Inventario</div>
                    <div style={{ marginBottom: '20px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <Input
                                id="newCat"
                                label="Nueva Categoría"
                                placeholder="Ej: Disolventes"
                                value={newCategory}
                                onChange={e => setNewCategory(e.target.value)}
                            />
                            <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '4px' }}>
                                <Button onClick={handleAddCategory} type="button">Añadir</Button>
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {localSettings.inventoryCategories.map(cat => (
                            <div key={cat} style={{ background: 'rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                                {cat}
                                <button
                                    onClick={() => handleRemoveCategory(cat)}
                                    style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', fontWeight: 'bold' }}
                                >×</button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Admin Credentials */}
                <div className={`glass-panel ${styles.card}`}>
                    <div className={styles.sectionTitle}>🔒 Acceso Admin</div>
                    <div className={styles.formGrid}>
                        <Input
                            id="adminEmail"
                            label="Email de Login"
                            type="email"
                            value={localSettings.adminEmail}
                            onChange={e => setLocalSettings({ ...localSettings, adminEmail: e.target.value })}
                        />
                        <Input
                            id="adminPassword"
                            label="Cambiar Contraseña"
                            type="password"
                            placeholder="Dejar en blanco para no cambiar"
                            value={localSettings.adminPassword}
                            onChange={e => setLocalSettings({ ...localSettings, adminPassword: e.target.value })}
                        />
                    </div>
                </div>
            </div>

            <div className={styles.actions}>
                <Button variant="secondary" onClick={() => setLocalSettings(settings)}>Descartar</Button>
                <Button onClick={handleSave} isLoading={isLoading}>
                    Guardar Configuración
                </Button>
            </div>
        </div>
    );
}
