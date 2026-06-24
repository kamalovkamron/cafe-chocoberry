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
    <div className="app-wrapper" style={{ padding: '20px', color: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>Admin Panel</h1>
        <Link to="/" className="btn-neon">⬅ Dashboardga qaytish</Link>
      </div>

      {['shirinliklar', 'ichimliklar'].map(cat => (
        <div key={cat} className="category-section" style={{ marginBottom: '40px' }}>
          <h2 style={{ textTransform: 'capitalize', color: '#ffb703' }}>{cat}</h2>
          {Object.entries(menu[cat] || {}).map(([id, item]) => (
            <div key={id} className="menu-item-card">
              <span>{item.name} - Sotiladigan narxi: {item.sellPrice?.toLocaleString()} so'm (Olingan narxi: {item.costPrice?.toLocaleString()} so'm)</span>
              <div>
                <button className="action-btn" onClick={() => { setEditData({ id, cat, ...item }); setIsModalOpen(true); }}>✏️</button>
                <button className="action-btn" onClick={() => handleDelete(cat, id)}>🗑️</button>
              </div>
            </div>
          ))}
          <button className="add-btn" onClick={() => { setEditData({ id: null, cat, name: '', costPrice: '', sellPrice: '' }); setIsModalOpen(true); }}>
            + Yangi mahsulot qo'shish
          </button>
        </div>
      ))}

      {isModalOpen && (
        <div className="custom-modal-backdrop">
          <div className="custom-modal-box glass-effect">
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>{editData.id ? 'Tahrirlash' : 'Yangi mahsulot'}</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer' }}>&times;</button>
            </div>
            
            <input 
              placeholder="Mahsulot nomi" 
              value={editData.name} 
              onChange={e => setEditData({...editData, name: e.target.value})} 
              className="modal-input"
            />
            <input 
              placeholder="Olish narxi (so'm)" 
              type="number" 
              value={editData.costPrice} 
              onChange={e => setEditData({...editData, costPrice: e.target.value})} 
              className="modal-input"
            />
            <input 
              placeholder="Sotish narxi (so'm)" 
              type="number" 
              value={editData.sellPrice} 
              onChange={e => setEditData({...editData, sellPrice: e.target.value})} 
              className="modal-input"
            />
            
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setIsModalOpen(false)}>Bekor qilish</button>
              <button className="btn-save" onClick={handleSave}>Saqlash</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}