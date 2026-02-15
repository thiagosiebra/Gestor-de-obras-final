import Link from 'next/link';

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div style={{
            display: 'flex',
            minHeight: '100vh',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            background: 'radial-gradient(circle at 50% 100%, hsla(222, 47%, 15%, 1), var(--bg-primary))',
        }}>
            <div style={{
                position: 'absolute',
                top: '2rem',
                left: '2rem',
            }}>
                <Link href="/" style={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    ← <span className="text-gradient">Gestor de Obras</span>
                </Link>
            </div>
            {children}
        </div>
    );
}
