import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import PollCard from './components/PollCard';
import CommentsSection from './components/CommentsSection';
import CreatePollForm from './components/CreatePollForm';
import UserProfile from './components/UserProfile';
import ConfirmModal from './components/ConfirmModal';
import { 
  getPolls, 
  votePoll, 
  addComment, 
  createPoll, 
  likeComment,
  loginOrRegister,
  deleteComment
} from './mockData';
import LoginForm from './components/LoginForm';
import { LayoutGrid, Sparkles, Flame, Plus, ArrowLeft } from 'lucide-react';

function VoterInsights({ poll }) {
  const totalVotes = poll.options.reduce((sum, o) => sum + o.votes, 0);
  const totalComments = poll.comments.length;
  
  if (totalComments === 0) {
    return (
      <div style={{ marginTop: '20px', padding: '16px', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', fontSize: '13px', color: 'var(--text-muted)', textAlign: 'left' }}>
        <h4 style={{ color: 'var(--text-main)', fontWeight: '600', marginBottom: '6px' }}>📊 选民洞察</h4>
        <p>暂无足够观点数据进行统计分析，欢迎投下一票并留下你的独特见解！</p>
      </div>
    );
  }

  // Calculate most active commenting option
  const optionCommentCounts = poll.options.map(opt => {
    const count = poll.comments.filter(c => c.votedOptionId === opt.id).length;
    return { option: opt, count };
  });

  // Sort to find the highest count
  const sortedCounts = [...optionCommentCounts].sort((a, b) => b.count - a.count);
  const mostActive = sortedCounts[0];
  const activePercent = totalComments > 0 ? Math.round((mostActive.count / totalComments) * 100) : 0;

  return (
    <div style={{ marginTop: '20px', padding: '20px', borderRadius: 'var(--radius-lg)', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left' }}>
      <h4 style={{ color: 'var(--text-main)', fontWeight: '700', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-title)' }}>
        <span style={{ color: 'var(--color-secondary)' }}>📊</span>
        <span>数据洞察</span>
      </h4>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
        <div>
          <span style={{ color: 'var(--text-muted)' }}>观点转换率:</span>
          <strong style={{ color: 'var(--text-main)', marginLeft: '6px' }}>{totalVotes > 0 ? Math.round((totalComments / totalVotes) * 100) : 0}%</strong>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>选民投票后发表评论的比例</div>
        </div>
        <div>
          <span style={{ color: 'var(--text-muted)' }}>总互动热度:</span>
          <strong style={{ color: 'var(--text-main)', marginLeft: '6px' }}>
            {poll.comments.reduce((sum, c) => sum + c.likes, 0)} 点赞
          </strong>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>评论区获得的支持点赞总数</div>
        </div>
      </div>

      <div style={{ fontSize: '13px', lineHeight: '1.5', color: 'var(--text-main)' }}>
        {mostActive.count > 0 ? (
          <p>
            📢 本话题中，投票给 <strong style={{ color: 'var(--color-primary)' }}>“{mostActive.option.text}”</strong> 的选民发言最积极，贡献了 <strong style={{ color: 'var(--color-success)' }}>{activePercent}%</strong> 的观点讨论（共 {mostActive.count} 条）。
          </p>
        ) : (
          <p>当前各选区发言分布均匀，欢迎发表评论来占领你所属的选区！</p>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [polls, setPolls] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPollId, setSelectedPollId] = useState(null);
  const [selectedUsername, setSelectedUsername] = useState(null);
  const [returnProfile, setReturnProfile] = useState(null);
  const [targetCommentId, setTargetCommentId] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [confirmModalConfig, setConfirmModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null
  });
  const [userVotes, setUserVotes] = useState({});
  const [userLikedComments, setUserLikedComments] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [theme, setTheme] = useState('dark');

  // Refs to hold timer IDs for scroll/restore actions to prevent async race conditions
  const feedRestoreTimerRef = useRef(null);
  const detailScrollTimerRef = useRef(null);

  // Ref to track back navigation state in memory to prevent async state race condition
  const isBackNavigationRef = useRef(false);

  // Refs to preserve current state for hashchange listener without triggering listener rebuild
  const selectedPollIdRef = useRef(selectedPollId);
  const selectedUsernameRef = useRef(selectedUsername);

  // Keep refs synced with latest state
  useEffect(() => {
    selectedPollIdRef.current = selectedPollId;
    selectedUsernameRef.current = selectedUsername;
  }, [selectedPollId, selectedUsername]);

  // Load polls and votes from database/localStorage on mount
  useEffect(() => {
    async function loadInitialData() {
      const data = await getPolls();
      setPolls(data);
    }
    loadInitialData();
    
    const savedVotes = localStorage.getItem('datahive_user_votes');
    if (savedVotes) {
      try {
        setUserVotes(JSON.parse(savedVotes));
      } catch (e) {
        console.error("Failed to parse saved user votes", e);
      }
    }

    const savedLikes = localStorage.getItem('datahive_user_liked_comments');
    if (savedLikes) {
      try {
        setUserLikedComments(JSON.parse(savedLikes));
      } catch (e) {
        console.error("Failed to parse saved user liked comments", e);
      }
    }

    const savedUser = localStorage.getItem('datahive_current_user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Failed to parse saved current user", e);
      }
    }

    const savedTheme = localStorage.getItem('datahive_theme') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  // Sync theme updates to DOM and localStorage
  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('datahive_theme', nextTheme);
  };

  // Check URL hash for direct links (e.g. /#poll-1 or #user-username)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      
      // Get current state index from window.history
      let state = window.history.state;
      let index = state ? state.index : null;
      let prevIndex = parseInt(sessionStorage.getItem('datahive_current_index') || '-1');

      // 1. Save scroll position of the previous page to history stack before shifting route
      if (prevIndex !== -1) {
        let stack = [];
        try {
          stack = JSON.parse(sessionStorage.getItem('datahive_history_stack') || '[]');
        } catch (e) {}
        if (stack[prevIndex]) {
          stack[prevIndex].scrollY = window.scrollY;
          sessionStorage.setItem('datahive_history_stack', JSON.stringify(stack));
        }
      }

      const prevHash = sessionStorage.getItem('datahive_prev_hash') || '';
      const isNewForward = index === null || index === undefined || (index === prevIndex && hash !== prevHash);

      let stack = [];
      try {
        stack = JSON.parse(sessionStorage.getItem('datahive_history_stack') || '[]');
      } catch (e) {
        stack = [];
      }

      if (isNewForward) {
        // This is a new forward navigation
        index = prevIndex + 1;
        window.history.replaceState({ index }, '');
        
        // Truncate the stack at the current position in case we had gone back and then navigated forward
        stack = stack.slice(0, index);
        
        // Save the logical state for this index derived purely from prevHash to prevent sessionStorage pollution loops
        let activeProfile = null;
        let activePoll = null;
        if (hash.startsWith('#poll-')) {
          if (prevHash.startsWith('#user-')) {
            activeProfile = decodeURIComponent(prevHash.replace('#user-', ''));
          }
        } else if (hash.startsWith('#user-')) {
          if (prevHash.startsWith('#poll-')) {
            activePoll = prevHash.replace('#', '');
          }
        }
        
        stack[index] = {
          hash: hash,
          returnProfile: activeProfile,
          returnPoll: activePoll,
          scrollY: 0 // Initialize scrollY for this page
        };
        sessionStorage.setItem('datahive_history_stack', JSON.stringify(stack));
      }
      
      // Check if it's a back navigation (index is valid and smaller than prevIndex)
      if (index !== null && index !== undefined && prevIndex !== -1 && index < prevIndex) {
        sessionStorage.setItem('datahive_is_back_navigation', 'true');
        isBackNavigationRef.current = true;
      } else {
        sessionStorage.removeItem('datahive_is_back_navigation');
        isBackNavigationRef.current = false;
      }

      // Update current index in sessionStorage
      sessionStorage.setItem('datahive_current_index', index.toString());
      
      // Restore the state for this index
      const currentState = stack[index] || {};
      const currentReturnProfile = currentState.returnProfile || null;
      
      if (hash && hash.startsWith('#poll-')) {
        const id = hash.replace('#', '');
        
        // Clear all timers as we are navigating to a new poll detail page
        if (feedRestoreTimerRef.current) clearTimeout(feedRestoreTimerRef.current);
        if (detailScrollTimerRef.current) clearTimeout(detailScrollTimerRef.current);
        
        setSelectedPollId(id);
        setSelectedUsername(null);
        setReturnProfile(currentReturnProfile);
        
        const targetId = sessionStorage.getItem('datahive_target_comment_id') || null;
        setTargetCommentId(targetId);
      } else if (hash && hash.startsWith('#user-')) {
        const username = decodeURIComponent(hash.replace('#user-', ''));
        
        if (feedRestoreTimerRef.current) clearTimeout(feedRestoreTimerRef.current);
        if (detailScrollTimerRef.current) clearTimeout(detailScrollTimerRef.current);
        
        setSelectedPollId(null);
        setSelectedUsername(username);
        setReturnProfile(null);
        setTargetCommentId(null);
      } else {
        // Clear detail scroll timer when leaving detail page
        if (detailScrollTimerRef.current) clearTimeout(detailScrollTimerRef.current);
        
        setSelectedPollId(null);
        setSelectedUsername(null);
        setReturnProfile(null);
        setTargetCommentId(null);
      }

      // Always update prevHash at the end of the handler
      sessionStorage.setItem('datahive_prev_hash', hash);
    };
    
    window.addEventListener('hashchange', handleHashChange);
    // Initial check
    handleHashChange();
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      // Clean up all timers on unmount
      if (feedRestoreTimerRef.current) clearTimeout(feedRestoreTimerRef.current);
      if (detailScrollTimerRef.current) clearTimeout(detailScrollTimerRef.current);
    };
  }, []);

  // Handle layout/scroll restoration when returning to feed
  useLayoutEffect(() => {
    if (!selectedPollId && !selectedUsername) {
      isBackNavigationRef.current = false;
      sessionStorage.removeItem('datahive_is_back_navigation');

      let stack = [];
      try {
        stack = JSON.parse(sessionStorage.getItem('datahive_history_stack') || '[]');
      } catch (e) {}
      const currentIndex = parseInt(sessionStorage.getItem('datahive_current_index') || '0');
      const savedScrollY = stack[currentIndex] ? (stack[currentIndex].scrollY || 0) : 0;

      // Restore feed scroll position immediately before browser paints
      window.scrollTo({ top: savedScrollY });
      
      // Also schedule a small deferred fallback to ensure any dynamic updates are handled
      if (feedRestoreTimerRef.current) {
        clearTimeout(feedRestoreTimerRef.current);
      }
      feedRestoreTimerRef.current = setTimeout(() => {
        window.scrollTo({ top: savedScrollY });
      }, 50);
    }
    return () => {
      if (feedRestoreTimerRef.current) {
        clearTimeout(feedRestoreTimerRef.current);
      }
    };
  }, [selectedPollId, selectedUsername]);

  // Handle layout/scroll restoration when returning to profile page
  useLayoutEffect(() => {
    if (selectedUsername) {
      const isBackNav = isBackNavigationRef.current || sessionStorage.getItem('datahive_is_back_navigation') === 'true';
      isBackNavigationRef.current = false;
      sessionStorage.removeItem('datahive_is_back_navigation');
      
      if (isBackNav) {
        let stack = [];
        try {
          stack = JSON.parse(sessionStorage.getItem('datahive_history_stack') || '[]');
        } catch (e) {}
        const currentIndex = parseInt(sessionStorage.getItem('datahive_current_index') || '0');
        const savedScrollY = stack[currentIndex] ? (stack[currentIndex].scrollY || 0) : 0;

        // Restore profile scroll position immediately before browser paints
        window.scrollTo({ top: savedScrollY });
        
        // Also schedule a small deferred fallback
        if (feedRestoreTimerRef.current) {
          clearTimeout(feedRestoreTimerRef.current);
        }
        feedRestoreTimerRef.current = setTimeout(() => {
          window.scrollTo({ top: savedScrollY });
        }, 50);
      }
    }
    return () => {
      if (feedRestoreTimerRef.current) {
        clearTimeout(feedRestoreTimerRef.current);
      }
    };
  }, [selectedUsername]);

  // Handle scrolling when entering detailed view based on vote status
  useEffect(() => {
    if (selectedPollId) {
      const isBackNav = isBackNavigationRef.current || sessionStorage.getItem('datahive_is_back_navigation') === 'true';
      isBackNavigationRef.current = false;
      sessionStorage.removeItem('datahive_is_back_navigation');

      if (isBackNav) {
        if (detailScrollTimerRef.current) {
          clearTimeout(detailScrollTimerRef.current);
        }
        
        let stack = [];
        try {
          stack = JSON.parse(sessionStorage.getItem('datahive_history_stack') || '[]');
        } catch (e) {}
        const currentIndex = parseInt(sessionStorage.getItem('datahive_current_index') || '0');
        const savedScrollY = stack[currentIndex] ? (stack[currentIndex].scrollY || 0) : 0;

        // Restore detail scroll position immediately
        window.scrollTo({ top: savedScrollY });
        
        // Also schedule a small deferred fallback
        detailScrollTimerRef.current = setTimeout(() => {
          window.scrollTo({ top: savedScrollY });
        }, 50);
        
        return; // Skip auto scroll and snap-to-top altogether on back navigation
      }

      // Immediately snap to top so the visual transition always starts from the top
      window.scrollTo({ top: 0 });

      if (detailScrollTimerRef.current) {
        clearTimeout(detailScrollTimerRef.current);
      }

      const hasVoted = !!userVotes[selectedPollId];
      const forceScroll = sessionStorage.getItem('datahive_scroll_to_comments') === 'true';
      const fromProfile = sessionStorage.getItem('datahive_from_profile') === 'true' || !!returnProfile;
      sessionStorage.removeItem('datahive_scroll_to_comments');
      sessionStorage.removeItem('datahive_from_profile');
      
      if ((hasVoted && !fromProfile) || forceScroll) {
        let isAutoScrolling = false;

        // Cancel the pending auto-scroll or interrupt the ongoing smooth scroll
        const cancelAutoScroll = () => {
          // 1. Cancel pending timer
          if (detailScrollTimerRef.current) {
            clearTimeout(detailScrollTimerRef.current);
            detailScrollTimerRef.current = null;
          }
          
          // 2. Interrupt ongoing smooth scroll by snapping to current scroll position
          if (isAutoScrolling) {
            window.scrollTo({ top: window.scrollY });
            isAutoScrolling = false;
          }
          
          cleanupListeners();
        };

        const cleanupListeners = () => {
          window.removeEventListener('wheel', cancelAutoScroll);
          window.removeEventListener('touchmove', cancelAutoScroll);
          window.removeEventListener('mousedown', cancelAutoScroll);
          window.removeEventListener('keydown', cancelAutoScroll);
        };

        // Bind events
        window.addEventListener('wheel', cancelAutoScroll, { passive: true });
        window.addEventListener('touchmove', cancelAutoScroll, { passive: true });
        window.addEventListener('mousedown', cancelAutoScroll, { passive: true });
        window.addEventListener('keydown', cancelAutoScroll, { passive: true });

        detailScrollTimerRef.current = setTimeout(() => {
          // Check if we have a target comment ID to scroll to
          const targetCommentElement = targetCommentId ? document.getElementById(`comment-${targetCommentId}`) : null;
          const element = targetCommentElement || document.getElementById('comments-section');
          
          if (element) {
            const header = document.querySelector('.header');
            const headerHeight = header ? header.getBoundingClientRect().height : 72;
            const elementPosition = element.getBoundingClientRect().top + window.scrollY;
            
            isAutoScrolling = true;
            window.scrollTo({
              top: targetCommentElement ? elementPosition - headerHeight - 16 : elementPosition - headerHeight, // Scroll to comments section flush, or comment card with a 16px buffer
              behavior: 'smooth'
            });
            
            // Keep listeners active for 800ms during the smooth scroll animation
            setTimeout(() => {
              cleanupListeners();
            }, 800);

            // If we scrolled to a specific comment, auto-clear the highlight state after 3 seconds
            if (targetCommentId) {
              setTimeout(() => {
                setTargetCommentId(null);
              }, 3000);
            }
          } else {
            cleanupListeners();
            setTargetCommentId(null);
          }
          
          // Clear target comment id from sessionStorage so it doesn't trigger on subsequent visits
          sessionStorage.removeItem('datahive_target_comment_id');
        }, 150); // Delay to allow layout rendering and correct coordinate calculation

        return () => {
          cleanupListeners();
          if (detailScrollTimerRef.current) {
            clearTimeout(detailScrollTimerRef.current);
          }
        };
      }
    }
  }, [selectedPollId, returnProfile]);

  // Handle Voting
  const handleVote = async (pollId, optionId) => {
    const previousVote = userVotes[pollId];
    try {
      const updatedPoll = await votePoll(pollId, optionId, previousVote);
      
      // Save to local user votes state
      const nextVotes = { ...userVotes };
      if (optionId === null) {
        delete nextVotes[pollId];
      } else {
        nextVotes[pollId] = optionId;
      }
      setUserVotes(nextVotes);
      localStorage.setItem('datahive_user_votes', JSON.stringify(nextVotes));

      // Update polls list state
      setPolls(polls.map(p => p.id === pollId ? updatedPoll : p));
    } catch (e) {
      console.error(e);
    }
  };

  // Handle Commenting
  const handleAddComment = async (commenterName, text, votedOptionId) => {
    if (!selectedPollId) return;
    try {
      const { poll: updatedPoll } = await addComment(selectedPollId, commenterName, text, votedOptionId);
      setPolls(polls.map(p => p.id === selectedPollId ? updatedPoll : p));
    } catch (e) {
      console.error(e);
    }
  };

  // Handle Upvoting a comment (supports like/unlike toggling)
  const handleLikeComment = async (commentId) => {
    if (!selectedPollId) return;
    
    const isAlreadyLiked = !!userLikedComments[commentId];
    try {
      const updatedPoll = await likeComment(selectedPollId, commentId, isAlreadyLiked);
      
      const nextLikes = { ...userLikedComments };
      if (isAlreadyLiked) {
        delete nextLikes[commentId];
      } else {
        nextLikes[commentId] = true;
      }
      setUserLikedComments(nextLikes);
      localStorage.setItem('datahive_user_liked_comments', JSON.stringify(nextLikes));

      setPolls(polls.map(p => p.id === selectedPollId ? updatedPoll : p));
    } catch (e) {
      console.error(e);
    }
  };

  // Handle Deleting a comment
  const handleDeleteComment = (commentId) => {
    if (!selectedPollId) return;
    
    setConfirmModalConfig({
      isOpen: true,
      title: '确认删除观点',
      message: '你确定要彻底删除这条发表的观点吗？删除后将无法恢复。',
      onConfirm: async () => {
        try {
          const updatedPoll = await deleteComment(selectedPollId, commentId);
          setPolls(polls.map(p => p.id === selectedPollId ? updatedPoll : p));
          setConfirmModalConfig(prev => ({ ...prev, isOpen: false }));
        } catch (e) {
          console.error(e);
        }
      }
    });
  };

  // Handle User Login/Auto-Registration
  const handleLogin = async (username, password) => {
    try {
      const user = await loginOrRegister(username, password);
      setCurrentUser(user);
      setShowLoginForm(false);
    } catch (error) {
      throw error;
    }
  };

  // Handle User Logout
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('datahive_current_user');
    localStorage.removeItem('datahive_token');
  };

  // Handle Create New Poll
  const handleCreatePoll = async (pollData) => {
    if (!currentUser) {
      setShowLoginForm(true);
      return;
    }

    try {
      const newPoll = await createPoll(
        pollData.question,
        pollData.desc,
        pollData.category,
        pollData.tags,
        pollData.options,
        currentUser.username,
        currentUser.avatar
      );

      setPolls([newPoll, ...polls]);
      setShowCreateForm(false);
      
      // Automatically navigate to the new poll
      sessionStorage.removeItem(`datahive_return_profile_${newPoll.id}`);
      window.location.hash = newPoll.id;
    } catch (e) {
      console.error(e);
    }
  };

  // Navigate back in history to align with browser and mouse back/forward button behaviors
  const handleBackToFeed = () => {
    let stack = [];
    try {
      stack = JSON.parse(sessionStorage.getItem('datahive_history_stack') || '[]');
    } catch (e) {}
    const currentIndex = parseInt(sessionStorage.getItem('datahive_current_index') || '-1');
    const currentState = stack[currentIndex] || {};
    const savedReturnProfile = currentState.returnProfile || null;

    if (savedReturnProfile) {
      const targetHash = `#user-${savedReturnProfile}`;
      
      let targetIndex = -1;
      for (let i = currentIndex - 1; i >= 0; i--) {
        if (stack[i] && decodeURIComponent(stack[i].hash) === decodeURIComponent(targetHash)) {
          targetIndex = i;
          break;
        }
      }
      
      if (targetIndex !== -1 && currentIndex !== -1) {
        window.history.go(targetIndex - currentIndex);
      } else {
        window.location.hash = targetHash;
      }
    } else {
      let stack = [];
      try {
        stack = JSON.parse(sessionStorage.getItem('datahive_history_stack') || '[]');
      } catch (e) {}
      const currentIndex = parseInt(sessionStorage.getItem('datahive_current_index') || '-1');
      
      let targetIndex = -1;
      for (let i = currentIndex - 1; i >= 0; i--) {
        if (stack[i] && (stack[i].hash === '' || stack[i].hash === '#')) {
          targetIndex = i;
          break;
        }
      }
      
      if (targetIndex !== -1 && currentIndex !== -1) {
        window.history.go(targetIndex - currentIndex);
      } else {
        window.location.hash = '';
      }
    }
  };

  const handleUserClick = (username) => {
    if (selectedPollId) {
      sessionStorage.setItem(`datahive_return_poll_user-${username}`, selectedPollId);
    } else {
      sessionStorage.removeItem(`datahive_return_poll_user-${username}`);
    }
    window.location.hash = `user-${username}`;
  };

  const handleBack = () => {
    let stack = [];
    try {
      stack = JSON.parse(sessionStorage.getItem('datahive_history_stack') || '[]');
    } catch (e) {}
    const currentIndex = parseInt(sessionStorage.getItem('datahive_current_index') || '-1');
    const currentState = stack[currentIndex] || {};
    const savedReturnPoll = currentState.returnPoll || null;

    if (savedReturnPoll) {
      const targetHash = `#${savedReturnPoll}`;
      
      let targetIndex = -1;
      for (let i = currentIndex - 1; i >= 0; i--) {
        if (stack[i] && decodeURIComponent(stack[i].hash) === decodeURIComponent(targetHash)) {
          targetIndex = i;
          break;
        }
      }
      
      if (targetIndex !== -1 && currentIndex !== -1) {
        window.history.go(targetIndex - currentIndex);
      } else {
        window.location.hash = savedReturnPoll;
      }
    } else {
      let stack = [];
      try {
        stack = JSON.parse(sessionStorage.getItem('datahive_history_stack') || '[]');
      } catch (e) {}
      const currentIndex = parseInt(sessionStorage.getItem('datahive_current_index') || '-1');
      
      let targetIndex = -1;
      for (let i = currentIndex - 1; i >= 0; i--) {
        if (stack[i] && (stack[i].hash === '' || stack[i].hash === '#')) {
          targetIndex = i;
          break;
        }
      }
      
      if (targetIndex !== -1 && currentIndex !== -1) {
        window.history.go(targetIndex - currentIndex);
      } else {
        window.location.hash = '';
      }
    }
  };

  // Filter polls based on active category & search queries
  const filteredPolls = polls.filter(poll => {
    const matchesCategory = activeCategory === 'all' || poll.category === activeCategory;
    
    const query = searchQuery.toLowerCase().trim();
    if (!query) return matchesCategory;

    const matchesQuestion = poll.question.toLowerCase().includes(query);
    const matchesDesc = poll.desc?.toLowerCase().includes(query);
    const matchesTags = Array.isArray(poll.tags) && poll.tags.some(tag => tag.toLowerCase().includes(query));
    
    return matchesCategory && (matchesQuestion || matchesDesc || matchesTags);
  });

  const selectedPoll = polls.find(p => p.id === selectedPollId);

  return (
    <div className="app-container">
      {/* Header Bar */}
      <Header 
        searchQuery={searchQuery}
        onSearch={setSearchQuery} 
        onCreateClick={() => {
          if (currentUser) {
            setShowCreateForm(true);
          } else {
            setShowLoginForm(true);
          }
        }} 
        theme={theme}
        toggleTheme={toggleTheme}
        currentUser={currentUser}
        onLoginClick={() => setShowLoginForm(true)}
        onLogoutClick={handleLogout}
        onLogoClick={() => {
          setSearchQuery('');
          setActiveCategory('all');
          
          let stack = [];
          try {
            stack = JSON.parse(sessionStorage.getItem('datahive_history_stack') || '[]');
          } catch (e) {}
          const currentIndex = parseInt(sessionStorage.getItem('datahive_current_index') || '0');
          if (stack[currentIndex]) {
            stack[currentIndex].scrollY = 0;
            sessionStorage.setItem('datahive_history_stack', JSON.stringify(stack));
          }

          window.location.hash = '';
          if (!selectedPollId && !selectedUsername) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
        onUserClick={handleUserClick}
      />

      <div className="main-content">
        {/* Sidebar Nav */}
        <Sidebar 
          activeCategory={activeCategory} 
          onCategoryChange={(catId) => {
            setActiveCategory(catId);
            
            let stack = [];
            try {
              stack = JSON.parse(sessionStorage.getItem('datahive_history_stack') || '[]');
            } catch (e) {}
            const currentIndex = parseInt(sessionStorage.getItem('datahive_current_index') || '0');
            if (stack[currentIndex]) {
              stack[currentIndex].scrollY = 0;
              sessionStorage.setItem('datahive_history_stack', JSON.stringify(stack));
            }
            
            window.scrollTo({ top: 0 });
            // If in detailed view or user profile, reset hash to empty to return to feed
            if (selectedPollId || selectedUsername) {
              window.location.hash = '';
            }
          }} 
          totalPolls={polls.length}
        />

        {/* Main Feed / Detailed view */}
        <main style={{ minWidth: 0 }}>
          {selectedUsername ? (
            <UserProfile 
              username={selectedUsername}
              polls={polls}
              onBack={handleBack}
              onPollSelect={(pollId, scrollToComments = false, commentId = null) => {
                if (scrollToComments) {
                  sessionStorage.setItem('datahive_scroll_to_comments', 'true');
                  if (commentId) {
                    sessionStorage.setItem('datahive_target_comment_id', commentId);
                  }
                } else {
                  sessionStorage.setItem('datahive_from_profile', 'true');
                }
                sessionStorage.setItem(`datahive_return_profile_${pollId}`, selectedUsername); // Save return profile path to sessionStorage with poll ID prefix
                setReturnProfile(selectedUsername);
                window.location.hash = pollId;
              }}
              currentUser={currentUser}
            />
          ) : selectedPollId && selectedPoll ? (
            // Detailed View
            <div className="poll-detail-layout">
              <div>
                <button className="back-nav-btn" onClick={handleBackToFeed}>
                  <ArrowLeft size={16} />
                  <span>{returnProfile ? '返回个人主页' : '返回话题列表'}</span>
                </button>
                
                <PollCard 
                  poll={selectedPoll} 
                  userVote={userVotes[selectedPoll.id]}
                  onVote={handleVote}
                  isDetailedView={true}
                  onUserClick={handleUserClick}
                />
                <VoterInsights poll={selectedPoll} />
              </div>

              <div>
                <CommentsSection 
                  poll={selectedPoll}
                  userVote={userVotes[selectedPoll.id]}
                  userLikedComments={userLikedComments}
                  onAddComment={handleAddComment}
                  onLikeComment={handleLikeComment}
                  currentUser={currentUser}
                  onLoginClick={() => setShowLoginForm(true)}
                  onUserClick={handleUserClick}
                  onDeleteComment={handleDeleteComment}
                  targetCommentId={targetCommentId}
                />
              </div>
            </div>
          ) : (
            // Home Feed View
            <div className="feed-container">
              <div className="feed-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <LayoutGrid size={20} style={{ color: 'var(--color-primary)' }} />
                  <h1 className="feed-title">
                    {activeCategory === 'all' ? '探索大伙的想法' : `${activeCategory} 专区`}
                  </h1>
                </div>
                {searchQuery && (
                  <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
                    找到 {filteredPolls.length} 个相关话题
                  </span>
                )}
              </div>

              {/* Poll List Grid */}
              {filteredPolls.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {filteredPolls.map(poll => (
                    <PollCard 
                      key={poll.id} 
                      poll={poll} 
                      userVote={userVotes[poll.id]}
                      onVote={handleVote}
                      onSelect={(id) => {
                        sessionStorage.removeItem(`datahive_return_profile_${id}`);
                        window.location.hash = id;
                      }}
                      onUserClick={handleUserClick}
                    />
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <Sparkles size={48} className="animate-pulse-subtle" style={{ color: 'var(--text-muted)' }} />
                  <h3>这里暂时没有发现符合的话题</h3>
                  <p style={{ maxWidth: '400px', fontSize: '14px', lineHeight: '1.4' }}>
                    没有找到符合条件的话题？不如大开脑洞，自己发起一个！让我们一起集思广益。
                  </p>
                  <button className="btn btn-primary" onClick={() => {
                    if (currentUser) {
                      setShowCreateForm(true);
                    } else {
                      setShowLoginForm(true);
                    }
                  }}>
                    <Plus size={16} />
                    <span>发起首个话题</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Create Poll Dialog */}
      {showCreateForm && (
        <CreatePollForm 
          onClose={() => setShowCreateForm(false)} 
          onSubmit={handleCreatePoll}
        />
      )}

      {/* LoginForm Dialog */}
      {showLoginForm && (
        <LoginForm 
          onClose={() => setShowLoginForm(false)} 
          onLogin={handleLogin}
        />
      )}

      {/* ConfirmModal Dialog */}
      <ConfirmModal 
        isOpen={confirmModalConfig.isOpen}
        title={confirmModalConfig.title}
        message={confirmModalConfig.message}
        onConfirm={confirmModalConfig.onConfirm}
        onCancel={() => setConfirmModalConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
