import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { ref, onValue, push, update, remove } from 'firebase/database';
import { Link } from 'react-router-dom';
import './App.css';

export default function AdminPanel() {
  const [menu, setMenu] = useState({ shirinliklar: {}, ichimliklar: {} });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editData, setEditData] = useState({ id: null, cat: '', name: '', costPrice: '', sellPrice: '' });

  useEffect(() => {
    onValue(ref(db, 'menu'), (snapshot) => {
      setMenu(snapshot.val() || { shirinliklar: {}, ichimliklar: {} });
    });
  }, []);

  const handleSave = () => {
    if (!editData.name || !editData.costPrice || !editData.sellPrice) 
      return alert("Barcha maydonlarni to'ldiring!");
    
    const itemData = { 
      name: editData.name, 
      costPrice: Number(editData.costPrice), 
      sellPrice: Number(editData.sellPrice) 
    };
    
    if (editData.id) {
      update(ref(db, `menu/${editData.cat}/${editData.id}`), itemData);
    } else {
      push(ref(db, `menu/${editData.cat}`), itemData);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (cat, id) => {
    if (window.confirm("O'chirmoqchimisiz?")) remove(ref(db, `menu/${cat}/${id}`));
  };

  return (
    <div className="app-wrapper admin-container" style={{ padding: '16px', color: '#fff', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* HEADER: Mobil va Kompyuter uchun moslashuvchan panel */}
      <div className="admin-header" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '30px',
        gap: '15px',
        flexWrap: 'wrap' /* Mobil qurilmada tugma pastga tushadi */
      }}>
        <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold' }}>Admin Panel</h1>
        <Link to="/" className="btn-neon" style={{ textDecoration: 'none', textAlign: 'center' }}>⬅ Dashboard</Link>
      </div>

      {['shirinliklar', 'ichimliklar'].map(cat => (
        <div key={cat} className="category-section" style={{ marginBottom: '35px' }}>
          <h2 style={{ textTransform: 'capitalize', color: '#ffb703', fontSize: '20px', marginBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
            {cat}
          </h2>
          
          {/* Mahsulotlar konteyneri */}
          <div className="menu-items-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {Object.entries(menu[cat] || {}).map(([id, item]) => (
              <div key={id} className="menu-item-card" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '12px',
                padding: '12px 16px',
                gap: '15px'
              }}>
                {/* Matnli qism: ichki stillar klasslar orqali mobilbop qilinadi */}
                <div className="menu-item-info" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span className="item-name" style={{ fontWeight: '500', fontSize: '16px', color: '#fff' }}>{item.name}</span>
                  <div className="item-prices" style={{ fontSize: '13px', color: '#aaa' }}>
                    <span style={{ color: '#51cf66', fontWeight: '600' }}>Sotilishi: {item.sellPrice?.toLocaleString()} so'm</span>
                    <span style={{ margin: '0 8px', color: 'rgba(255,255,255,0.2)' }}>|</span>
                    <span>Asl narxi: {item.costPrice?.toLocaleString()} so'm</span>
                  </div>
                </div>

                {/* Amal tugmalari */}
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  <button className="action-btn" onClick={() => { setEditData({ id, cat, ...item }); setIsModalOpen(true); }} style={{ padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}>✏️</button>
                  <button className="action-btn" onClick={() => handleDelete(cat, id)} style={{ padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', background: 'rgba(255,77,77,0.1)', border: '1px solid rgba(255,77,77,0.2)', color: '#ff4d4d' }}>🗑️</button>
                </div>
              </div>
            ))}
          </div>

          <button className="add-btn" onClick={() => { setEditData({ id: null, cat, name: '', costPrice: '', sellPrice: '' }); setIsModalOpen(true); }} style={{
            marginTop: '15px',
            width: '100%',
            padding: '12px',
            borderRadius: '10px',
            background: 'rgba(255,183,3,0.1)',
            border: '1px dashed #ffb703',
            color: '#ffb703',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}>
            + Yangi mahsulot qo'shish
          </button>
        </div>
      ))}

      {/* MODAL OYNA: Telefon ekraniga to'liq moslashadigan qismi */}
{isModalOpen && (
        <div 
          className="custom-modal-backdrop" 
          onClick={() => setIsModalOpen(false)} /* 👈 Qora fonga (tashqarisiga) bosganda yopiladi */
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '12px' }}
        >
          <div 
            className="custom-modal-box glass-effect" 
            onClick={(e) => e.stopPropagation()} /* 👈 Formaning ichiga bosganda yopilib ketmaydi */
            style={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '20px', width: '100%', maxWidth: '420px', boxSizing: 'border-box', position: 'relative' }}
          >
            {/* 📱 Telefonda va kompyuterda bosganda yopilishi uchun chiziqcha */}
            <div 
              className="modal-swipe-handle"
              onClick={() => setIsModalOpen(false)} /* 👈 Chiziqchani bossa ham yopiladi */
              style={{ 
                width: '50px', 
                height: '10px', 
                background: 'rgba(255,255,255,0.2)', 
                borderRadius: '5px', 
                margin: '-10px auto 15px auto', 
                cursor: 'pointer' 
              }}
            />

            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#ffb703' }}>{editData.id ? 'Tahrirlash ✏️' : 'Yangi mahsulot ➕'}</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer', padding: '0 5px' }}>&times;</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '12px', color: '#aaa' }}>Mahsulot nomi</label>
                <input 
                  placeholder="Masalan: Moxito" 
                  value={editData.name} 
                  onChange={e => setEditData({...editData, name: e.target.value})} 
                  className="modal-input"
                  style={{ width: '100%', boxSizing: 'border-box', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '12px', color: '#aaa' }}>Olish narxi (so'm)</label>
                <input 
                  placeholder="0" 
                  type="number" 
                  value={editData.costPrice} 
                  onChange={e => setEditData({...editData, costPrice: e.target.value})} 
                  className="modal-input"
                  style={{ width: '100%', boxSizing: 'border-box', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '12px', color: '#aaa' }}>Sotish narxi (so'm)</label>
                <input 
                  placeholder="0" 
                  type="number" 
                  value={editData.sellPrice} 
                  onChange={e => setEditData({...editData, sellPrice: e.target.value})} 
                  className="modal-input"
                  style={{ width: '100%', boxSizing: 'border-box', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}
                />
              </div>
            </div>
            
            <div className="modal-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button className="btn-cancel" onClick={() => setIsModalOpen(false)} style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.05)', color: '#ccc', cursor: 'pointer', flex: 1 }}>Bekor qilish</button>
              <button className="btn-save" onClick={handleSave} style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', background: '#ffb703', color: '#000', fontWeight: 'bold', cursor: 'pointer', flex: 1 }}>Saqlash</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}