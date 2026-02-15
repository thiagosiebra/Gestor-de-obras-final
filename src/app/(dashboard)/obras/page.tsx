'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useApp } from '@/lib/context';
import styles from './page.module.css';

export default function WorksPage() {
    const { works, clients, currentUser } = useApp();
    const [searchTerm, setSearchTerm] = useState('');
    const isAdmin = currentUser?.role === 'admin';

    const filteredWorks = works.filter(work => {
        const clientName = clients.find(c => c.id === work.clientId)?.name || 'Cliente Desconocido';
        return work.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            clientName.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const getClientName = (id: string) => {
        const client = clients.find(c => c.id === id);
        return client ? client.name : 'Sin asignar';
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Obras y Proyectos</h1>
                    <p className={styles.subtitle}>Supervisión de trabajos en curso</p>
                </div>
                {isAdmin && (
                    <Link href="/obras/nova">
                        <Button>+ Nueva Obra</Button>
                    </Link>
                )}
            </div>

            <div className={styles.controls}>
                <div className={styles.searchWrapper}>
                    <Input
                        id="search"
                        label="Buscar obra o cliente..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className={styles.grid}>
                {filteredWorks.map((work) => (
                    <div key={work.id} className={`${styles.card} glass-panel`}>
                        <div className={styles.cardHeader}>
                            <div className={styles.icon}>🏗️</div>
                            <div>
                                <h3 className={styles.titleCard}>{work.title}</h3>
                                <p className={styles.client}>{getClientName(work.clientId)}</p>
                            </div>
                        </div>

                        <div className={styles.cardInfo}>
                            <div className={styles.infoRow}>
                                <span>Estado:</span>
                                <span className={`${styles.status} ${styles[work.status.replace(' ', '').toLowerCase()]}`}>
                                    {work.status}
                                </span>
                            </div>
                            <div className={styles.infoRow}>
                                <span>Inicio:</span>
                                <span>{new Date(work.startDate).toLocaleDateString('es-ES')}</span>
                            </div>
                            <div className={styles.infoRow}>
                                <span>Fin Previsto:</span>
                                <span>{new Date(work.endDate).toLocaleDateString('es-ES')}</span>
                            </div>

                            <div className={styles.progressWrapper}>
                                <div className={styles.progressHeader}>
                                    <span>Progreso</span>
                                    <span>{work.progress}%</span>
                                </div>
                                <div className={styles.progressBar}>
                                    <div
                                        className={styles.progressFill}
                                        style={{ width: `${work.progress}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        <div className={styles.actions}>
                            <Link href={`/obras/${work.id}`} style={{ width: '100%' }}>
                                <Button variant="secondary" className={styles.actionBtn}>
                                    {isAdmin ? 'Gestionar' : 'Ver Tareas'}
                                </Button>
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
