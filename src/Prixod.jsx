import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { ref, onValue, update } from 'firebase/database';

export default function Prixod() {
  const [inventory, setInventory] = useState([]);
  const [kirimValues, setKirimValues] = useState({});
  const [tempKirim, setTempKirim] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const tableRowStyle = {
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(10px)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    transition: 'all 0.3s ease'
  };

  const inputStyle = {
    width: '60px',
    background: 'rgba(0, 0, 0, 0.4)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    color: '#fff',
    padding: '6px',
    borderRadius: '8px',
    textAlign: 'center',
    outline: 'none'
  };

  useEffect(() => {
    const menuRef = ref(db, 'menu');
    const ordersRef = ref(db, 'active_shift/orders');

    onValue(menuRef, (menuSnapshot) => {
      onValue(ordersRef, (ordersSnapshot) => {
        const menuData = menuSnapshot.val() || {};
        const ordersData = ordersSnapshot.val() || {};

        const salesMap = {};
        Object.values(ordersData).forEach(order => {
          if (order.items) {
            order.items.forEach(item => {
              salesMap[item.id] = (salesMap[item.id] || 0) + item.qty;
            });
          }
        });

        const allItems = [];
        Object.keys(menuData).forEach(category => {
          const catItems = menuData[category];
          if (typeof catItems === 'object') {
            Object.keys(catItems).forEach(id => {
              const item = catItems[id];
              if (item && item.name) {
                allItems.push({
                  id,
                  ...item,
                  category: category,
                  kirim: item.kirim || 0,
                  chiqim: salesMap[id] || 0
                });
              }
            });
          }
        });
        setInventory(allItems);
      });
    });
  }, []);

  const saveKirim = (item) => {
    const categoryPath = item.category.toLowerCase();
    const newValue = Number(tempKirim[item.id] || item.kirim || 0);
    
    update(ref(db, `menu/${categoryPath}/${item.id}`), { kirim: newValue })
      .then(() => alert("Muvaffaqiyatli saqlandi!"))
      .catch((error) => console.error("Xatolik:", error));
  };

  const renderTableRows = (categoryName) => {
    return inventory
      .filter(item => item.category === categoryName) // Qidiruvni table ichida alohida ishlatamiz
      .filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .map((item, index) => {
        const ostatok = Number(item.stock || 0);
        const kirim = Number(item.kirim || 0);
        const chiqim = Number(item.chiqim || 0);
        const ertaga = (ostatok + kirim) - chiqim;

        return (
          <tr key={`${item.id}-${index}`} style={tableRowStyle}>
            <td style={{ padding: '16px', fontWeight: '500' }}>{item.name}</td>
            <td style={{ textAlign: 'center', color: '#94a3b8' }}>{ostatok}</td>
            <td style={{ textAlign: 'center', display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center', padding: '10px' }}>
              <input 
                type="number" 
                disabled={editingId !== item.id}
                defaultValue={item.kirim || 0}
                onChange={(e) => setTempKirim(prev => ({ ...prev, [item.id]: e.target.value }))}
                style={{ ...inputStyle, borderColor: editingId === item.id ? '#60a5fa' : 'rgba(255,255,255,0.1)' }}
              />
              <button 
                onClick={() => editingId === item.id ? (saveKirim(item), setEditingId(null)) : setEditingId(item.id)}
                style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: editingId === item.id ? '#34d399' : '#4b5563', color: '#fff' }}
              >
                {editingId === item.id ? '✓' : '✎'}
              </button>
            </td>
            <td style={{ textAlign: 'center', color: '#f87171' }}>{chiqim}</td>
            <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#fcd34d', paddingRight: '16px' }}>{ertaga}</td>
          </tr>
        );
      });
  };

  return (
    <div style={{ padding: '20px', color: '#fff', maxWidth: '900px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <button onClick={() => window.history.back()} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer' }}>⬅️</button>
        <h2 style={{ margin: 0, color: '#34d399', fontSize: '24px' }}>📥 Mahsulotlar Kirimi</h2>
      </div>

      <input 
        type="text" 
        placeholder="Mahsulot qidirish..." 
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ width: '100%', padding: '12px', marginBottom: '20px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', outline: 'none' }}
      />
      
      <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '20px', padding: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 10px' }}>
          <thead>
            <tr style={{ color: '#888', fontSize: '14px', textTransform: 'uppercase' }}>
              <th style={{ textAlign: 'left', padding: '10px' }}>Mahsulot</th>
              <th>Ostatok</th><th>Kirim</th><th>Chiqim</th><th style={{ color: '#fcd34d' }}>Ertaga</th>
            </tr>
          </thead>
          <tbody>
            <tr><td colSpan="5" style={{ color: '#ffb703', fontWeight: 'bold', paddingTop: '20px' }}>SHIRINLIKLAR</td></tr>
            {renderTableRows('shirinliklar')}
            
            <tr><td colSpan="5" style={{ color: '#ffb703', fontWeight: 'bold', paddingTop: '20px' }}>ICHIMLIKLAR</td></tr>
            {renderTableRows('ichimliklar')}

            {/* 📬 QUTILAR BO'LIMI INTEGRATSIYASI */}
            <tr><td colSpan="5" style={{ color: '#ffb703', fontWeight: 'bold', paddingTop: '20px' }}>QUTILAR</td></tr>
            {renderTableRows('qutilar')}
          </tbody>
        </table>
      </div>
    </div>
  );
}