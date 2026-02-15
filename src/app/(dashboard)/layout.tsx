import Sidebar from '@/components/layout/Sidebar';
import styles from './layout.module.css';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className={styles.wrapper}>
            <div id="sidebar-container">
                <Sidebar />
            </div>
            <main className={styles.main}>
                {children}
            </main>
        </div>
    );
}
