'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useApp } from '@/lib/context';
import styles from '../login/page.module.css';

export default function RegisterEmployeePage() {
    const { signUp } = useApp();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        setIsLoading(true);
        setError('');

        // Register as 'employee' in metadata
        // Note: The context will also check the employees table by email
        const success = await signUp(email, password, {
            full_name: fullName,
            user_role: 'employee',
            is_company: false
        });

        if (success) {
            alert('¡Cuenta creada con éxito! Si tu jefe ya te ha añadido al sistema, entrarás directamente a tu panel.');
            router.push('/login');
        } else {
            setError('Error al crear la cuenta. Es posible que el correo ya esté en uso o la contraseña sea muy débil.');
            setIsLoading(false);
        }
    };

    return (
        <main className={`${styles.card} glass-panel`}>
            <div className={styles.header}>
                <h1 className={styles.title}>Registro de Colaborador</h1>
                <p className={styles.subtitle}>Crea tu cuenta para empezar a gestionar tus obras.</p>
            </div>

            {error && <div className={styles.errorMessage}>{error}</div>}

            <form onSubmit={handleSubmit} className={styles.form}>
                <Input
                    id="fullName"
                    label="Nombre Completo"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                />
                <Input
                    id="email"
                    label="Correo Electrónico"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="Usa el mismo email que le diste a tu jefe"
                />
                <Input
                    id="password"
                    label="Contraseña"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <Input
                    id="confirm-password"
                    label="Confirmar Contraseña"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                />

                <Button type="submit" isLoading={isLoading} className={styles.submit}>
                    Crear mi cuenta
                </Button>
            </form>

            <div className={styles.footer}>
                <p>¿Ya tienes cuenta? <Link href="/login" className={styles.link}>Inicia sesión</Link></p>
                <p style={{ marginTop: '10px' }}><Link href="/register-company" className={styles.link}>¿Eres dueño de empresa? Registra tu empresa aquí</Link></p>
            </div>
        </main>
    );
}
