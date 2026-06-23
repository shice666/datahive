import React from 'react';
import { LayoutGrid, Tv, Cpu, Laptop, Pizza, Compass, Sparkles } from 'lucide-react';

const CATEGORIES = [
  { id: 'all', name: '全部话题', icon: LayoutGrid },
  { id: '🎬 娱乐', name: '🎬 娱乐', icon: Tv },
  { id: '🤖 科技', name: '🤖 科技', icon: Cpu },
  { id: '📱 软件', name: '📱 软件', icon: Laptop },
  { id: '🍔 生活', name: '🍔 生活', icon: Pizza },
];

export default function Sidebar({ activeCategory, onCategoryChange, totalPolls }) {
  return (
    <aside className="sidebar">
      <div>
        <h3 className="sidebar-section-title">探索分类</h3>
        <ul className="sidebar-menu">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <li
                key={cat.id}
                className={`sidebar-item ${isActive ? 'active' : ''}`}
                onClick={() => onCategoryChange(cat.id)}
              >
                <Icon size={18} />
                <span>{cat.name}</span>
              </li>
            );
          })}
        </ul>
      </div>

      <div style={{ marginTop: 'auto', padding: '16px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', fontSize: '13px', color: 'var(--text-muted)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-primary)', fontWeight: '600', marginBottom: '8px' }}>
          <Sparkles size={14} />
          <span>众数广场</span>
        </div>
        <p style={{ lineHeight: '1.4', marginBottom: '8px' }}>
          DataHive 是一个完全去中心化的日常数据分享社区。在这里，每个数字背后都是一个真实的生活选择。
        </p>
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
          <span>已发起话题:</span>
          <strong style={{ color: 'var(--text-main)' }}>{totalPolls} 个</strong>
        </div>
      </div>
    </aside>
  );
}
