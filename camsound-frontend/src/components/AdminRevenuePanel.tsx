import React, { useState, useEffect } from 'react';
import { subscriptionsService } from '../services/api';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend
} from 'recharts';

const CHART_COLORS = ['#FACC15', '#10b981', '#c084fc', '#60a5fa', '#f87171', '#34d399'];

interface RevenueData {
  revenue: {
    allTime: { total: number; count: number };
    monthly: { total: number; count: number };
    weekly: { total: number; count: number };
    daily: { total: number; count: number };
  };
  byPurpose: { _id: string; total: number; count: number }[];
  activeSubsByPlan: { _id: string; count: number; revenue: number }[];
  subStatusCounts: { _id: string; count: number }[];
  recentTransactions: any[];
  failedPayments: any[];
}

const AdminRevenuePanel: React.FC = () => {
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRevenueStats();
  }, []);

  const fetchRevenueStats = async () => {
    try {
      const res = await subscriptionsService.getRevenueStats();
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch {
      // Silently fail — admin may not have data yet
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
        <i className="fas fa-spinner fa-spin" style={{ fontSize: '1.5rem', marginBottom: 12, display: 'block' }} />
        Loading revenue data...
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
        <i className="fas fa-chart-line" style={{ fontSize: '2rem', marginBottom: 12, display: 'block', opacity: 0.5 }} />
        <p style={{ margin: 0, fontSize: '0.9rem' }}>Revenue data will appear here once payments are processed.</p>
      </div>
    );
  }

  const purposeLabels: Record<string, string> = {
    subscription: '👑 Subscriptions',
    tip: '💝 Artist Tips',
    withdrawal: '💸 Withdrawals',
    other: '📦 Other',
  };

  const pieData = data.byPurpose
    .filter(p => p._id !== 'withdrawal')
    .map(p => ({
      name: purposeLabels[p._id] || p._id,
      value: p.total,
    }));

  const statusColors: Record<string, string> = {
    completed: '#10b981',
    pending: '#FACC15',
    failed: '#f87171',
    refunded: '#8b5cf6',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Revenue Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
        {[
          { label: 'Today', data: data.revenue.daily, icon: 'fa-calendar-day', color: '#60a5fa' },
          { label: 'This Week', data: data.revenue.weekly, icon: 'fa-calendar-week', color: '#c084fc' },
          { label: 'This Month', data: data.revenue.monthly, icon: 'fa-calendar-alt', color: '#10b981' },
          { label: 'All Time', data: data.revenue.allTime, icon: 'fa-infinity', color: '#FACC15' },
        ].map((item, idx) => (
          <div
            key={idx}
            className="glass-card"
            style={{
              padding: '18px 16px',
              borderRadius: 14,
              border: `1px solid ${item.color}25`,
              background: `linear-gradient(135deg, ${item.color}08, transparent)`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <i className={`fas ${item.icon}`} style={{ color: item.color, fontSize: '0.85rem' }} />
              <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {item.label}
              </span>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: item.color }}>
              {(item.data?.total || 0).toLocaleString()}
              <span style={{ fontSize: '0.7rem', fontWeight: 600, marginLeft: 4 }}>FCFA</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
              {item.data?.count || 0} transactions
            </div>
          </div>
        ))}
      </div>

      {/* Two Column: Revenue Chart + Active Subscriptions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        {/* Revenue Breakdown Pie */}
        <div className="glass-card" style={{ padding: 20, borderRadius: 14, border: '1px solid var(--border-color)' }}>
          <h4 style={{ margin: '0 0 16px', fontSize: '0.95rem', color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="fas fa-chart-pie" style={{ color: 'var(--accent-color)' }} />
            Revenue by Type
          </h4>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((_entry, index) => (
                    <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'rgba(15, 25, 20, 0.95)',
                    border: '1px solid rgba(250, 204, 21, 0.3)',
                    borderRadius: 10,
                    color: '#fff',
                    fontSize: '0.82rem',
                  }}
                  formatter={(value: number) => [`${value.toLocaleString()} FCFA`, '']}
                />
                <Legend
                  wrapperStyle={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No revenue data yet
            </div>
          )}
        </div>

        {/* Active Subscriptions by Plan */}
        <div className="glass-card" style={{ padding: 20, borderRadius: 14, border: '1px solid var(--border-color)' }}>
          <h4 style={{ margin: '0 0 16px', fontSize: '0.95rem', color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="fas fa-crown" style={{ color: '#FACC15' }} />
            Active Subscriptions
          </h4>
          {data.activeSubsByPlan.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {data.activeSubsByPlan.map((plan, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: 10,
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>{plan._id}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Revenue: {plan.revenue.toLocaleString()} FCFA
                    </div>
                  </div>
                  <div
                    style={{
                      background: 'rgba(250, 204, 21, 0.15)',
                      color: '#FACC15',
                      padding: '4px 12px',
                      borderRadius: 999,
                      fontSize: '0.85rem',
                      fontWeight: 800,
                    }}
                  >
                    {plan.count}
                  </div>
                </div>
              ))}

              {/* Status Summary */}
              <div style={{ display: 'flex', gap: 10, marginTop: 6, flexWrap: 'wrap' }}>
                {data.subStatusCounts.map((s, idx) => (
                  <span
                    key={idx}
                    style={{
                      fontSize: '0.72rem',
                      color: s._id === 'active' ? '#10b981' : s._id === 'expired' ? '#f87171' : '#FACC15',
                      fontWeight: 600,
                      textTransform: 'capitalize',
                    }}
                  >
                    {s._id}: {s.count}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No active subscriptions yet
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="glass-card" style={{ padding: 20, borderRadius: 14, border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="fas fa-clock" style={{ color: '#10b981' }} />
            Recent Transactions
          </h4>
          <button
            onClick={fetchRevenueStats}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              color: 'var(--text-muted)',
              padding: '4px 10px',
              fontSize: '0.72rem',
              cursor: 'pointer',
            }}
          >
            <i className="fas fa-sync-alt" /> Refresh
          </button>
        </div>
        {data.recentTransactions.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <th style={{ textAlign: 'left', padding: '8px 10px', color: 'var(--text-muted)', fontWeight: 600 }}>User</th>
                  <th style={{ textAlign: 'left', padding: '8px 10px', color: 'var(--text-muted)', fontWeight: 600 }}>Type</th>
                  <th style={{ textAlign: 'right', padding: '8px 10px', color: 'var(--text-muted)', fontWeight: 600 }}>Amount</th>
                  <th style={{ textAlign: 'center', padding: '8px 10px', color: 'var(--text-muted)', fontWeight: 600 }}>Status</th>
                  <th style={{ textAlign: 'right', padding: '8px 10px', color: 'var(--text-muted)', fontWeight: 600 }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {data.recentTransactions.map((tx: any, idx: number) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '8px 10px', color: '#fff' }}>
                      {tx.userId?.name || tx.userId?.email || 'Unknown'}
                    </td>
                    <td style={{ padding: '8px 10px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                      {tx.purpose || tx.paymentMethod || '—'}
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', color: '#10b981', fontWeight: 700 }}>
                      {(tx.amount || 0).toLocaleString()} FCFA
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: 999,
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          background: `${statusColors[tx.status] || '#666'}15`,
                          color: statusColors[tx.status] || '#666',
                          textTransform: 'uppercase',
                        }}
                      >
                        {tx.status}
                      </span>
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                      {new Date(tx.createdAt).toLocaleDateString('en-US', { dateStyle: 'short' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            No transactions yet
          </div>
        )}
      </div>

      {/* Failed Payments Alert */}
      {data.failedPayments.length > 0 && (
        <div
          style={{
            padding: '16px 20px',
            borderRadius: 14,
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
          }}
        >
          <h4 style={{ margin: '0 0 10px', fontSize: '0.9rem', color: '#f87171', display: 'flex', alignItems: 'center', gap: 8 }}>
            <i className="fas fa-exclamation-triangle" />
            Failed Payments ({data.failedPayments.length})
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {data.failedPayments.slice(0, 5).map((tx: any, idx: number) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#fca5a5' }}>
                <span>{tx.userId?.name || 'Unknown'} — {(tx.amount || 0).toLocaleString()} FCFA</span>
                <span>{new Date(tx.createdAt).toLocaleDateString('en-US', { dateStyle: 'short' })}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRevenuePanel;
