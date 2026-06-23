const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { query, initDB } = require('./db.cjs');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'datahive_neon_secret_key_2026';

app.use(cors());
app.use(express.json());

// JWT Authentication Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Access token required' });
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}

// Optional Auth Middleware (attaches user if token is present, does not block)
function optionalAuthenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    req.user = null;
    return next();
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      req.user = null;
    } else {
      req.user = user;
    }
    next();
  });
}

// Helper to identify user IP (for anonymous voters)
function getClientIp(req) {
  return req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'anonymous_ip';
}

// Helper to safely parse tags from database
function parseTags(tagsStr) {
  try {
    const parsed = JSON.parse(tagsStr);
    if (Array.isArray(parsed)) return parsed;
    if (typeof parsed === 'string') {
      return parsed.split(',').map(t => t.trim()).filter(t => t.length > 0);
    }
  } catch (e) {
    if (typeof tagsStr === 'string') {
      return tagsStr.split(',').map(t => t.trim()).filter(t => t.length > 0);
    }
  }
  return [];
}

// --- ROUTES ---

// 1. Auth Routing
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    // Check if user exists
    let user = await query.get('SELECT * FROM users WHERE username = ?', [username]);
    
    if (!user) {
      // Auto-Registration
      const passwordHash = await bcrypt.hash(password, 10);
      const avatar = username.charAt(0).toUpperCase();
      
      const result = await query.run(
        'INSERT INTO users (username, password_hash, avatar) VALUES (?, ?, ?)',
        [username, passwordHash, avatar]
      );
      
      user = { id: result.id, username, avatar };
      console.log(`Auto-registered new user: ${username}`);
    } else {
      // Verify Password
      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(400).json({ error: '该昵称已被占用，请输入正确的密码以登录，或更换一个新昵称进行快速注册。' });
      }
    }

    // Generate JWT
    const token = jwt.sign({ username: user.username, avatar: user.avatar }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({
      token,
      user: {
        username: user.username,
        avatar: user.avatar
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Database error during auth' });
  }
});

// 2. Polls Routing
// 2.1 Get all polls
app.get('/api/polls', async (req, res) => {
  try {
    const polls = await query.all('SELECT * FROM polls ORDER BY created_at DESC');
    const result = [];

    for (const poll of polls) {
      const options = await query.all('SELECT * FROM options WHERE poll_id = ?', [poll.id]);
      const comments = await query.all('SELECT * FROM comments WHERE poll_id = ? ORDER BY created_at DESC', [poll.id]);
      
      result.push({
        id: poll.id,
        question: poll.question,
        desc: poll.desc,
        creator: {
          name: poll.creator_name,
          avatar: poll.creator_avatar
        },
        category: poll.category,
        tags: parseTags(poll.tags),
        options: options.map(opt => ({
          id: opt.id,
          text: opt.text,
          votes: opt.votes
        })),
        comments: comments.map(c => ({
          id: c.id,
          author: c.author,
          avatar: c.avatar,
          votedOptionId: c.voted_option_id,
          text: c.text,
          timestamp: c.created_at,
          likes: c.likes
        })),
        createdAt: poll.created_at
      });
    }

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch polls' });
  }
});

// 2.2 Create a poll
app.post('/api/polls', authenticateToken, async (req, res) => {
  const { question, desc, category, tags, options } = req.body;
  const creator = req.user; // from JWT token

  if (!question || !options || options.length < 2) {
    return res.status(400).json({ error: 'Question and at least 2 options are required' });
  }

  const pollId = 'poll-' + Date.now();

  try {
    let tagsArray = [];
    if (Array.isArray(tags)) {
      tagsArray = tags;
    } else if (typeof tags === 'string') {
      tagsArray = tags.split(',').map(t => t.trim()).filter(t => t.length > 0);
    }

    // Insert Poll
    await query.run(
      'INSERT INTO polls (id, question, desc, creator_name, creator_avatar, category, tags) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        pollId,
        question,
        desc || '',
        creator.username,
        creator.avatar,
        category || '🎬 娱乐',
        JSON.stringify(tagsArray)
      ]
    );

    // Insert Options
    for (let i = 0; i < options.length; i++) {
      const optId = `opt-${Date.now()}-${i}`;
      await query.run(
        'INSERT INTO options (id, poll_id, text, votes) VALUES (?, ?, ?, 0)',
        [optId, pollId, options[i].text]
      );
    }

    // Fetch and return the newly created poll
    const dbPoll = await query.get('SELECT * FROM polls WHERE id = ?', [pollId]);
    const dbOpts = await query.all('SELECT * FROM options WHERE poll_id = ?', [pollId]);

    res.json({
      id: dbPoll.id,
      question: dbPoll.question,
      desc: dbPoll.desc,
      creator: {
        name: dbPoll.creator_name,
        avatar: dbPoll.creator_avatar
      },
      category: dbPoll.category,
      tags: parseTags(dbPoll.tags),
      options: dbOpts.map(opt => ({ id: opt.id, text: opt.text, votes: opt.votes })),
      comments: [],
      createdAt: dbPoll.created_at
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create poll' });
  }
});

// 2.3 Vote on a poll
app.post('/api/polls/:id/vote', optionalAuthenticate, async (req, res) => {
  const pollId = req.params.id;
  const { optionId } = req.body; // optionId is null if user wants to clear vote
  
  // Use username if logged in, otherwise fall back to client IP as identifier
  const voterId = req.user ? req.user.username : getClientIp(req);

  try {
    // Check if voter has already voted on this poll
    const existingVote = await query.get('SELECT * FROM votes WHERE poll_id = ? AND username = ?', [pollId, voterId]);

    if (optionId === null || optionId === undefined) {
      // Clear choice (Revote reset)
      if (existingVote) {
        // Decrease votes count for the previous option
        await query.run('UPDATE options SET votes = MAX(0, votes - 1) WHERE id = ?', [existingVote.option_id]);
        // Delete vote record
        await query.run('DELETE FROM votes WHERE id = ?', [existingVote.id]);
      }
    } else {
      // Check if option belongs to the poll
      const option = await query.get('SELECT * FROM options WHERE id = ? AND poll_id = ?', [optionId, pollId]);
      if (!option) {
        return res.status(400).json({ error: 'Invalid option selected' });
      }

      if (existingVote) {
        if (existingVote.option_id !== optionId) {
          // Changed choice: decrease old option, increase new option, update vote record
          await query.run('UPDATE options SET votes = MAX(0, votes - 1) WHERE id = ?', [existingVote.option_id]);
          await query.run('UPDATE options SET votes = votes + 1 WHERE id = ?', [optionId]);
          await query.run('UPDATE votes SET option_id = ? WHERE id = ?', [optionId, existingVote.id]);
        }
      } else {
        // Fresh vote: increase option count, insert vote record
        await query.run('UPDATE options SET votes = votes + 1 WHERE id = ?', [optionId]);
        await query.run('INSERT INTO votes (poll_id, username, option_id) VALUES (?, ?, ?)', [pollId, voterId, optionId]);
      }
    }

    // Return the updated poll data
    const poll = await query.get('SELECT * FROM polls WHERE id = ?', [pollId]);
    const options = await query.all('SELECT * FROM options WHERE poll_id = ?', [pollId]);
    const comments = await query.all('SELECT * FROM comments WHERE poll_id = ? ORDER BY created_at DESC', [pollId]);

    res.json({
      id: poll.id,
      question: poll.question,
      desc: poll.desc,
      creator: { name: poll.creator_name, avatar: poll.creator_avatar },
      category: poll.category,
      tags: parseTags(poll.tags),
      options: options.map(opt => ({ id: opt.id, text: opt.text, votes: opt.votes })),
      comments: comments.map(c => ({
        id: c.id,
        author: c.author,
        avatar: c.avatar,
        votedOptionId: c.voted_option_id,
        text: c.text,
        timestamp: c.created_at,
        likes: c.likes
      })),
      createdAt: poll.created_at
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to record vote' });
  }
});

// 3. Comments Routing
// 3.1 Post comment
app.post('/api/polls/:id/comments', authenticateToken, async (req, res) => {
  const pollId = req.params.id;
  const { text } = req.body;
  const commenter = req.user; // from JWT token

  if (!text) {
    return res.status(400).json({ error: 'Comment text is required' });
  }

  const commentId = 'c-' + Date.now();

  try {
    // Auto-detect comment author's voted option for this poll
    const voteRecord = await query.get('SELECT option_id FROM votes WHERE poll_id = ? AND username = ?', [pollId, commenter.username]);
    const votedOptionId = voteRecord ? voteRecord.option_id : null;

    // Insert comment
    await query.run(
      'INSERT INTO comments (id, poll_id, author, avatar, voted_option_id, text, likes) VALUES (?, ?, ?, ?, ?, ?, 0)',
      [
        commentId,
        pollId,
        commenter.username,
        commenter.avatar,
        votedOptionId,
        text
      ]
    );

    // Return the updated poll data
    const poll = await query.get('SELECT * FROM polls WHERE id = ?', [pollId]);
    const options = await query.all('SELECT * FROM options WHERE poll_id = ?', [pollId]);
    const comments = await query.all('SELECT * FROM comments WHERE poll_id = ? ORDER BY created_at DESC', [pollId]);

    res.json({
      id: poll.id,
      question: poll.question,
      desc: poll.desc,
      creator: { name: poll.creator_name, avatar: poll.creator_avatar },
      category: poll.category,
      tags: parseTags(poll.tags),
      options: options.map(opt => ({ id: opt.id, text: opt.text, votes: opt.votes })),
      comments: comments.map(c => ({
        id: c.id,
        author: c.author,
        avatar: c.avatar,
        votedOptionId: c.voted_option_id,
        text: c.text,
        timestamp: c.created_at,
        likes: c.likes
      })),
      createdAt: poll.created_at
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to submit comment' });
  }
});

// 3.2 Like / unlike comment
app.post('/api/polls/:id/comments/:commentId/like', authenticateToken, async (req, res) => {
  const pollId = req.params.id;
  const commentId = req.params.commentId;
  const username = req.user.username; // from JWT token

  try {
    const existingLike = await query.get('SELECT 1 FROM comment_likes WHERE comment_id = ? AND username = ?', [commentId, username]);

    if (existingLike) {
      // Unlike
      await query.run('DELETE FROM comment_likes WHERE comment_id = ? AND username = ?', [commentId, username]);
      await query.run('UPDATE comments SET likes = MAX(0, likes - 1) WHERE id = ?', [commentId]);
    } else {
      // Like
      await query.run('INSERT INTO comment_likes (comment_id, username) VALUES (?, ?)', [commentId, username]);
      await query.run('UPDATE comments SET likes = likes + 1 WHERE id = ?', [commentId]);
    }

    // Return the updated poll data
    const poll = await query.get('SELECT * FROM polls WHERE id = ?', [pollId]);
    const options = await query.all('SELECT * FROM options WHERE poll_id = ?', [pollId]);
    const comments = await query.all('SELECT * FROM comments WHERE poll_id = ? ORDER BY created_at DESC', [pollId]);

    res.json({
      id: poll.id,
      question: poll.question,
      desc: poll.desc,
      creator: { name: poll.creator_name, avatar: poll.creator_avatar },
      category: poll.category,
      tags: parseTags(poll.tags),
      options: options.map(opt => ({ id: opt.id, text: opt.text, votes: opt.votes })),
      comments: comments.map(c => ({
        id: c.id,
        author: c.author,
        avatar: c.avatar,
        votedOptionId: c.voted_option_id,
        text: c.text,
        timestamp: c.created_at,
        likes: c.likes
      })),
      createdAt: poll.created_at
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to switch comment like status' });
  }
});

// 3.3 Delete comment
app.delete('/api/polls/:id/comments/:commentId', authenticateToken, async (req, res) => {
  const pollId = req.params.id;
  const commentId = req.params.commentId;
  const requester = req.user.username; // from JWT token

  try {
    const comment = await query.get('SELECT * FROM comments WHERE id = ?', [commentId]);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    const poll = await query.get('SELECT * FROM polls WHERE id = ?', [pollId]);
    
    // Authorization check: requester must be comment author OR poll creator
    const isAuthor = comment.author.toLowerCase() === requester.toLowerCase();
    const isPollCreator = poll && poll.creator_name.toLowerCase() === requester.toLowerCase();

    if (!isAuthor && !isPollCreator) {
      return res.status(403).json({ error: 'You do not have permission to delete this comment' });
    }

    // Delete comment and its related likes
    await query.run('DELETE FROM comments WHERE id = ?', [commentId]);
    await query.run('DELETE FROM comment_likes WHERE comment_id = ?', [commentId]);

    // Return the updated poll data
    const options = await query.all('SELECT * FROM options WHERE poll_id = ?', [pollId]);
    const comments = await query.all('SELECT * FROM comments WHERE poll_id = ? ORDER BY created_at DESC', [pollId]);

    res.json({
      id: poll.id,
      question: poll.question,
      desc: poll.desc,
      creator: { name: poll.creator_name, avatar: poll.creator_avatar },
      category: poll.category,
      tags: parseTags(poll.tags),
      options: options.map(opt => ({ id: opt.id, text: opt.text, votes: opt.votes })),
      comments: comments.map(c => ({
        id: c.id,
        author: c.author,
        avatar: c.avatar,
        votedOptionId: c.voted_option_id,
        text: c.text,
        timestamp: c.created_at,
        likes: c.likes
      })),
      createdAt: poll.created_at
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

// Serve frontend static assets in production mode
const path = require('path');
const distPath = path.resolve(__dirname, '../dist');
app.use(express.static(distPath));

// Fallback to index.html for SPA router
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(distPath, 'index.html'));
});

// Initialize database then start server
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`DataHive backend server is running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize database:', err);
});
