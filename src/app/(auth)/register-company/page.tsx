'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useApp } from '@/lib/context';
import styles from '../login/page.module.css';

function RegisterCompanyContent() {
    const { signUp } = useApp();
    const router = useRouter();
    const searchParams = useSearchParams();
    const plan = searchParams.get('plan') || 'pro'; // Default to pro if nothing selected

    const [isLoading, setIsLoading] = useState(false);
    const [companyName, setCompanyName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    const getMonthlyPrice = (p: string) => {
        if (p === 'autonomo') return 19.90;
        if (p === 'pro') return 39.90;
        if (p === 'enterprise') return 99.90;
        return 39.90;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        setIsLoading(true);
        setError('');

        // Register as 'admin' in metadata with plan info
        const result = await signUp(email, password, {
            full_name: companyName,
            user_role: 'admin',
            is_company: true,
            plan_type: plan,
            monthly_price: getMonthlyPrice(plan)
        });

        if (result.success) {
            alert('¡Empresa registrada con éxito! Ya puedes iniciar sesión como administrador.');
            router.push('/login');
        } else {
            setError(result.error || 'Error al registrar la empresa. Inténtelo de nuevo.');
            setIsLoading(false);
        }
    };

    return (
        <main className={`${styles.card} glass-panel`}>
            <div className={styles.header}>
                <h1 className={styles.title}>Registrar Empresa</h1>
                <p className={styles.subtitle}>Cree su cuenta de administrador y gestione su equipo.</p>
                {plan && <p className={styles.subtitle} style={{ color: '#3b82f6', fontWeight: 600 }}>Plan seleccionado: {plan.toUpperCase()}</p>}
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

export default function RegisterCompanyPage() {
    return (
        <Suspense fallback={<div className="p-20 text-center">Cargando formulario...</div>}>
            <RegisterCompanyContent />
        </Suspense>
    );
}
