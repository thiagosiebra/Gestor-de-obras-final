'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useApp } from '@/lib/context';
import styles from './page.module.css';

export default function ClientsPage() {
    const { clients } = useApp(); // Use context
    const [searchTerm, setSearchTerm] = useState('');

    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Clientes</h1>
                    <p className={styles.subtitle}>Gestión de relaciones y contratos</p>
                </div>
                <Link href="/clientes/novo">
                    <Button>+ Nuevo Cliente</Button>
                </Link>
            </div>

            <div className={styles.controls}>
                <div className={styles.searchWrapper}>
                    <Input
                        id="search"
                        label="Buscar cliente o contacto..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className={styles.grid}>
                {filteredClients.map((client) => (
                    <div key={client.id} className={`${styles.card} glass-panel`}>
                        <div className={styles.cardHeader}>
                            <div className={styles.avatar}>{client.name.charAt(0)}</div>
                            <div>
                                <h3 className={styles.name}>{client.name}</h3>
                                <p className={styles.contact}>Contacto: {client.contactPerson}</p>
                            </div>
                        </div>

                        <div className={styles.cardInfo}>
                            <div className={styles.infoRow}>
                                <span>Estado:</span>
                                <span className={`${styles.status} ${styles[client.status.toLowerCase()]}`}>
                                    {client.status}
                                </span>
                            </div>
                            <div className={styles.infoRow}>
                                <span>Teléfono:</span>
                                <span>{client.phone}</span>
                            </div>
                            <div className={styles.infoRow}>
                                <span>NIF/CIF:</span>
                                <span>{client.nif}</span>
                            </div>
                        </div>

                        <div className={styles.actions}>
                            <Link href={`/clientes/${client.id}`}>
                                <Button variant="secondary" className={styles.actionBtn}>Ver Detalles</Button>
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
