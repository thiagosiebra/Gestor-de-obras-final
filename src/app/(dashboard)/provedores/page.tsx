'use client';

import React, { useState } from 'react';
import { useApp, Provider } from '@/lib/context';
import { Button } from '@/components/ui/Button';
import styles from './page.module.css';

export default function ProvidersPage() {
    const { providers, addProvider, updateProvider, deleteProvider } = useApp();
    const [isEditing, setIsEditing] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState<Omit<Provider, 'id'>>({
        name: '',
        cif: '',
        email: '',
        phone: '',
        address: '',
        category: 'Materiales'
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEditing) {
            updateProvider(isEditing, form);
            setIsEditing(null);
        } else {
            addProvider(form);
        }
        setForm({ name: '', cif: '', email: '', phone: '', address: '', category: 'Materiales' });
        setShowForm(false);
    };

    const handleEdit = (p: Provider) => {
        setForm({ ...p });
        setIsEditing(p.id);
        setShowForm(true);
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div>
                    <h1 className={styles.title}>🏭 Provedores</h1>
                    <p className={styles.subtitle}>Gestão de fornecedores e parceiros de negócio.</p>
                </div>
                <Button onClick={() => { setShowForm(true); setIsEditing(null); }}>+ Novo Provedor</Button>
            </header>

            {showForm && (
                <div className={`${styles.formCard} glass-panel`}>
                    <h2 className={styles.sectionTitle}>{isEditing ? 'Editar Provedor' : 'Novo Provedor'}</h2>
                    <form onSubmit={handleSubmit} className={styles.formGrid}>
                        <div className={styles.formGroup}>
                            <label>Nombre / Razón Social</label>
                            <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ej: Pinturas Vilanova SL" />
                        </div>
                        <div className={styles.formGroup}>
                            <label>CIF / NIF</label>
                            <input required value={form.cif} onChange={e => setForm({ ...form, cif: e.target.value })} placeholder="B12345678" />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Email</label>
                            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="ventas@proveedor.com" />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Teléfono</label>
                            <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="912345678" />
                        </div>
                        <div className={styles.formGroup}>
                            <label>Categoría</label>
                            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                                <option value="Materiales">Materiales</option>
                                <option value="Maquinaria">Maquinaria</option>
                                <option value="Servicios">Servicios</option>
                                <option value="Logística">Logística</option>
                                <option value="Otros">Otros</option>
                            </select>
                        </div>
                        <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                            <label>Dirección</label>
                            <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Calle Comercial 123, Madrid" />
                        </div>
                        <div className={styles.formActions}>
                            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancelar</Button>
                            <Button type="submit">{isEditing ? 'Guardar Cambios' : 'Registrar Provedor'}</Button>
                        </div>
                    </form>
                </div>
            )}

            <div className={styles.tableCard}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Provedor</th>
                            <th>Categoría</th>
                            <th>Contacto</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {providers.map(p => (
                            <tr key={p.id}>
                                <td>
                                    <div className={styles.providerInfo}>
                                        <span className={styles.providerName}>{p.name}</span>
                                        <span className={styles.providerCif}>{p.cif}</span>
                                    </div>
                                </td>
                                <td><span className={styles.categoryBadge}>{p.category}</span></td>
                                <td>
                                    <div className={styles.contactInfo}>
                                        <span>📞 {p.phone || '-'}</span>
                                        <span>📧 {p.email || '-'}</span>
                                    </div>
                                </td>
                                <td>
                                    <div className={styles.actions}>
                                        <button onClick={() => handleEdit(p)} className={styles.editBtn}>✏️</button>
                                        <button onClick={() => deleteProvider(p.id)} className={styles.deleteBtn}>🗑️</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {providers.length === 0 && (
                            <tr>
                                <td colSpan={4} className={styles.empty}>No hay proveedores registrados aún.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
