'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useApp, StockItem } from '@/lib/context';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import styles from './page.module.css';

export default function InventoryPage() {
    const { stock, addStockItem, updateStockItem, deleteStockItem, currentUser, settings } = useApp();
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<StockItem | null>(null);

    const inventoryCategories = settings.inventoryCategories || ['Pintura', 'Herramientas', 'Disolventes', 'EPIS', 'Varios'];

    const [formData, setFormData] = useState<Omit<StockItem, 'id'>>({
        name: '',
        category: inventoryCategories[0],
        quantity: 0,
        unit: 'L',
        minStock: 5,
        lastUpdate: new Date().toISOString()
    });

    const isAdmin = currentUser?.role === 'admin';

    const categories = useMemo(() => {
        // Combinamos las configuradas con las que ya existan en stock por si acaso
        const cats = new Set([...inventoryCategories, ...stock.map(item => item.category)]);
        return ['all', ...Array.from(cats)];
    }, [stock, inventoryCategories]);

    const filteredStock = stock.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    const handleOpenModal = (item?: StockItem) => {
        if (item) {
            setEditingItem(item);
            setFormData({ ...item });
        } else {
            setEditingItem(null);
            setFormData({
                name: '',
                category: inventoryCategories[0],
                quantity: 0,
                unit: 'L',
                minStock: 5,
                lastUpdate: new Date().toISOString()
            });
        }
        setShowModal(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const data = { ...formData, lastUpdate: new Date().toISOString() };
        if (editingItem) {
            updateStockItem(editingItem.id, data);
        } else {
            addStockItem(data);
        }
        setShowModal(false);
    };

    const getStockStatus = (item: StockItem) => {
        if (item.quantity <= 0) return { label: 'Agotado', class: styles.lowStock, percent: 0 };
        if (item.quantity <= item.minStock) return { label: 'Bajo Stock', class: styles.warningStock, percent: (item.quantity / (item.minStock * 2)) * 100 };
        return { label: 'Saludable', class: styles.goodStock, percent: 100 };
    };

    const handleAdjustStock = () => {
        const adjustment = prompt('Ingrese el nombre del material a ajustar:', '');
        if (!adjustment) return;
        const item = stock.find(s => s.name.toLowerCase().includes(adjustment.toLowerCase()));
        if (!item) {
            alert('Material no encontrado');
            return;
        }
        const newQty = prompt(`Cantidad actual de ${item.name}: ${item.quantity} ${item.unit}. Ingrese la nueva cantidad real:`, item.quantity.toString());
        if (newQty !== null) {
            updateStockItem(item.id, { quantity: Number(newQty), lastUpdate: new Date().toISOString() });
            alert('Inventario ajustado correctamente.');
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>📦 Gestión de Estoque</h1>
                    <p className={styles.subtitle}>Control de pinturas, herramientas y suministros de almacén</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <Button variant="secondary" onClick={handleAdjustStock}>📋 Hacer Inventario</Button>
                    {isAdmin && (
                        <Button onClick={() => handleOpenModal()}>+ Añadir Material</Button>
                    )}
                </div>
            </div>

            <div className={styles.controls}>
                <div className={styles.searchWrapper}>
                    <Input
                        id="search"
                        label="Buscar material..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select
                    className={styles.filterSelect}
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                >
                    <option value="all">Todas las Categorías</option>
                    {categories.filter(c => c !== 'all').map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
            </div>

            {filteredStock.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '100px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '20px' }}>
                    <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>📦</span>
                    <h3>No se encontraron materiales</h3>
                    <p>Crea un nuevo ítem o ajusta los filtros de búsqueda.</p>
                </div>
            ) : (
                <div className={styles.stockGrid}>
                    {filteredStock.map(item => {
                        const status = getStockStatus(item);
                        const isLow = item.quantity <= item.minStock;

                        return (
                            <div key={item.id} className={`${styles.card} glass-panel`}>
                                {isLow && <div className={styles.warningBadge}>ALERTA</div>}
                                <div className={styles.cardHeader}>
                                    <span className={styles.category}>{item.category}</span>
                                    <span className={styles.lastUpdate}>Act: {new Date(item.lastUpdate).toLocaleDateString()}</span>
                                </div>
                                <h3 className={styles.itemName}>{item.name}</h3>
                                <div className={styles.stockLevel}>
                                    <span className={styles.quantity}>{item.quantity}</span>
                                    <span className={styles.unit}>{item.unit}</span>
                                </div>
                                <div className={styles.progressBar}>
                                    <div
                                        className={`${styles.progressFill} ${status.class}`}
                                        style={{ width: `${Math.min(status.percent, 100)}%` }}
                                    />
                                </div>
                                <div style={{ fontSize: '12px', color: isLow ? '#ff4d4d' : 'var(--text-secondary)' }}>
                                    {isLow ? `⚠️ Stock por debajo del mínimo (${item.minStock})` : `Estado: ${status.label}`}
                                </div>
                                {isAdmin && (
                                    <div className={styles.actions}>
                                        <Button variant="secondary" className={styles.actionBtn} onClick={() => handleOpenModal(item)}>Editar</Button>
                                        <Button variant="secondary" className={styles.actionBtn} style={{ color: '#ff4d4d' }} onClick={() => {
                                            if (confirm('¿Eliminar este material?')) deleteStockItem(item.id);
                                        }}>Borrar</Button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {showModal && (
                <div className={styles.modal}>
                    <div className={`${styles.modalContent} glass-panel`}>
                        <h2 className={styles.modalTitle}>{editingItem ? 'Editar Material' : 'Nuevo Material'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <Input
                                    id="name"
                                    label="Nombre del Material"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                                <div className={styles.formGrid}>
                                    <div className={styles.fieldWrapper}>
                                        <label style={{ fontSize: '14px', marginBottom: '8px', display: 'block' }}>Categoría</label>
                                        <select
                                            className={styles.filterSelect}
                                            style={{ width: '100%' }}
                                            value={formData.category}
                                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        >
                                            {inventoryCategories.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                            {/* Si hay alguna categoría en stock que no esté en settings, la añadimos */}
                                            {stock.map(i => i.category).filter(c => !inventoryCategories.includes(c)).map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className={styles.fieldWrapper}>
                                        <label style={{ fontSize: '14px', marginBottom: '8px', display: 'block' }}>Unidad</label>
                                        <select
                                            className={styles.filterSelect}
                                            style={{ width: '100%' }}
                                            value={formData.unit}
                                            onChange={e => setFormData({ ...formData, unit: e.target.value })}
                                        >
                                            <option value="L">Litros (L)</option>
                                            <option value="Kg">Kilos (Kg)</option>
                                            <option value="Unid">Unidades</option>
                                            <option value="m">Metros (m)</option>
                                        </select>
                                    </div>
                                </div>
                                <div className={styles.formGrid}>
                                    <Input
                                        id="quantity"
                                        label="Stock Actual"
                                        type="number"
                                        value={formData.quantity}
                                        onChange={e => setFormData({ ...formData, quantity: Number(e.target.value) })}
                                        required
                                    />
                                    <Input
                                        id="minStock"
                                        label="Stock Mínimo"
                                        type="number"
                                        value={formData.minStock}
                                        onChange={e => setFormData({ ...formData, minStock: Number(e.target.value) })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className={styles.modalActions}>
                                <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
                                <Button type="submit">{editingItem ? 'Actualizar' : 'Guardar'}</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
