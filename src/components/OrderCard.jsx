import React from 'react';

export default function OrderCard({ data, onOpenHistory }) {
  // Agar arxivda totalRevenue bo'lsa o'shani oladi, yo'q bo'lsa 0 ko'rsatadi
  const totalAmount = data.totalRevenue || 0;

  return (
    <div className="order-card" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '140px' }}>
      <div>
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', marginBottom: '8px' }}>{data.date}</div>
        <h3 style={{ margin: 0, fontSize: '22px', fontWeight: '500' }}>{data.orderCount}ta zakaz</h3>
      </div>
     
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '15px' }}>
        {/* Kichik grafik barchalari */}
        <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', height: '24px' }}>
          {[12, 18, 8, 15, 22].map((h, i) => (
            <div key={i} style={{ width: '4px', height: `${(h / 25) * 100}%`, background: '#a82431', borderRadius: '1px' }}></div>
          ))}
        </div>
       
        {/* O'ng tomondagi qism: Narx va Tugma */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#ffb703', background: 'rgba(255,183,3,0.08)', padding: '4px 10px', borderRadius: '8px' }}>
            {totalAmount.toLocaleString()} so'm
          </span>
          <button
            onClick={() => onOpenHistory(data)}
            style={{ background: 'none', border: '1px solid #ffb703', color: '#ffb703', width: '34px', height: '34px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 8px rgba(255,183,3,0.2)' }}
          >
            👁️
          </button>
        </div>
      </div>
    </div>
  );
} 
