import React, { useState, useEffect } from 'react';
import { Search, Sun, Moon, Plus, Compass } from 'lucide-react';

export default function Header({ searchQuery, onSearch, onCreateClick, theme, toggleTheme, onLogoClick, currentUser, onLoginClick, onLogoutClick, onUserClick }) {
  const handleSearchChange = (e) => {
    onSearch(e.target.value);
  };

  return (
    <header className="header">
      <div className="header-left" onClick={onLogoClick} style={{ cursor: 'pointer' }}>
        <div className="logo-icon">
          <Compass size={22} className="animate-pulse-subtle" />
        </div>
        <span className="logo-text">DataHive</span>
      </div>

      <div className="header-center">
        <Search className="search-icon" size={18} />
        <input
          type="text"
          placeholder="搜索你感兴趣的话题..."
          className="search-bar"
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </div>

      <div className="header-right">
        <button className="btn btn-primary" onClick={onCreateClick}>
          <Plus size={16} />
          <span>发起话题</span>
        </button>

        <button 
          className="btn-icon" 
          onClick={toggleTheme} 
          title={theme === 'dark' ? "切换到浅色模式" : "切换到深色模式"}
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        {currentUser ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div 
              className="avatar" 
              title={`我的账号: ${currentUser.username} (点击查看主页)`} 
              style={{ fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', transition: 'transform 0.2s' }}
              onClick={() => onUserClick && onUserClick(currentUser.username)}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              {currentUser.avatar}
            </div>
            <span 
              style={{ fontSize: '13px', color: 'var(--text-main)', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer', transition: 'opacity 0.2s' }} 
              title={currentUser.username}
              onClick={() => onUserClick && onUserClick(currentUser.username)}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              {currentUser.username}
            </span>
            <button 
              className="comment-footer-btn" 
              onClick={onLogoutClick}
              style={{ fontSize: '12px', color: 'var(--color-error)', cursor: 'pointer', background: 'transparent', border: 'none' }}
              title="退出登录"
            >
              退出
            </button>
          </div>
        ) : (
          <button 
            className="btn btn-secondary" 
            onClick={onLoginClick}
            style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', fontSize: '13px' }}
          >
            登录 / 注册
          </button>
        )}
      </div>
    </header>
  );
}
