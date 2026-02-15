'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterRedirect() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/register-company');
    }, [router]);

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            background: '#0a0a0c',
            color: 'white',
            fontFamily: 'sans-serif'
        }}>
            Redirigiendo al registro de empresas...
        </div>
    );
}
