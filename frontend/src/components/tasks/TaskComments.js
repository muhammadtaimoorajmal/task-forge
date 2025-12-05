import React, { useState, useEffect, useRef } from 'react';
import { taskAPI } from '../../services/api';
import SocketService from '../../services/socket';

const TaskComments = ({ taskId, currentUser }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const socketServiceRef = useRef();

  useEffect(() => {
    fetchComments();
  }, [taskId]);

  useEffect(() => {
    socketServiceRef.current = SocketService;
    
    // Join task room for comments
    if (taskId) {
      socketServiceRef.current.joinTask(taskId);
    }

    // Listen for new comments
    socketServiceRef.current.onNewComment((data) => {
      if (data.taskId === parseInt(taskId)) {
        setComments(prevComments => [...prevComments, data.comment]);
      }
    });

    return () => {
      if (socketServiceRef.current) {
        socketServiceRef.current.offNewComment();
      }
    };
  }, [taskId]);

  const fetchComments = async () => {
    try {
      const response = await taskAPI.getComments(taskId);
      setComments(response.data);
    } catch (error) {
      console.error('Error fetching comments:', error);
      setError('Failed to load comments');
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim()) {
      setError('Comment cannot be empty');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await taskAPI.addComment(taskId, { comment_text: newComment });
      setComments([...comments, response.data.comment]);
      setNewComment('');
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to add comment');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div className="task-comments">
      <h4>Comments ({comments.length})</h4>
      
      {error && <div className="error-message">{error}</div>}

      {/* Comments List */}
      <div className="comments-list">
        {comments.length === 0 ? (
          <div className="empty-comments">
            No comments yet. Be the first to comment!
          </div>
        ) : (
          comments.map(comment => (
            <div key={comment.id} className="comment-item">
              <div className="comment-header">
                <strong className="comment-author">{comment.username}</strong>
                <span className="comment-time">
                  {formatTime(comment.created_at)}
                </span>
              </div>
              <div className="comment-text">
                {comment.comment_text}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Comment Form */}
      <form onSubmit={handleAddComment} className="add-comment-form">
        <div className="form-group">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            rows="3"
            disabled={loading}
            required
          />
        </div>
        <div className="form-actions">
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading || !newComment.trim()}
          >
            {loading ? 'Adding...' : 'Add Comment'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TaskComments;