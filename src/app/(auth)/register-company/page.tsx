'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useApp } from '@/lib/context';
import styles from '../login/page.module.css';

export default function RegisterCompanyPage() {
    const { signUp } = useApp();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [companyName, setCompanyName] = useState('');
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

        // Register as 'admin' in metadata
        const success = await signUp(email, password, {
            full_name: companyName,
            user_role: 'admin',
            is_company: true
        });

        if (success) {
            alert('¡Empresa registrada con éxito! Ya puedes iniciar sesión como administrador.');
            router.push('/login');
        } else {
            setError('Error al registrar la empresa. Inténtelo de nuevo.');
            setIsLoading(false);
        }
    };

    return (
        <main className={`${styles.card} glass-panel`}>
            <div className={styles.header}>
                <h1 className={styles.title}>Registrar Empresa</h1>
                <p className={styles.subtitle}>Cree su cuenta de administrador y gestione su equipo.</p>
            </div>

            {error && <div className={styles.errorMessage}>{error}</div>}

            <form onSubmit={handleSubmit} className={styles.form}>
                <Input
                    id="companyName"
                    label="Nombre de la Empresa / Propietario"
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                />
                <Input
                    id="email"
                    label="Correo Electrónico Corporativo"
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
                <Input
                    id="confirm-password"
                    label="Confirmar Contraseña"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                />

                <Button type="submit" isLoading={isLoading} className={styles.submit}>
                    Dar de Alta Empresa
                </Button>
            </form>

            <div className={styles.footer}>
                <p>¿Solo eres un empleado? <Link href="/register" className={styles.link}>Crea cuenta aquí</Link></p>
            </div>
        </main>
    );
}
