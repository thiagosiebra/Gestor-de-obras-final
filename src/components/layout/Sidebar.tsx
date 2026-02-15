'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/lib/context';
import styles from './Sidebar.module.css';

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { currentUser, logout } = useApp();
    const [isOpen, setIsOpen] = React.useState(false);

    // Menu items config
    const menuItems = [
        { label: 'Visión General', path: '/dashboard', icon: '📊', roles: ['admin', 'employee'] },
        { label: 'Colaboradores', path: '/colaboradores', icon: '👥', roles: ['admin'] },
        { label: 'Clientes', path: '/clientes', icon: '🏢', roles: ['admin'] },
        { label: 'Catálogo Servicios', path: '/servicios', icon: '🛠️', roles: ['admin'] },
        { label: 'Presupuestos', path: '/presupuestos', icon: '📄', roles: ['admin'] },
        { label: 'Facturas', path: '/facturas', icon: '💰', roles: ['admin'] },
        { label: 'Ingresos', path: '/ingresos', icon: '📈', roles: ['admin'] },
        { label: 'Obras', path: '/obras', icon: '🏗️', roles: ['admin', 'employee'] },
        { label: 'Stock', path: '/inventario', icon: '📦', roles: ['admin'] },
        { label: 'Provedores', path: '/provedores', icon: '🏭', roles: ['admin'] },
        { label: 'Costo y Finanzas', path: '/finanzas', icon: '📉', roles: ['admin'] },
        { label: 'Calendario', path: '/calendario', icon: '📅', roles: ['admin', 'employee'] },
        { label: 'Recompensas', path: '/recompensas', icon: '🏆', roles: ['employee'] },
        { label: 'Empresas', path: '/master/empresas', icon: '🏢', roles: ['super-admin'] },
        { label: 'Configuración', path: '/configuracion', icon: '⚙️', roles: ['admin', 'super-admin'] },
        { label: 'Mi Perfil', path: '/configuracion/perfil', icon: '👤', roles: ['admin', 'employee', 'super-admin'] },
    ];

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    const userRole = currentUser?.role || 'unassigned';

    if (!currentUser) return null;

    return (
        <>
            {/* Mobile Header / Trigger */}
            <div className={styles.mobileHeader}>
                <div className={styles.mobileLogo}>GO</div>
                <button className={styles.menuTrigger} onClick={() => setIsOpen(!isOpen)}>
                    {isOpen ? '✕' : '☰'}
                </button>
            </div>

            {/* Overlay */}
            {isOpen && <div className={styles.overlay} onClick={() => setIsOpen(false)} />}

            <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
                <div className={styles.logo}>
                    <div className={styles.logoIcon}>GO</div>
                    <span className={styles.logoText}>Gestor de Obras</span>
                </div>

                <nav className={styles.nav}>
                    {userRole === 'unassigned' && (
                        <div className={styles.unassignedWarning}>
                            ⚠️ Acceso restringido. Por favor, contacte con el administrador para que asigne su cuenta a un perfil de empleado.
                        </div>
                    )}
                    {menuItems.filter(item => item.roles.includes(userRole as any)).map((item) => (
                        <Link
                            key={item.path}
                            href={item.path}
                            className={`${styles.navItem} ${pathname.startsWith(item.path) ? styles.active : ''}`}
                            onClick={() => setIsOpen(false)}
                        >
                            <span className={styles.icon}>{item.icon}</span>
                            <span className={styles.label}>{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className={styles.footer}>
                    <div className={styles.user}>
                        <div className={styles.avatar}>{currentUser?.email?.charAt(0).toUpperCase() || 'U'}</div>
                        <div className={styles.userInfo}>
                            <span className={styles.userName}>{currentUser?.email?.split('@')[0] || 'Usuario'}</span>
                            <span className={styles.userRole}>
                                {userRole === 'super-admin' ? 'Master Admin' : userRole === 'admin' ? 'Administrador' : 'Colaborador'}
                            </span>
                        </div>
                    </div>
                    <button onClick={handleLogout} className={styles.logoutBtn} title="Cerrar Sesión">
                        <span className={styles.icon}>🚪</span>
                        <span className={styles.logoutText}>Cerrar Sesión</span>
                    </button>
                </div>
            </aside>
        </>
    );
}
