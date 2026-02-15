'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useApp } from '@/lib/context';
import styles from './page.module.css';

export default function MasterLoginPage() {
    const router = useRouter();
    const { login } = useApp();
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        const cleanEmail = email.toLowerCase().trim();

        // Direct bypass for Master Admin
        if (cleanEmail === 'admin@master.com' && password === 'master2026') {
            const success = await login(cleanEmail, password);
            if (success) {
                router.push('/master/empresas');
                return;
            }
        }

        // Standard check
        if (cleanEmail !== 'admin@master.com') {
            setError('Acceso restringido. Solo administradores de sistema.');
            setIsLoading(false);
            return;
        }

        const success = await login(cleanEmail, password);
        if (success) {
            router.push('/master/empresas');
        } else {
            setError('Credenciales incorrectas o acceso denegado.');
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.blob}></div>
            <main className={`${styles.card} glass-panel`}>
                <div className={styles.header}>
                    <div className={styles.logoBadge}>MASTER</div>
                    <h1 className={styles.title}>System Control</h1>
                    <p className={styles.subtitle}>Gestor de Obras - Multi-Company Platform</p>
                </div>

                {error && <div className={styles.errorMessage}>{error}</div>}

                <form onSubmit={handleSubmit} className={styles.form}>
                    <Input
                        id="email"
                        label="Admin Email"
                        type="email"
                        placeholder="admin@master.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <Input
                        id="password"
                        label="Master Key"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    <Button type="submit" isLoading={isLoading} className={styles.submit}>
                        Entrar al Panel de Control
                    </Button>
                </form>

                <div className={styles.footer}>
                    <p>&copy; 2026 Vilanova Digital Portfolio</p>
                </div>
            </main>
        </div>
    );
}
