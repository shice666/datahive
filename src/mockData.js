// DataHive Production Network API Client (Replaces LocalStorage mockData)

const API_BASE = '/api';

// Helper to get auth header if user is logged in
function getAuthHeaders() {
  const token = localStorage.getItem('datahive_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

// 1. Get all polls
export async function getPolls() {
  try {
    const res = await fetch(`${API_BASE}/polls`);
    if (!res.ok) throw new Error('Failed to fetch polls');
    return await res.json();
  } catch (error) {
    console.error(error);
    return []; // Return empty array on failure to prevent app crashing
  }
}

// 2. Register/Login user
export async function loginOrRegister(username, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Login failed');
  }

  const { token, user } = await res.json();
  localStorage.setItem('datahive_token', token);
  localStorage.setItem('datahive_current_user', JSON.stringify(user));
  return user;
}

// 3. Vote or change vote on a poll
export async function votePoll(pollId, optionId, previousVoteOptionId = null) {
  // OptionId is null if user wants to clear vote (revote reset)
  const res = await fetch(`${API_BASE}/polls/${pollId}/vote`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify({ optionId })
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Voting failed');
  }

  return await res.json(); // Returns the updated poll object
}

// 4. Add comment to a poll
export async function addComment(pollId, commenterName, text, votedOptionId = null) {
  // Note: commenterName and votedOptionId are kept for signature compatibility,
  // but the backend automatically resolves them using JWT authentication.
  const res = await fetch(`${API_BASE}/polls/${pollId}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify({ text })
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to submit comment');
  }

  const updatedPoll = await res.json();
  return { poll: updatedPoll }; // Keep compatibility with original destructuring const { poll } = addComment(...)
}

// 5. Like or unlike a comment
export async function likeComment(pollId, commentId, isAlreadyLiked = false) {
  const res = await fetch(`${API_BASE}/polls/${pollId}/comments/${commentId}/like`, {
    method: 'POST',
    headers: getAuthHeaders()
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to switch like status');
  }

  return await res.json(); // Returns the updated poll object
}

// 6. Delete a comment
export async function deleteComment(pollId, commentId) {
  const res = await fetch(`${API_BASE}/polls/${pollId}/comments/${commentId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to delete comment');
  }

  return await res.json(); // Returns the updated poll object
}

// 7. Create a new poll
export async function createPoll(question, desc, category, tags, options, creatorName = '', creatorAvatar = '') {
  // Translate options array to backend schema
  const formattedOptions = options.map(opt => ({ text: opt }));
  const tagsArray = typeof tags === 'string'
    ? tags.split(',').map(t => t.trim()).filter(t => t.length > 0)
    : (Array.isArray(tags) ? tags : []);

  const res = await fetch(`${API_BASE}/polls`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders()
    },
    body: JSON.stringify({
      question,
      desc,
      category,
      tags: tagsArray,
      options: formattedOptions
    })
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Failed to create poll');
  }

  return await res.json(); // Returns the newly created poll object
}
