'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useApp } from '@/lib/context';
import styles from '../login/page.module.css';

export default function ForgotPasswordPage() {
    const { recoverPassword } = useApp();
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            await recoverPassword(email);
            setSuccess(true);
        } catch (err) {
            setError('Error al enviar el correo de recuperación. Verifique el email.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className={`${styles.card} glass-panel`}>
            <div className={styles.header}>
                <h1 className={styles.title}>Recuperar Contraseña</h1>
                <p className={styles.subtitle}>Le enviaremos un enlace para restablecer su contraseña.</p>
            </div>

            {success ? (
                <div className={styles.successMessage}>
                    <p>Enviado. Revise su bandeja de entrada (y la carpeta de spam).</p>
                    <Link href="/login">
                        <Button className={styles.submit}>Volver al Login</Button>
                    </Link>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className={styles.form}>
                    {error && <div className={styles.errorMessage}>{error}</div>}
                    <Input
                        id="email"
                        label="Correo Electrónico"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    <Button type="submit" isLoading={isLoading} className={styles.submit}>
                        Enviar Enlace
                    </Button>

                    <div className={styles.footer}>
                        <Link href="/login" className={styles.link}>Volver al inicio de sesión</Link>
                    </div>
                </form>
            )}
        </main>
    );
}
