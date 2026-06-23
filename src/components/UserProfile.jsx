import React, { useState } from 'react';
import { ArrowLeft, MessageSquare, ThumbsUp, BarChart2, Award, Calendar } from 'lucide-react';

export default function UserProfile({ username, polls, onBack, onPollSelect, currentUser }) {
  const [activeTab, setActiveTab] = useState('polls'); // 'polls' or 'comments'

  // Filter polls created by this user
  const userCreatedPolls = polls.filter(
    p => p.creator.name.toLowerCase() === username.toLowerCase()
  );

  // Find all comments made by this user across all polls
  const userComments = [];
  polls.forEach(p => {
    p.comments.forEach(c => {
      if (c.author.toLowerCase() === username.toLowerCase()) {
        userComments.push({
          pollId: p.id,
          pollQuestion: p.question,
          comment: c
        });
      }
    });
  });

  // Calculate total likes received on all comments
  const totalLikesReceived = userComments.reduce((sum, item) => sum + item.comment.likes, 0);

  // Determine user badge based on contribution
  const totalContributions = userCreatedPolls.length + userComments.length;
  let userBadge = '🌱 数据探索先锋';
  let badgeColor = 'var(--text-muted)';
  
  if (totalContributions >= 8) {
    userBadge = '👑 殿堂级数据官';
    badgeColor = 'var(--color-secondary)';
  } else if (totalContributions >= 4) {
    userBadge = '💎 活跃洞察学者';
    badgeColor = 'var(--color-primary)';
  }

  const isMe = currentUser && currentUser.username.toLowerCase() === username.toLowerCase();

  return (
    <div className="profile-container animate-fade-in" style={{ padding: '8px 4px 40px' }}>
      {/* Back button */}
      <button className="back-nav-btn" onClick={onBack} style={{ marginBottom: '20px' }}>
        <ArrowLeft size={16} />
        <span>返回上级页面</span>
      </button>

      {/* Profile Card */}
      <div className="profile-card" style={{
        padding: '30px',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        backdropFilter: 'blur(10px)',
        marginBottom: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}>
        {/* User main info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-primary)',
            color: 'var(--text-inverse)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px',
            fontWeight: 'bold',
            boxShadow: '0 8px 20px rgba(99, 102, 241, 0.3)',
            flexShrink: 0
          }}>
            {username.charAt(0).toUpperCase()}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '800', margin: 0, color: 'var(--text-main)' }}>{username}</h2>
              {isMe && (
                <span style={{
                  fontSize: '11px',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  color: 'var(--color-success)',
                  border: '1px solid var(--color-success)',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  fontWeight: '600'
                }}>我</span>
              )}
            </div>

            {/* Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: badgeColor, fontWeight: '600' }}>
              <Award size={14} />
              <span>{userBadge}</span>
            </div>

            {/* Simulated registration date */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
              <Calendar size={12} />
              <span>加入于 2026 年 6 月</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="profile-stats-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '16px'
        }}>
          {/* Stat 1 */}
          <div className="profile-stat-box" style={{
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-main)',
            border: '1px solid var(--border-color)',
            textAlign: 'center'
          }}>
            <span style={{ display: 'block', fontSize: '24px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '4px' }}>
              {userCreatedPolls.length}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>创建话题</span>
          </div>

          {/* Stat 2 */}
          <div className="profile-stat-box" style={{
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-main)',
            border: '1px solid var(--border-color)',
            textAlign: 'center'
          }}>
            <span style={{ display: 'block', fontSize: '24px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '4px' }}>
              {userComments.length}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>发表观点</span>
          </div>

          {/* Stat 3 */}
          <div className="profile-stat-box" style={{
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-main)',
            border: '1px solid var(--border-color)',
            textAlign: 'center'
          }}>
            <span style={{ display: 'block', fontSize: '24px', fontWeight: '800', color: 'var(--color-primary)', marginBottom: '4px' }}>
              {totalLikesReceived}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>收获点赞</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="comments-header-tabs" style={{ marginBottom: '16px' }}>
        <button
          className={`tab-btn ${activeTab === 'polls' ? 'active' : ''}`}
          onClick={() => setActiveTab('polls')}
        >
          {isMe ? '我' : 'TA'} 发起的话题 ({userCreatedPolls.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'comments' ? 'active' : ''}`}
          onClick={() => setActiveTab('comments')}
        >
          {isMe ? '我' : 'TA'} 发表的观点 ({userComments.length})
        </button>
      </div>

      {/* Tabs Content */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {activeTab === 'polls' ? (
          userCreatedPolls.length > 0 ? (
            userCreatedPolls.map(poll => {
              const totalVotes = poll.options.reduce((sum, o) => sum + o.votes, 0);
              return (
                <div
                  key={poll.id}
                  className="profile-list-item"
                  onClick={() => onPollSelect(poll.id)}
                  style={{
                    padding: '18px 20px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--color-primary)', backgroundColor: 'rgba(99, 102, 241, 0.1)', padding: '2px 8px', borderRadius: 'var(--radius-sm)', fontWeight: '600' }}>
                      {poll.category}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {new Date(poll.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)', margin: 0, lineHeight: '1.4' }}>
                    {poll.question}
                  </h3>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--text-muted)', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '10px', marginTop: '4px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <BarChart2 size={14} />
                      <span>{totalVotes} 票</span>
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MessageSquare size={14} />
                      <span>{poll.comments.length} 回答</span>
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="empty-state" style={{ padding: '40px 20px' }}>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>暂未发起过任何投票话题</p>
            </div>
          )
        ) : (
          userComments.length > 0 ? (
            userComments.map(item => {
              const votedOption = item.pollQuestion ? (
                // Try to find what user voted
                polls.find(p => p.id === item.pollId)?.options.find(o => o.id === item.comment.votedOptionId)?.text
              ) : null;

              return (
                <div
                  key={item.comment.id}
                  className="profile-list-item"
                  onClick={() => onPollSelect(item.pollId, true, item.comment.id)}
                  style={{
                    padding: '18px 20px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      发表于话题：
                    </div>
                    <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)', margin: 0, textDecoration: 'underline' }}>
                      {item.pollQuestion}
                    </h4>
                  </div>

                  {/* Standing/Vote Option details */}
                  {votedOption && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>投票立场：</span>
                      <span style={{
                        fontSize: '11px',
                        backgroundColor: 'var(--color-primary-dim, rgba(99, 102, 241, 0.1))',
                        color: 'var(--color-primary)',
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-sm)',
                        fontWeight: '600'
                      }}>
                        {votedOption}
                      </span>
                    </div>
                  )}

                  {/* Comment text */}
                  <p style={{
                    fontSize: '14px',
                    color: 'var(--text-main)',
                    backgroundColor: 'var(--bg-main)',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-sm)',
                    margin: '4px 0 0 0',
                    lineHeight: '1.5',
                    borderLeft: '3px solid var(--color-primary)'
                  }}>
                    {item.comment.text}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--text-muted)', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '10px', marginTop: '4px' }}>
                    <span>{new Date(item.comment.timestamp).toLocaleDateString()}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <ThumbsUp size={12} />
                      <span>{item.comment.likes} 个赞</span>
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="empty-state" style={{ padding: '40px 20px' }}>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>暂未发表过任何评论观点</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
