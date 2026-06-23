import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, confirmText = "确认删除", cancelText = "取消" }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel} style={{ zIndex: 1100 }}>
      <div 
        className="modal-content animate-fade-in" 
        onClick={(e) => e.stopPropagation()} 
        style={{ 
          maxWidth: '400px', 
          borderRadius: 'var(--radius-lg)', 
          background: 'var(--bg-modal)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-md), 0 0 25px rgba(239, 68, 68, 0.1)'
        }}
      >
        {/* Header */}
        <div className="modal-header" style={{ borderBottom: 'none', padding: '24px 24px 12px' }}>
          <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px', fontWeight: '700', color: 'var(--text-main)' }}>
            <AlertTriangle size={20} style={{ color: 'var(--color-error)', flexShrink: 0 }} />
            <span>{title}</span>
          </h3>
          <button 
            type="button" 
            className="btn-icon" 
            onClick={onCancel} 
            style={{ border: 'none', background: 'transparent', width: '32px', height: '32px' }}
          >
            <X size={18} />
          </button>
        </div>
        
        {/* Message */}
        <div className="modal-body" style={{ padding: '0 24px 20px', fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.6', textAlign: 'left' }}>
          {message}
        </div>

        {/* Footer Actions */}
        <div className="modal-footer" style={{ borderTop: 'none', padding: '0 24px 24px', gap: '12px', justifyContent: 'flex-end' }}>
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={onCancel}
            style={{ 
              padding: '8px 16px', 
              borderRadius: 'var(--radius-md)', 
              fontSize: '13px',
              fontWeight: '500'
            }}
          >
            {cancelText}
          </button>
          <button 
            type="button" 
            className="btn" 
            onClick={onConfirm}
            style={{ 
              padding: '8px 16px', 
              borderRadius: 'var(--radius-md)', 
              fontSize: '13px', 
              backgroundColor: 'var(--color-error)', 
              color: 'white',
              fontWeight: '600',
              cursor: 'pointer',
              border: 'none',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-error)'}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
