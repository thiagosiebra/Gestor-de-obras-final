'use client';

import React from 'react';
import Link from 'next/link';
import styles from './page.module.css';

export default function Home() {
  return (
    <main className={styles.main}>
      {/* Navbar */}
      <nav className={styles.navbar}>
        <div className={styles.logo}>
          <img src="/app_logo.png" alt="Logo" className={styles.logoImage} />
          <span className={styles.logoText}>GESTOR DE OBRAS</span>
        </div>
        <div className={styles.navLinks}>
          <Link href="/login" className={styles.loginLink}>Login Empresa</Link>
          <Link href="/master/login">
            <button className={styles.masterButtonSmall}>
              Admin Master
            </button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroBackground}></div>
        <span className={styles.sectionLabel}>Lanzamiento oficial 2026</span>
        <h1 className={styles.title}>
          Un Solo Lugar para <span className="text-gradient">Dominar</span> tus Obras
        </h1>
        <p className={styles.subtitle}>
          Deja de perseguir prestadores y perder dinero en materiales.
          El primer sistema diseñado por quem vive obra 100% do dia.
        </p>
        <div className={styles.ctaGroup}>
          <Link href="/login">
            <button className={styles.ctaButton}>Login Empresa</button>
          </Link>
          <Link href="/master/login">
            <button className={`${styles.ctaButton} ${styles.masterButton}`}>Acesso Admin Master</button>
          </Link>
        </div>

        <div className={styles.heroImageWrapper}>
          <img src="/landing_dashboard.png" alt="Plataforma Gestor de Obras" className={styles.heroImage} />
        </div>
      </section>

      {/* The Big Difference */}
      <section className={styles.comparison}>
        <div style={{ textAlign: 'center', marginBottom: '80px' }}>
          <span className={styles.sectionLabel}>Comparativa Profesional</span>
          <h2 className={styles.sectionTitle}>¿Por qué nosotros somos diferentes?</h2>
        </div>

        <div className={styles.compareGrid}>
          <div className={`${styles.compareCard} ${styles.bad}`}>
            <div className={styles.compareHeader}>❌ El "Caos" Tradicional</div>
            <ul className={styles.compareList}>
              <li>⚠️ <strong>App Genéricas:</strong> Solo sirven para anotar cosas, no entienden la rutina de una obra.</li>
              <li>⚠️ <strong>Pérdida de Información:</strong> Fotos perdidas en WhatsApp y falta de control de stock.</li>
              <li>⚠️ <strong>Falta de Motivación:</strong> Equipos que trabajan sin objetivos claros ni incentivos.</li>
              <li>⚠️ <strong>Cobrartes Difíciles:</strong> No sabes cuánto se ha cobrado realmente hasta final de mes.</li>
            </ul>
          </div>
          <div className={`${styles.compareCard} ${styles.good}`}>
            <div className={styles.compareHeader}>✅ El "Efecto" Vilanova Pinturas</div>
            <ul className={styles.compareList}>
              <li>🚀 <strong>Fichaje Fotográfico:</strong> Cada tarea requiere prueba visual. Sin foto, no hay validación.</li>
              <li>🚀 <strong>Game-Changing Rewards:</strong> Sistema de puntos que los empleados aman y que acelera la entrega.</li>
              <li>🚀 <strong>Ciclo 1-Click:</strong> Presupuesto &rarr; Obra &rarr; Factura. Todo sincronizado al segundo.</li>
              <li>🚀 <strong>Control de Cobros:</strong> Monitoreo en tiempo real de pagos y deudas pendientes.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Why for Workers */}
      <section className={styles.why}>
        <div className={styles.whyContent}>
          <span className={styles.sectionLabel}>Para tus Colaboradores</span>
          <h2 className={styles.sectionTitle}>Tus colaboradores serán más productivos que nunca</h2>
          <p className={styles.subtitle}>
            No es solo control, es motivación. Con nuestra App de Colaboradores, tus empleados:
          </p>
          <ul className={styles.compareList}>
            <li>💰 Ganan puntos por cada tarea validada.</li>
            <li>📅 Tienen su calendario de visitas siempre actualizado.</li>
            <li>📸 Reportan gastos y tickets con una simple foto.</li>
            <li>🏆 Participan en el Ranking semanal de eficiencia.</li>
          </ul>
          <Button className={styles.whyButton} onClick={() => window.location.href = '/login'}>Ver App de Empleados</Button>
        </div>
        <div className={styles.whyImage}>
          <img src="/landing_worker.png" alt="Worker Mobile App" className={styles.featureImage} />
        </div>
      </section>

      {/* Final CTA */}
      <section className={styles.finalCta}>
        <h2 className={styles.sectionTitleLarge}>¿Listo para llevar tu empresa al 2026?</h2>
        <p className={styles.subtitle}>
          Únete a los profesionales que ya no usan papel ni excels infinitos.
        </p>
        <Link href="/register-company">
          <button className={styles.ctaButtonLarge}>
            Quiero mi Cuenta Ahora
          </button>
        </Link>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>© 2026 GESTOR DE OBRAS. Todos los derechos reservados.</p>
        <p className={styles.footerSub}>Diseñado con ❤️ por quien vive la obra.</p>
      </footer>
    </main>
  );
}

const Button = ({ children, className, onClick }: any) => (
  <button className={`${styles.ctaButton} ${className}`} onClick={onClick}>
    {children}
  </button>
);
