import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { ref, onValue, set, push, remove, serverTimestamp } from 'firebase/database';

// ----------------------------------------------------
// 1. ORDER CARD KOMPONENTI (Ko'zcha funksiyasi bilan)
// ----------------------------------------------------
function OrderCard({ data, onOpenHistory }) {
  const totalAmount = data.totalRevenue || 0;
  const totalCost = Object.values(data.orders || {}).reduce((sum, o) => sum + (o.totalCost || 0), 0);
  const netProfit = totalAmount - totalCost;

  return (
    <div className="order-card" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '140px' }}>
      <div>
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginBottom: '8px' }}>{data.date}</div>
        <h3 style={{ margin: 0, fontSize: '22px', fontWeight: '500' }}>{data.orderCount || 0}ta zakaz</h3>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px' }}>
        <div style={{ color: '#51cf66', fontSize: '13px', fontWeight: '600' }}>Foyda: {netProfit.toLocaleString()}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '13px', fontWeight: '600', color: '#ffb703', background: 'rgba(255,183,3,0.08)', padding: '5px 10px', borderRadius: '8px' }}>
            {totalAmount.toLocaleString()} so'm
          </span>
          <button onClick={() => onOpenHistory(data)} style={{ background: 'none', border: '1px solid #ffb703', color: '#ffb703', width: '34px', height: '34px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👁️</button>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// 2. ASOSIY APP COMPONENT
// ----------------------------------------------------
export default function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [pastShifts, setPastShifts] = useState([]);
  const [activeShift, setActiveShift] = useState(null);
  const [menu, setMenu] = useState({ shirinliklar: [], ichimliklar: [] });
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [basket, setBasket] = useState([]); 
  const [historyView, setHistoryView] = useState(null); 
  const [editingOrderKey, setEditingOrderKey] = useState(null);

  useEffect(() => {
    onValue(ref(db, 'menu'), (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const format = (cat) => data[cat] ? Object.keys(data[cat]).map(k => ({ id: k, ...data[cat][k] })) : [];
        setMenu({ shirinliklar: format('shirinliklar'), ichimliklar: format('ichimliklar') });
      }
    });
    onValue(ref(db, 'active_shift'), (snapshot) => setActiveShift(snapshot.val()));
    onValue(ref(db, 'past_shifts'), (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map(k => ({ id: k, ...data[k] }));
        list.sort((a, b) => b.timestamp - a.timestamp);
        setPastShifts(list);
      } else { setPastShifts([]); }
    });
  }, []);

  const handleStartDay = () => {
    const today = new Date();
    const formattedDate = `${today.getDate().toString().padStart(2, '0')}.${(today.getMonth() + 1).toString().padStart(2, '0')}.${today.getFullYear()}`;
    set(ref(db, 'active_shift'), { date: formattedDate, orderCount: 0, timestamp: serverTimestamp(), orders: {} });
  };

  const handleToggleCount = (product, delta) => {
    setBasket(prev => {
      const found = prev.find(item => item.id === product.id);
      if (found) {
        const updatedQty = found.qty + delta;
        if (updatedQty <= 0) return prev.filter(item => item.id !== product.id);
        return prev.map(item => item.id === product.id ? { ...item, qty: updatedQty } : item);
      } else if (delta > 0) return [...prev, { ...product, qty: 1 }];
      return prev;
    });
  };

  const handleSaveOrder = () => {
    if (basket.length === 0) {
      if (editingOrderKey) {
        remove(ref(db, `active_shift/orders/${editingOrderKey}`));
        const currentOrders = activeShift.orders ? Object.keys(activeShift.orders).length - 1 : 0;
        set(ref(db, 'active_shift/orderCount'), currentOrders < 0 ? 0 : currentOrders);
      }
      setBasket([]); setIsMenuModalOpen(false); setEditingOrderKey(null);
      return;
    }
    const orderTotal = basket.reduce((sum, item) => sum + (Number(item.sellPrice || 0) * item.qty), 0);
    const orderCost = basket.reduce((sum, item) => sum + (Number(item.costPrice || 0) * item.qty), 0);
    const orderData = { title: editingOrderKey ? activeShift.orders[editingOrderKey].title : `${(activeShift.orders ? Object.keys(activeShift.orders).length : 0) + 1}-zakaz`, items: basket, totalPrice: orderTotal, totalCost: orderCost };
    if (editingOrderKey) { set(ref(db, `active_shift/orders/${editingOrderKey}`), orderData); }
    else { push(ref(db, 'active_shift/orders'), orderData); set(ref(db, 'active_shift/orderCount'), (activeShift.orders ? Object.keys(activeShift.orders).length : 0) + 1); }
    setBasket([]); setIsMenuModalOpen(false); setEditingOrderKey(null);
  };

  const handleEditClick = (orderKey, orderData) => { setEditingOrderKey(orderKey); setBasket(orderData.items || []); setIsMenuModalOpen(true); };

  const handleCloseDay = () => {
    if (!activeShift) return;
    if (!window.confirm("Kunni yakunlamoqchimisiz?")) return;
    let dayTotalRevenue = 0;
    if (activeShift.orders) { Object.keys(activeShift.orders).forEach(key => dayTotalRevenue += activeShift.orders[key].totalPrice || 0); }
    const archiveId = `shift_${Date.now()}`;
    set(ref(db, `past_shifts/${archiveId}`), { ...activeShift, totalRevenue: dayTotalRevenue, orders: activeShift.orders || {} }).then(() => { remove(ref(db, 'active_shift')); setActiveShift(null); });
  };

  return (
    <div className="app-wrapper">
      
      {/* YANGI TO'G'RILANGAN HEADER PANEL */}
      <header style={{ position: 'relative', textAlign: 'center', marginBottom: '30px', paddingTop: '10px' }}>
        <h1 style={{ color: '#fcd34d', fontSize: '26px', fontWeight: 'bold', margin: 0 }}>
          🍓 Choco Berry Cafe Dashboard
        </h1>
        <button 
          onClick={() => { window.location.href = '/admin'; }} // Admin sahifangiz yo'li
          style={{ 
            position: 'absolute', 
            right: '10px', 
            top: '50%', 
            transform: 'translateY(-50%)',
            background: 'rgba(252, 211, 77, 0.1)', 
            border: '1px solid #fcd34d', 
            color: '#fcd34d', 
            padding: '8px 16px', 
            borderRadius: '10px', 
            fontSize: '14px', 
            fontWeight: '500', 
            cursor: 'pointer', 
            zIndex: 999, // Boshqa elementlar ustida turishi uchun
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(252, 211, 77, 0.2)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'rgba(252, 211, 77, 0.1)'}
        >
          ⚙️ Admin Panel
        </button>
      </header>

      {/* ARXIVNI KO'RSATISH (HISTORY VIEW) */}
      {historyView ? (
        <div className="dashboard-panel">
          <button className="btn-neon" onClick={() => setHistoryView(null)}>⬅️ Orqaga</button>
          <h2>Sana: {historyView.date}</h2>
          
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '12px', marginBottom: '20px' }}>
            <div style={{ color: '#aaa' }}>Jami tushum: {historyView.totalRevenue?.toLocaleString()} so'm</div>
            <div style={{ color: '#ff4d4d' }}>Jami xarajat: {Object.values(historyView.orders || {}).reduce((sum, o) => sum + (o.totalCost || 0), 0).toLocaleString()} so'm</div>
            <div style={{ color: '#51cf66', fontWeight: 'bold', fontSize: '18px' }}>
              Sof foyda: {(historyView.totalRevenue - Object.values(historyView.orders || {}).reduce((sum, o) => sum + (o.totalCost || 0), 0)).toLocaleString()} so'm
            </div>
          </div>

          <div className="shift-orders-grid">
            {historyView.orders && Object.keys(historyView.orders).map(key => {
              const order = historyView.orders[key];
              return (
                <div key={key} className="inner-order-card" style={{ padding: '15px' }}>
                  <h4 style={{ color: '#ffb703' }}>{order.title}</h4>
                  {order.items?.map((item, i) => <div key={i}>{item.name} ({item.qty}x)</div>)}
                  <div style={{ marginTop: '10px', color: '#51cf66' }}>Foyda: {(order.totalPrice - order.totalCost).toLocaleString()} so'm</div>
                  <div style={{ fontWeight: 'bold' }}>Jami: {order.totalPrice?.toLocaleString()} so'm</div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <>
          {!activeShift && (
            <div className="dashboard-panel">
              <div className="nav-row">
                <input type="text" className="search-box-neon" placeholder="Oy bo'yicha qidirish..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                <button className="btn-neon" onClick={handleStartDay}>Kunni boshlash</button>
              </div>
              <div className="cards-grid">
                {pastShifts.filter(s => s.date.includes(searchTerm)).map(shift => (
                  <OrderCard key={shift.id} data={shift} onOpenHistory={(d) => setHistoryView(d)} />
                ))}
              </div>
            </div>
          )}
          {activeShift && (
            <div className="dashboard-panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '20px' }}>
                <h2>Sana: {activeShift.date}</h2>
                <div style={{ fontSize: '14px', color: '#ffb703', background: 'rgba(255,183,3,0.1)', padding: '6px 16px', borderRadius: '20px', fontWeight: '600' }}>Smena ochiq</div>
              </div>
              <div className="shift-orders-grid">
                {activeShift.orders && Object.keys(activeShift.orders).map(key => {
                  const order = activeShift.orders[key];
                  return (
                    <div key={key} className="inner-order-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h4 style={{ margin: 0, color: '#ffb703', fontSize: '18px' }}>{order.title}</h4>
                        <button onClick={() => handleEditClick(key, order)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#ffb703', cursor: 'pointer', borderRadius: '6px', padding: '4px 8px' }}>✏️</button>
                      </div>
                      {order.items?.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}><span>{item.name} ({item.qty}x)</span><span>{(Number(item.sellPrice || 0) * item.qty).toLocaleString()} so'm</span></div>
                      ))}
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: '15px', paddingTop: '10px', textAlign: 'right', color: '#ffb703' }}>{order.totalPrice?.toLocaleString()} so'm</div>
                    </div>
                  );
                })}
                <div className="huge-plus-card" onClick={() => { setEditingOrderKey(null); setBasket([]); setIsMenuModalOpen(true); }}>+</div>
              </div>
              <button className="btn-neon" style={{ marginTop: '40px', background: '#ffb703', color: '#000' }} onClick={handleCloseDay}>Kunni yakunlash</button>
            </div>
          )}
        </>
      )}

      {isMenuModalOpen && (
        <div className="custom-modal-backdrop">
          <div className="custom-modal-box">
             <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
              {Object.entries(menu).map(([category, products]) => (
                <div key={category} style={{ marginBottom: '22px' }}>
                  <h4 style={{ textTransform: 'uppercase', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{category}</h4>
                  {products.map(product => {
                    const qty = basket.find(item => item.id === product.id)?.qty || 0;
                    return (
                      <div key={product.id} className="menu-item-row">
                        <div><div>{product.name}</div><div style={{ color: '#ffb703' }}>{Number(product.sellPrice || 0).toLocaleString()} so'm</div></div>
                        <div className="counter-tools">
                          <button className="btn-circle" onClick={() => handleToggleCount(product, -1)}>-</button>
                          <span style={{ minWidth: '20px', textAlign: 'center' }}>{qty}</span>
                          <button className="btn-circle plus-active" onClick={() => handleToggleCount(product, 1)}>+</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            <button className="btn-neon" onClick={handleSaveOrder}>{editingOrderKey ? 'Yangilash' : "Qo'shish"}</button>
          </div>
        </div>
      )}
    </div>
  );
}