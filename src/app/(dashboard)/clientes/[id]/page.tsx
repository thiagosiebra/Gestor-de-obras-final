'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useApp } from '@/lib/context';
import { deduplicateAddress } from '@/lib/utils';
import styles from './page.module.css';

export default function ClientDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const { clients, updateClient } = useApp();
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        nif: '',
        contactPerson: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        status: ''
    });

    const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);

    useEffect(() => {
        if (params.id) {
            const client = clients.find(c => c.id === params.id);
            if (client) {
                setFormData({
                    name: client.name,
                    nif: client.nif,
                    contactPerson: client.contactPerson,
                    email: client.email,
                    phone: client.phone,
                    address: client.address || '',
                    city: client.city || '',
                    status: client.status
                });
            } else {
                router.push('/clientes');
            }
        }
    }, [params.id, clients, router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        setTimeout(() => {
            if (typeof params.id === 'string') {
                updateClient(params.id, formData as any);
            }
            setIsLoading(false);
            router.push('/clientes');
        }, 500);
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Editar Cliente</h1>
                <Link href="/clientes" style={{ color: 'var(--text-secondary)' }}>
                    ← Volver a la lista
                </Link>
            </div>

            <div className={`${styles.card} glass-panel`}>
                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.grid}>
                        <Input
                            id="name"
                            label="Razón Social / Nombre"
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
                        <div style={{ position: 'relative' }}>
                            <label className={styles.label} style={{ marginBottom: '8px', display: 'block' }}>Dirección (Búsqueda Google Maps)</label>
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
                                            setAddressSuggestions(suggestions.slice(0, 4));
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
                                    </div>
                                )}
                            </div>
                        </div>

                        <Input
                            id="city"
                            label="Ciudad"
                            value={formData.city}
                            onChange={handleChange}
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
                                <option value="Potencial">Potencial</option>
                                <option value="Finalizado">Finalizado</option>
                            </select>
                        </div>
                    </div>

                    <div className={styles.actions}>
                        <Link href="/clientes">
                            <Button type="button" variant="secondary">Cancelar</Button>
                        </Link>
                        <Button type="submit" isLoading={isLoading}>Guardar Cambios</Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
