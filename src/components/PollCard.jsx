import React, { useState, useEffect } from 'react';
import { MessageSquare, Share2, BarChart2, Check, User } from 'lucide-react';

export default function PollCard({ poll, userVote, onVote, onSelect, isDetailedView = false, onUserClick }) {
  const [copied, setCopied] = useState(false);
  const [animateResults, setAnimateResults] = useState(false);

  // Trigger percentage animation after vote or if already voted
  useEffect(() => {
    if (userVote) {
      const timer = setTimeout(() => setAnimateResults(true), 50);
      return () => clearTimeout(timer);
    } else {
      setAnimateResults(false);
    }
  }, [userVote, poll.id]);

  const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0);

  const handleOptionClick = (optionId) => {
    if (userVote) return; // Can't vote twice in this demo (unless we add revote)
    onVote(poll.id, optionId);
  };

  const handleShare = (e) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/#poll-${poll.id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Color mappings for progress bars based on option index
  const getOptionColor = (index) => {
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

  return (
    <div 
      className={`poll-card ${isDetailedView ? 'detailed-view' : ''}`}
      onClick={!isDetailedView ? () => onSelect(poll.id) : undefined}
      style={{ cursor: !isDetailedView ? 'pointer' : 'default' }}
    >
      {/* Top Meta info */}
      <div className="poll-meta">
        <div 
          className="poll-creator"
          onClick={onUserClick ? (e) => { e.stopPropagation(); onUserClick(poll.creator.name); } : undefined}
          style={onUserClick ? { cursor: 'pointer', transition: 'opacity 0.2s' } : undefined}
          onMouseEnter={(e) => { if (onUserClick) e.currentTarget.style.opacity = '0.8'; }}
          onMouseLeave={(e) => { if (onUserClick) e.currentTarget.style.opacity = '1'; }}
          title={onUserClick ? `查看 ${poll.creator.name} 的主页` : undefined}
        >
          <div className="avatar">{poll.creator.avatar}</div>
          <span style={{ fontWeight: '600' }}>{poll.creator.name}</span>
          <span style={{ fontSize: '12px', opacity: 0.6 }}>• {new Date(poll.createdAt).toLocaleDateString()}</span>
        </div>
        <span className="category-badge">{poll.category}</span>
      </div>

      {/* Question */}
      <div>
        <h2 className="poll-question">{poll.question}</h2>
        {poll.desc && <p className="poll-desc">{poll.desc}</p>}
      </div>

      {/* Options List */}
      <div className="poll-options">
        {poll.options.map((option, index) => {
          const votePercent = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
          const isSelected = userVote === option.id;
          const hasVoted = !!userVote;
          const color = getOptionColor(index);

          return (
            <button
              key={option.id}
              className={`option-btn ${hasVoted ? 'voted-state' : ''} ${isSelected ? 'selected' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                handleOptionClick(option.id);
              }}
              disabled={hasVoted}
              style={{
                '--fill-color': color,
              }}
            >
              {/* Background fill */}
              <div 
                className="option-fill" 
                style={{ 
                  width: animateResults ? `${votePercent}%` : '0%',
                  transition: 'width 0.8s cubic-bezier(0.1, 0.8, 0.2, 1)'
                }} 
              />
              
              <div className="option-text">
                {isSelected && <Check size={16} style={{ color: 'var(--color-success)', marginRight: '4px' }} />}
                <span>{option.text}</span>
              </div>

              <div className={`option-results ${animateResults ? 'show' : ''}`}>
                <span className="percentage">{votePercent}%</span>
                <span className="vote-count">{option.votes} 票</span>
              </div>
            </button>
          );
        })}
      </div>

      {userVote && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-4px' }}>
          <button 
            type="button"
            className="comment-footer-btn" 
            onClick={(e) => {
              e.stopPropagation();
              onVote(poll.id, null); // Passing null clears the vote
            }}
            style={{ fontSize: '12px', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', background: 'transparent', border: 'none' }}
          >
            <span>修改选择 / 重新投票</span>
          </button>
        </div>
      )}

      {/* Tags and Footer */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '-4px' }}>
        {Array.isArray(poll.tags) && poll.tags.map(tag => (
          <span key={tag} style={{ fontSize: '12px', color: 'var(--text-muted)', backgroundColor: 'var(--bg-hover)', padding: '2px 8px', borderRadius: 'var(--radius-sm)' }}>
            #{tag}
          </span>
        ))}
      </div>

      <div className="poll-footer">
        <div className="poll-stats">
          <div className="stat-item" title="总投票人数">
            <BarChart2 size={16} />
            <span>{totalVotes} 票</span>
          </div>
          
          {!isDetailedView ? (
            <div 
              className="stat-item stat-item-btn" 
              title="查看讨论" 
              onClick={(e) => {
                e.stopPropagation();
                onSelect(poll.id);
              }}
            >
              <MessageSquare size={16} />
              <span>{poll.comments.length} 回答</span>
            </div>
          ) : (
            <div className="stat-item" title="回答数量">
              <MessageSquare size={16} />
              <span>{poll.comments.length} 回答</span>
            </div>
          )}
        </div>

        <button 
          className="comment-footer-btn" 
          onClick={handleShare}
          title="分享链接"
          style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          <Share2 size={16} />
          <span>{copied ? '已复制!' : '分享'}</span>
        </button>
      </div>
    </div>
  );
}
