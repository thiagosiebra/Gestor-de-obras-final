'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useApp } from '@/lib/context';
import styles from './page.module.css';

export default function LoginPage() {
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

        const success = await login(email, password);
        if (success) {
            router.push('/dashboard');
        } else {
            setError('Credenciales incorrectas. Verifique su email y contraseña.');
            setIsLoading(false);
        }
    };

    return (
        <main className={`${styles.card} glass-panel`}>
            <div className={styles.header}>
                <h1 className={styles.title}>Bienvenido</h1>
                <p className={styles.subtitle}>Ingrese a su cuenta para gestionar sus obras.</p>
            </div>

            {error && <div className={styles.errorMessage}>{error}</div>}

            <form onSubmit={handleSubmit} className={styles.form}>
                <Input
                    id="email"
                    label="Correo Electrónico"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <Input
                    id="password"
                    label="Contraseña"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />

                <div className={styles.actions}>
                    <Link href="/forgot-password" className={styles.forgot}>
                        ¿Olvidó su contraseña?
                    </Link>
                </div>

                <Button type="submit" isLoading={isLoading} className={styles.submit}>
                    Iniciar Sesión
                </Button>
            </form>

            <div className={styles.footer}>
                <p>¿Es dueño de una empresa? <Link href="/register-company" className={styles.link}>Regístrela aquí</Link></p>
            </div>
        </main>
    );
}
