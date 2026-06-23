import React, { useState } from 'react';
import { ThumbsUp, MessageSquare, Lock, AlertCircle } from 'lucide-react';

export default function CommentsSection({ poll, userVote, userLikedComments = {}, onAddComment, onLikeComment, currentUser, onLoginClick, onUserClick, onDeleteComment, targetCommentId = null }) {
  const [activeTab, setActiveTab] = useState('all'); // 'all' or optionId
  const [commentText, setCommentText] = useState('');
  const [sortBy, setSortBy] = useState('popular'); // 'popular' or 'latest'

  // Find option name by ID
  const getOptionText = (optionId) => {
    const option = poll.options.find(opt => opt.id === optionId);
    return option ? option.text : '未投票';
  };

  // Assign a color to an option
  const getOptionColor = (optionId) => {
    const index = poll.options.findIndex(opt => opt.id === optionId);
    if (index === -1) return 'var(--option-other)';
    const colors = [
      'var(--option-0)',
      'var(--option-1)',
      'var(--option-2)',
      'var(--option-3)',
      'var(--option-4)',
      'var(--option-5)'
    ];
    return colors[index % colors.length];
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    if (!userVote) return;
    if (!currentUser) return; // Must be logged in

    onAddComment(currentUser.username, commentText, userVote);
    setCommentText('');
  };

  // Filter comments based on active tab
  const filteredComments = activeTab === 'all'
    ? poll.comments
    : poll.comments.filter(c => c.votedOptionId === activeTab);

  // Sort comments based on selected mode
  const sortedComments = [...filteredComments].sort((a, b) => {
    if (sortBy === 'popular') {
      return b.likes - a.likes; // Most likes first
    } else {
      return new Date(b.timestamp) - new Date(a.timestamp); // Newest first
    }
  });

  // Group comments count by option to show badges on tabs
  const getOptionCommentsCount = (optionId) => {
    return poll.comments.filter(c => c.votedOptionId === optionId).length;
  };

  return (
    <div className="comments-container" id="comments-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '10px' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px', fontWeight: '700', fontFamily: 'var(--font-title)' }}>
          <MessageSquare size={18} style={{ color: 'var(--color-primary)' }} />
          <span>讨论广场 ({poll.comments.length} 条回答)</span>
        </h3>
        
        <div style={{ display: 'flex', gap: '6px' }}>
          <button 
            type="button"
            className={`tab-btn ${sortBy === 'popular' ? 'active' : ''}`}
            onClick={() => setSortBy('popular')}
            style={{ padding: '4px 10px', fontSize: '12px', borderRadius: 'var(--radius-sm)', '--tab-color': 'var(--color-primary)' }}
          >
            最热评论
          </button>
          <button 
            type="button"
            className={`tab-btn ${sortBy === 'latest' ? 'active' : ''}`}
            onClick={() => setSortBy('latest')}
            style={{ padding: '4px 10px', fontSize: '12px', borderRadius: 'var(--radius-sm)', '--tab-color': 'var(--color-primary)' }}
          >
            最新发表
          </button>
        </div>
      </div>

      {/* Tabs for option-filtered comments */}
      <div className="comments-header-tabs">
        <button
          className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          全部回答 ({poll.comments.length})
        </button>
        {poll.options.map((option) => {
          const count = getOptionCommentsCount(option.id);
          const color = getOptionColor(option.id);
          const isActive = activeTab === option.id;

          return (
            <button
              key={option.id}
              className={`tab-btn ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(option.id)}
              style={{
                '--tab-color': color,
                borderColor: isActive ? 'transparent' : `${color}33`,
              }}
            >
              <span style={{ 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                backgroundColor: isActive ? 'var(--text-inverse)' : color,
                display: 'inline-block'
              }} />
              <span>{option.text} ({count})</span>
            </button>
          );
        })}
      </div>

      {/* Write Comment Box */}
      {userVote ? (
        currentUser ? (
          // Logged In comment input
          <form className="comment-input-box" onSubmit={handleCommentSubmit}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div className="voter-identity-select">
                <span>你将作为</span>
                <span 
                  className="voter-identity-badge"
                  style={{ backgroundColor: getOptionColor(userVote) }}
                >
                  {getOptionText(userVote)}
                </span>
                <span>选区的登录选民 <strong style={{ color: 'var(--color-primary)' }}>{currentUser.username}</strong> 进行评论</span>
              </div>
            </div>
            <textarea
              className="comment-textarea"
              placeholder="分享你的个性、经验或习惯，帮助大家集思广益..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              required
            />
            <div className="comment-actions">
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                请保持友善发言，共同营造高品质的数据统计社区。
              </span>
              <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', fontSize: '13px' }}>
                发表观点
              </button>
            </div>
          </form>
        ) : (
          // Logged Out but Voted comment trigger
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            gap: '12px', 
            padding: '24px', 
            backgroundColor: 'var(--bg-card)', 
            border: '1px dashed var(--border-color)', 
            borderRadius: 'var(--radius-md)', 
            marginBottom: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary)', fontWeight: '600' }}>
              <Lock size={16} />
              <span>登录后参与探讨</span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', maxWidth: '400px', lineHeight: '1.4' }}>
              你已完成投票！请先登录账号，即可在 <strong style={{ color: 'var(--color-success)' }}>{getOptionText(userVote)}</strong> 选区中发表你的独到观点。
            </p>
            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={onLoginClick}
              style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', fontSize: '13px' }}
            >
              登录 / 快速注册
            </button>
          </div>
        )
      ) : (
        // Locked Comment area (User hasn't voted yet)
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          gap: '12px', 
          padding: '24px', 
          backgroundColor: 'rgba(239, 68, 68, 0.03)', 
          border: '1px dashed rgba(99, 102, 241, 0.25)', 
          borderRadius: 'var(--radius-md)', 
          marginBottom: '24px' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary)', fontWeight: '600' }}>
            <Lock size={16} />
            <span>评论区已被统计锁定</span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', maxWidth: '400px', lineHeight: '1.4' }}>
            本社区采用数据关联讨论机制。你需要先在上方卡片中<strong style={{ color: 'var(--color-primary)', fontWeight: '600' }}>投下一票</strong>，亮明你的态度，系统才会自动开启你的发言通道，并将你的发言归类至对应选区。
          </p>
        </div>
      )}

      {/* Comments List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {sortedComments.length > 0 ? (
          sortedComments.map((comment) => {
            const isTarget = targetCommentId && String(comment.id) === String(targetCommentId);
            return (
              <div 
                key={comment.id} 
                id={`comment-${comment.id}`} 
                className={`comment-card ${isTarget ? 'highlighted-comment' : ''}`}
              >
              <div 
                className="avatar" 
                style={{ flexShrink: 0, backgroundColor: getOptionColor(comment.votedOptionId), cursor: onUserClick ? 'pointer' : 'default' }}
                onClick={onUserClick ? () => onUserClick(comment.author) : undefined}
                title={onUserClick ? `查看 ${comment.author} 的主页` : undefined}
              >
                {comment.avatar}
              </div>
              <div className="comment-body">
                <div className="comment-meta">
                  <span 
                    className="commenter-name"
                    onClick={onUserClick ? () => onUserClick(comment.author) : undefined}
                    style={{ cursor: onUserClick ? 'pointer' : 'default' }}
                    title={onUserClick ? `查看 ${comment.author} 的主页` : undefined}
                  >
                    {comment.author}
                  </span>
                  <span 
                    className="comment-vote-tag"
                    style={{ backgroundColor: getOptionColor(comment.votedOptionId) }}
                  >
                    已选：{getOptionText(comment.votedOptionId)}
                  </span>
                  <span className="comment-time">
                    {new Date(comment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="comment-text">{comment.text}</p>
                <div className="comment-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    {(() => {
                      const isLiked = !!userLikedComments[comment.id];
                      return (
                        <button 
                          className="comment-footer-btn" 
                          onClick={() => onLikeComment(comment.id)}
                          style={{ 
                            color: isLiked ? 'var(--color-primary)' : 'var(--text-muted)',
                            fontWeight: isLiked ? '600' : 'normal'
                          }}
                        >
                          <ThumbsUp size={14} fill={isLiked ? 'var(--color-primary)' : 'transparent'} />
                          <span>{comment.likes}</span>
                        </button>
                      );
                    })()}
                  </div>
                  
                  {currentUser && (
                    comment.author.toLowerCase() === currentUser.username.toLowerCase() || 
                    poll.creator.name.toLowerCase() === currentUser.username.toLowerCase()
                  ) && (
                    <button 
                      type="button"
                      className="comment-footer-btn" 
                      onClick={() => onDeleteComment(comment.id)}
                      style={{ 
                        color: 'var(--color-error)', 
                        fontSize: '12px', 
                        cursor: 'pointer',
                        background: 'transparent',
                        border: 'none',
                        opacity: 0.8
                      }}
                      title="删除这条评论"
                    >
                      删除
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
          })
        ) : (
          <div className="empty-state" style={{ padding: '32px' }}>
            <AlertCircle size={32} />
            <p style={{ fontSize: '14px' }}>该选区暂无回答。投给该选项并留下你的独到见解吧！</p>
          </div>
        )}
      </div>
    </div>
  );
}
