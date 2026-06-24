    // src/components/OrderModal.jsx
    import React, { useState, useEffect } from 'react';
    import { db } from '../firebase';
    import { ref, onValue, push, update } from 'firebase/database';

    export default function OrderModal({ dayData, onClose }) {
    const [orders, setOrders] = useState([]);
    const [newOrderTitle, setNewOrderTitle] = useState('');
    const [newOrderPrice, setNewOrderPrice] = useState('');

    // Tanlangan kun ichidagi zakazlarni yuklash
    useEffect(() => {
        if (!dayData.id) return;
        const ordersRef = ref(db, `orders_days/${dayData.id}/orders`);
        
        const unsubscribe = onValue(ordersRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            const list = Object.keys(data).map(key => ({ id: key, ...data[key] }));
            setOrders(list);
        } else {
            setOrders([]);
        }
        });
        return () => unsubscribe();
    }, [dayData.id]);

    // Yangi zakaz qo'shish va umumiy sonni bittaga oshirish
    const handleAddOrder = async (e) => {
        e.preventDefault();
        if (!newOrderTitle || !newOrderPrice) return;

        const ordersRef = ref(db, `orders_days/${dayData.id}/orders`);
        // 1. Ichki zakazlar ro'yxatiga qo'shish
        await push(ordersRef, {
        title: newOrderTitle,
        price: Number(newOrderPrice),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });

        // 2. Tashqi kartadagi orderCount-ni yangilash
        const dayRef = ref(db, `orders_days/${dayData.id}`);
        await update(dayRef, {
        orderCount: dayData.orderCount + 1
        });

        setNewOrderTitle('');
        setNewOrderPrice('');
    };

    return (
        <div className="modal-overlay">
        <div className="modal-content">
            <div className="modal-header">
            <h2>{dayData.date} - Zakazlar ro'yxati</h2>
            <button className="btn-close" onClick={onClose}>&times;</button>
            </div>

            {/* Yangi zakaz qo'shish formasi */}
            <form onSubmit={handleAddOrder} className="modal-form">
            <input 
                type="text" 
                placeholder="Shokoladli qulupnay..." 
                value={newOrderTitle}
                onChange={(e) => setNewOrderTitle(e.target.value)}
            />
            <input 
                type="number" 
                placeholder="Narxi (so'm)" 
                value={newOrderPrice}
                onChange={(e) => setNewOrderPrice(e.target.value)}
            />
            <button type="submit">Qo'shish</button>
            </form>

            {/* Zakazlar jadvali */}
            <div className="orders-list">
            {orders.length === 0 ? (
                <p style={{ textAlign: 'center', opacity: 0.5 }}>Hozircha zakazlar yo'q</p>
            ) : (
                <table className="orders-table">
                <thead>
                    <tr>
                    <th>Vaqt</th>
                    <th>Nomi</th>
                    <th>Narxi</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map(order => (
                    <tr key={order.id}>
                        <td>{order.time}</td>
                        <td>{order.title}</td>
                        <td>{order.price.toLocaleString()} so'm</td>
                    </tr>
                    ))}
                </tbody>
                </table>
            )}
            </div>
        </div>
        </div>
    );
    }