import React, { useState, useEffect, useRef } from 'react';
import { db } from './firebase';
import { ref, onValue, set, push, remove, serverTimestamp } from 'firebase/database';

// ----------------------------------------------------
// 1. ORDER CARD KOMPONENTI
// ----------------------------------------------------
function OrderCard({ data, onOpenHistory }) {
  const totalAmount = data.totalRevenue || 0;
  const totalCost = Object.values(data.orders || {}).reduce((sum, o) => sum + (o.totalCost || 0), 0);
  const netProfit = totalAmount - totalCost;

  return (
    <div className="order-card" style={{ 
      background: 'rgba(255,255,255,0.03)', 
      border: '1px solid rgba(255,255,255,0.08)', 
      borderRadius: '18px', 
      padding: '16px', 
      display: 'flex', 
      flexDirection: 'column', 
      justifyContent: 'space-between', 
      minHeight: '130px' 
    }}>
      <div>
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', marginBottom: '6px' }}>{data.date}</div>
        <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '500' }}>{data.orderCount || 0}ta zakaz</h3>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ color: '#51cf66', fontSize: '13px', fontWeight: '600' }}>Foyda: {netProfit.toLocaleString()}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: '600', color: '#ffb703', background: 'rgba(255,183,3,0.08)', padding: '4px 8px', borderRadius: '8px' }}>
            {totalAmount.toLocaleString()} so'm
          </span>
          <button onClick={() => onOpenHistory(data)} style={{ background: 'none', border: '1px solid #ffb703', color: '#ffb703', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👁️</button>
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

  const touchStartRef = useRef(0);
  const touchCurrentRef = useRef(0);
  const modalRef = useRef(null);

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

  const closeModal = () => {
    setIsMenuModalOpen(false);
    setEditingOrderKey(null);
    setBasket([]);
  };

  const handleTouchStart = (e) => { touchStartRef.current = e.touches[0].clientY; };
  const handleTouchMove = (e) => {
    const currentY = e.touches[0].clientY;
    touchCurrentRef.current = currentY;
    const deltaY = currentY - touchStartRef.current;
    if (deltaY > 0 && modalRef.current) {
      modalRef.current.style.transform = `translateY(${deltaY}px)`;
      modalRef.current.style.transition = 'none';
    }
  };
  const handleTouchEnd = () => {
    const deltaY = touchCurrentRef.current - touchStartRef.current;
    if (modalRef.current) {
      if (deltaY > 100 && touchCurrentRef.current !== 0) { closeModal(); } 
      else { modalRef.current.style.transform = 'translateY(0)'; modalRef.current.style.transition = 'transform 0.3s ease-out'; }
    }
    touchStartRef.current = 0; touchCurrentRef.current = 0;
  };

  return (
    <div className="app-wrapper" style={{ padding: '10px', maxWidth: '1200px', margin: '0 auto' }}>
      
      <header className="app-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', marginBottom: '20px', paddingTop: '10px' }}>
        <h1 style={{ color: '#fcd34d', fontSize: '22px', fontWeight: 'bold', margin: 0, textAlign: 'center' }}>🍓 Choco Berry Dashboard</h1>
        <button onClick={() => { window.location.href = '/adminpanel'; }} style={{ background: 'rgba(252, 211, 77, 0.1)', border: '1px solid #fcd34d', color: '#fcd34d', padding: '8px 16px', borderRadius: '10px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', width: 'fit-content' }}>⚙️ Admin Panel</button>
      </header>

      {historyView ? (
        <div className="dashboard-panel">
          <button className="btn-neon" onClick={() => setHistoryView(null)}>⬅️ Orqaga</button>
          <h2 style={{ fontSize: '18px', margin: '15px 0' }}>Sana: {historyView.date}</h2>
          
          <div style={{ background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '12px', marginBottom: '20px', fontSize: '14px' }}>
            <div style={{ color: '#aaa', marginBottom: '4px' }}>Jami tushum: {historyView.totalRevenue?.toLocaleString()} so'm</div>
            <div style={{ color: '#ff4d4d', marginBottom: '4px' }}>Jami xarajat: {Object.values(historyView.orders || {}).reduce((sum, o) => sum + (o.totalCost || 0), 0).toLocaleString()} so'm</div>
            <div style={{ color: '#51cf66', fontWeight: 'bold', fontSize: '16px', marginTop: '8px' }}>Sof foyda: {(historyView.totalRevenue - Object.values(historyView.orders || {}).reduce((sum, o) => sum + (o.totalCost || 0), 0)).toLocaleString()} so'm</div>
          </div>

          <div className="shift-orders-grid">
            {historyView.orders && Object.keys(historyView.orders).map(key => {
              const order = historyView.orders[key];
              return (
                <div key={key} className="inner-order-card" style={{ padding: '15px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <h4 style={{ color: '#ffb703', margin: '0 0 10px 0' }}>{order.title}</h4>
                  {order.items?.map((item, i) => <div key={i} style={{ fontSize: '13px', color: '#ddd' }}>{item.name} ({item.qty}x)</div>)}
                  <div style={{ marginTop: '10px', color: '#51cf66', fontSize: '13px' }}>Foyda: {(order.totalPrice - order.totalCost).toLocaleString()} so'm</div>
                  <div style={{ fontWeight: 'bold', fontSize: '14px', marginTop: '4px' }}>Jami: {order.totalPrice?.toLocaleString()} so'm</div>
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
                <input type="text" className="search-box-neon" placeholder="Oy bo'yicha qidirish..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '100%', boxSizing: 'border-box' }} />
                <button className="btn-neon" onClick={handleStartDay} style={{ width: '100%' }}>Kunni boshlash</button>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
                <h2 style={{ margin: 0, fontSize: '18px' }}>Sana: {activeShift.date}</h2>
                <div style={{ fontSize: '12px', color: '#ffb703', background: 'rgba(255,183,3,0.1)', padding: '4px 12px', borderRadius: '20px', fontWeight: '600' }}>Smena ochiq</div>
              </div>
              
              <div className="shift-orders-grid" style={{ marginTop: '20px' }}>
                {activeShift.orders && Object.keys(activeShift.orders).map(key => {
                  const order = activeShift.orders[key];
                  return (
                    <div key={key} className="inner-order-card" style={{ padding: '15px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h4 style={{ margin: 0, color: '#ffb703', fontSize: '16px' }}>{order.title}</h4>
                        <button onClick={() => handleEditClick(key, order)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#ffb703', cursor: 'pointer', borderRadius: '6px', padding: '4px 8px' }}>✏️</button>
                      </div>
                      {order.items?.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                          <span>{item.name} ({item.qty}x)</span>
                          <span style={{ color: '#aaa' }}>{(Number(item.sellPrice || 0) * item.qty).toLocaleString()} so'm</span>
                        </div>
                      ))}
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: '12px', paddingTop: '8px', textAlign: 'right', color: '#ffb703', fontWeight: 'bold' }}>{order.totalPrice?.toLocaleString()} so'm</div>
                    </div>
                  );
                })}
                <div className="huge-plus-card" onClick={() => { setEditingOrderKey(null); setBasket([]); setIsMenuModalOpen(true); }} style={{ minHeight: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', border: '2px dashed rgba(255,255,255,0.15)', borderRadius: '12px', cursor: 'pointer' }}>+</div>
              </div>
              <button className="btn-neon" style={{ marginTop: '30px', background: '#ffb703', color: '#000', width: '100%' }} onClick={handleCloseDay}>Kunni yakunlash</button>
            </div>
          )}
        </>
      )}


{isMenuModalOpen && (
  <div 
    className="custom-modal-backdrop" 
    onClick={() => { setSearchTerm(''); closeModal(); }} /* 👈 Oyna yopilganda qidiruv matni ham tozalanadi */
    style={{ 
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
      background: 'rgba(0,0,0,0.75)', display: 'flex', 
      alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '12px' 
    }}
  >
    <div 
      ref={modalRef}
      className="custom-modal-box glass-effect" 
      onClick={(e) => e.stopPropagation()} 
      style={{ 
        background: '#16161a', border: '1px solid rgba(255,255,255,0.08)', 
        borderRadius: '20px', padding: '18px', width: '100%', maxWidth: '440px', 
        boxSizing: 'border-box', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
      }}
    >
      {/* 📱 Sensorli yopish chiziqchasi */}
      <div 
        className="modal-swipe-handle"
        onClick={() => { setSearchTerm(''); closeModal(); }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ 
          width: '45px', height: '6px', background: 'rgba(255,255,255,0.15)', 
          borderRadius: '10px', margin: '-8px auto 14px auto', cursor: 'pointer' 
        }}
      />

      {/* 🔍 Jonli Qidiruv Qatori */}
      <div style={{ position: 'relative', marginBottom: '16px' }}>
        <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.3)', fontSize: '15px' }}>🔍</span>
        <input 
          type="text"
          placeholder="Mahsulot qidirish..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ 
            width: '100%', boxSizing: 'border-box', padding: '11px 12px 11px 36px', 
            borderRadius: '12px', background: 'rgba(255,255,255,0.04)', 
            border: '1px solid rgba(255,255,255,0.08)', color: '#fff', 
            fontSize: '14px', outline: 'none', transition: 'all 0.2s'
          }}
          onFocus={(e) => e.target.style.borderColor = '#ffb703'}
          onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
        />
        {searchTerm && (
          <button 
            onClick={() => setSearchTerm('')}
            style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '14px' }}
          >
            ✕
          </button>
        )}
      </div>

      {/* 🍰 Mahsulotlar Ro'yxati */}
      <div style={{ maxHeight: '55vh', overflowY: 'auto', marginBottom: '16px', paddingRight: '2px' }}>
        {Object.entries(menu).map(([category, products]) => {
          
          {/* ✨ Katta va kichik harflarni bir xil qiluvchi asosiy filtr qismi */}
          const filteredProducts = products.filter(p => 
            p.name && p.name.toLowerCase().includes(searchTerm.toLowerCase())
          );

          if (filteredProducts.length === 0) return null;

          return (
            <div key={category} style={{ marginBottom: '16px' }}>
              <h4 style={{ textTransform: 'uppercase', fontSize: '11px', color: '#ffb703', margin: '0 0 10px 4px', letterSpacing: '1.5px', fontWeight: '600', opacity: 0.85 }}>
                {category}
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {filteredProducts.map(product => {
                  const qty = basket.find(item => item.id === product.id)?.qty || 0;
                  return (
                    <div 
                      key={product.id} 
                      className="menu-item-row" 
                      style={{ 
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                        padding: '12px', background: 'rgba(255,255,255,0.02)', 
                        border: '1px solid rgba(255,255,255,0.04)', borderRadius: '12px'
                      }}
                    >
                      <div style={{ flex: 1, paddingRight: '12px' }}>
                        <div style={{ fontSize: '14px', color: '#f8f9fa', fontWeight: '500', marginBottom: '3px', textTransform: 'capitalize' }}>
                          {product.name}
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', fontWeight: '500' }}>
                          {Number(product.sellPrice || 0).toLocaleString()} so'm
                        </div>
                      </div>

                      {/* Tugmalar paneli */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(0,0,0,0.2)', padding: '4px 6px', borderRadius: '25px', border: '1px solid rgba(255,255,255,0.03)' }}>
                        <button 
                          className="btn-circle" 
                          onClick={() => handleToggleCount(product, -1)} 
                          style={{ 
                            width: '28px', height: '28px', borderRadius: '50%', border: 'none', 
                            background: qty > 0 ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)', 
                            color: qty > 0 ? '#fff' : 'rgba(255,255,255,0.2)', cursor: qty > 0 ? 'pointer' : 'default',
                            fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}
                          disabled={qty === 0}
                        >
                          -
                        </button>
                        <span style={{ minWidth: '18px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: qty > 0 ? '#ffb703' : '#666' }}>
                          {qty}
                        </span>
                        <button 
                          className="btn-circle plus-active" 
                          onClick={() => handleToggleCount(product, 1)} 
                          style={{ 
                            width: '28px', height: '28px', borderRadius: '50%', border: 'none', 
                            background: '#ffb703', color: '#000', cursor: 'pointer', 
                            fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Saqlash tugmasi */}
      <button 
        className="btn-neon" 
        onClick={() => { setSearchTerm(''); handleSaveOrder(); }} 
        style={{ 
          width: '100%', padding: '13px', borderRadius: '12px', 
          background: '#ffb703', color: '#000', border: 'none', 
          fontSize: '15px', fontWeight: '700', cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(255,183,3,0.2)'
        }}
      >
        {editingOrderKey ? 'Savatni Yangilash' : "Buyurtmaga Qo'shish"}
      </button>
    </div>
  </div>
)}
    </div>
  );
}