'use client';
// Client creation form updated

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useApp } from '@/lib/context';
import { deduplicateAddress } from '@/lib/utils';
import styles from '../page.module.css';

export default function NewClientPage() {
    const router = useRouter();
    const { addClient } = useApp();
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        nif: '',
        contactPerson: '',
        email: '',
        phone: '',
        address: '',
        city: ''
    });

    const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await addClient({
                name: formData.name,
                nif: formData.nif,
                contactPerson: formData.contactPerson,
                email: formData.email,
                phone: formData.phone,
                address: formData.address,
                city: formData.city,
                status: 'Activo'
            });
            router.push('/clientes');
        } catch (error: any) {
            console.error('Error adding client:', error);
            alert(`Error al guardar el cliente: ${error.message || 'Error desconocido'}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container} style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className={styles.header}>
                <h1 className={styles.title}>Nuevo Cliente</h1>
                <Link href="/clientes" style={{ color: 'var(--text-secondary)' }}>
                    ← Volver a la lista
                </Link>
            </div>

            <div className={`${styles.card} glass-panel`} style={{ padding: '40px' }}>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    <h3 style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
                        Información de la Empresa / Particular
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                        <Input
                            id="name"
                            label="Nombre Fiscal / Razón Social"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                        <Input
                            id="nif"
                            label="NIF / CIF"
                            value={formData.nif}
                            onChange={handleChange}
                            required
                        />
                        <Input
                            id="contactPerson"
                            label="Persona de Contacto"
                            value={formData.contactPerson}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <h3 style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
                        Datos de Contacto
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
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
                            label="Teléfono Principal"
                            type="tel"
                            value={formData.phone}
                            onChange={handleChange}
                            required
                        />
                        <div style={{ position: 'relative' }}>
                            <label className={styles.label} style={{ marginBottom: '8px', display: 'block' }}>Dirección de Facturación (Búsqueda Google Maps)</label>
                            <div style={{ position: 'relative' }}>
                                <Input
                                    id="address"
                                    label="Buscador de Direcciones"
                                    placeholder="Escribe para buscar..."
                                    value={formData.address}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setFormData({ ...formData, address: val });
                                        if (val.length > 2) {
                                            const valLower = val.toLowerCase();
                                            let suggestions: string[] = [];

                                            const naronSuffix = '15570 Narón, A Coruña, España';
                                            const corunaSuffix = 'A Coruña, España';

                                            // Handle A Coruña and nearby areas specifically
                                            if (valLower.includes('coru') || valLower.includes('coruña') || valLower.includes('naron') || valLower.includes('ferrol')) {
                                                if (valLower.includes('naron')) {
                                                    suggestions = [
                                                        valLower.includes('naron') && valLower.includes('15570') ? val : `${val}, ${naronSuffix}`,
                                                        `Rúa da Finca Federico, 6, ${naronSuffix}`,
                                                        `Estrada de Castela, Narón, A Coruña, España`
                                                    ];
                                                } else {
                                                    suggestions = [
                                                        valLower.includes('coruña') && valLower.includes('españa') ? val : `${val}, ${corunaSuffix}`,
                                                        `Rúa de San Andrés, 15003 A Coruña, España`,
                                                        `Paseo Marítimo, 15002 A Coruña, España`,
                                                        `Avenida de la Marina, 15001 A Coruña, España`
                                                    ];
                                                }
                                            } else {
                                                suggestions = [
                                                    val.includes('España') ? val : `${val}, España`,
                                                    `${val}, A Coruña, España`,
                                                    `${val}, Madrid, España`,
                                                    `${val}, Barcelona, España`
                                                ];
                                            }
                                            setAddressSuggestions(suggestions.slice(0, 5));
                                        } else {
                                            setAddressSuggestions([]);
                                        }
                                    }}
                                />
                                {addressSuggestions.length > 0 && (
                                    <div style={{
                                        position: 'absolute', top: '100%', left: 0, right: 0,
                                        background: '#1f2937', border: '1px solid #374151',
                                        zIndex: 50, borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                                    }}>
                                        {addressSuggestions.map((s, i) => (
                                            <div
                                                key={i}
                                                onClick={() => {
                                                    let cityFound = '';
                                                    const sLower = s.toLowerCase();
                                                    if (sLower.includes('a coruña')) {
                                                        cityFound = 'A Coruña';
                                                    } else if (sLower.includes('naron')) {
                                                        cityFound = 'Narón';
                                                    } else if (sLower.includes('ferrol')) {
                                                        cityFound = 'Ferrol';
                                                    } else {
                                                        const parts = s.split(',').map(p => p.trim());
                                                        if (parts.length >= 2) {
                                                            cityFound = parts[parts.length - 2];
                                                        }
                                                    }
                                                    setFormData({ ...formData, address: deduplicateAddress(s), city: cityFound });
                                                    setAddressSuggestions([]);
                                                }}
                                                style={{
                                                    padding: '12px', cursor: 'pointer', borderBottom: '1px solid #374151',
                                                    display: 'flex', alignItems: 'center', gap: '8px'
                                                }}
                                            >
                                                <span>📍</span>
                                                {s}
                                            </div>
                                        ))}
                                        <div style={{ padding: '8px', fontSize: '0.75rem', color: '#9ca3af', textAlign: 'center', background: 'rgba(0,0,0,0.2)' }}>
                                            Powered by Google Maps (Simulado)
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <Input
                            id="city"
                            label="Ciudad / Provincia"
                            value={formData.city}
                            onChange={handleChange}
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '16px' }}>
                        <Link href="/clientes">
                            <Button type="button" variant="secondary">Cancelar</Button>
                        </Link>
                        <Button type="submit" isLoading={isLoading}>Guardar Cliente</Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
