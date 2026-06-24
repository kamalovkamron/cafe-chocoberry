// src/pages/DayDetailsPage.jsx ning eng tepasi:
import React, { useState, useEffect } from 'react';
import { db } from '../firebase'; // 👈 Bu yerda esa ikkita nuqta to'g'ri!
import { ref, onValue, push, update } from 'firebase/database';

export default function DayDetailsPage({ dayData, onBack }) {
  const [orders, setOrders] = useState([]);
  const [newOrderTitle, setNewOrderTitle] = useState('');
  const [newOrderPrice, setNewOrderPrice] = useState('');

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

  const handleAddOrder = async (e) => {
    e.preventDefault();
    if (!newOrderTitle || !newOrderPrice) return;

    const ordersRef = ref(db, `orders_days/${dayData.id}/orders`);
    await push(ordersRef, {
      title: newOrderTitle,
      price: Number(newOrderPrice),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    const dayRef = ref(db, `orders_days/${dayData.id}`);
    await update(dayRef, {
      orderCount: dayData.orderCount + 1
    });

    setNewOrderTitle('');
    setNewOrderPrice('');
  };

  return (
    <div className="dashboard-container" style={{ marginTop: '20px', maxWidth: '800px' }}>
      {/* Orqaga qaytish tugmasi */}
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#ffb703', cursor: 'pointer', fontSize: '16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '5px' }}>
        ⬅ Orqaga qaytish (Dashboard)
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h2 style={{ margin: 0 }}>Sana: {dayData.date}</h2>
        <span style={{ background: '#a82431', padding: '6px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold' }}>
          {dayData.orderCount} ta buyurtma
        </span>
      </div>

      {/* Yangi zakaz qo'shish paneli */}
      <form onSubmit={handleAddOrder} className="modal-form" style={{ marginBottom: '30px' }}>
        <input 
          type="text" 
          placeholder="Buyurtma nomi (masalan: Shokoladli Qulupnay)..." 
          value={newOrderTitle}
          onChange={(e) => setNewOrderTitle(e.target.value)}
        />
        <input 
          type="number" 
          placeholder="Narxi..." 
          value={newOrderPrice}
          onChange={(e) => setNewOrderPrice(e.target.value)}
        />
        <button type="submit" className="btn-start-day">Qo'shish</button>
      </form>

      {/* Zakazlar Ro'yxati */}
      <div>
        <h3 style={{ color: '#ffb703', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>Bugungi buyurtmalar</h3>
        {orders.length === 0 ? (
          <p style={{ opacity: 0.5, textAlign: 'center', padding: '40px 0' }}>Hozircha buyurtmalar kiritilmadi.</p>
        ) : (
          <table className="orders-table">
            <thead>
              <tr>
                <th>Vaqt</th>
                <th>Buyurtma nomi</th>
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
  );
}