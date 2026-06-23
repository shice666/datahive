import React, { useState } from 'react';
import { X, Lock, User } from 'lucide-react';

export default function LoginForm({ onClose, onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
 
    const trimmedUser = username.trim();
    if (!trimmedUser) {
      setError('请输入昵称！');
      return;
    }
    if (!password) {
      setError('请输入密码！');
      return;
    }
 
    try {
      await onLogin(trimmedUser, password);
    } catch (err) {
      setError(err.message || '登录失败，请检查输入');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
        <div className="modal-header">
          <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px', fontWeight: '700' }}>
            <Lock size={20} style={{ color: 'var(--color-primary)' }} />
            <span>登录 / 快速注册</span>
          </h2>
          <button className="btn-icon" onClick={onClose} style={{ border: 'none', background: 'transparent' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ padding: '20px 24px' }}>
            {error && (
              <div style={{ padding: '10px 14px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--color-error)', borderRadius: 'var(--radius-sm)', color: 'var(--color-error)', fontSize: '13px', marginBottom: '16px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Username Input */}
            <div className="form-group">
              <label className="form-label" htmlFor="login-username">昵称 / 账号</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  id="login-username"
                  type="text"
                  placeholder="输入你的昵称..."
                  className="form-input"
                  style={{ paddingLeft: '36px' }}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  maxLength={15}
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label className="form-label" htmlFor="login-password">密码</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  id="login-password"
                  type="password"
                  placeholder="输入密码..."
                  className="form-input"
                  style={{ paddingLeft: '36px' }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4', marginBottom: '20px', backgroundColor: 'var(--bg-main)', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              💡 <strong>无感注册提示</strong>：<br />
              如果填写的昵称不存在，系统将<strong>自动使用填写的密码为您创建新账户</strong>并完成登录，无需单独的注册流程。
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-md)', fontWeight: '600' }}>
              登录 / 自动注册
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
