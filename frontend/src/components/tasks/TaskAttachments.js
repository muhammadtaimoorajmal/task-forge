import React, { useState, useEffect, useRef } from 'react';
import { attachmentAPI } from '../../services/api';
import SocketService from '../../services/socket';

const TaskAttachments = ({ taskId, currentUser }) => {
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef();

  const socketServiceRef = useRef();

  useEffect(() => {
    fetchAttachments();
  }, [taskId]);

  useEffect(() => {
    socketServiceRef.current = SocketService;
    
    // Listen for new attachments
    socketServiceRef.current.onAttachmentUploaded((data) => {
      if (data.taskId === parseInt(taskId)) {
        setAttachments(prev => [data.attachment, ...prev]);
      }
    });

    // Listen for deleted attachments
    socketServiceRef.current.onAttachmentDeleted((data) => {
      if (data.taskId === parseInt(taskId)) {
        setAttachments(prev => prev.filter(att => att.id !== data.attachmentId));
      }
    });

    return () => {
      if (socketServiceRef.current) {
        socketServiceRef.current.offAttachmentUploaded();
        socketServiceRef.current.offAttachmentDeleted();
      }
    };
  }, [taskId]);

  const fetchAttachments = async () => {
    try {
      const response = await attachmentAPI.getByTask(taskId);
      setAttachments(response.data);
    } catch (error) {
      console.error('Error fetching attachments:', error);
      setError('Failed to load attachments');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      await attachmentAPI.upload(taskId, formData);
      // File will be added via socket event
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to upload file');
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) {
      return;
    }

    try {
      await attachmentAPI.delete(attachmentId);
      // Attachment will be removed via socket event
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to delete file');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType) => {
    if (fileType?.includes('image')) return '🖼️';
    if (fileType?.includes('pdf')) return '📄';
    if (fileType?.includes('word')) return '📝';
    if (fileType?.includes('excel') || fileType?.includes('sheet')) return '📊';
    if (fileType?.includes('text')) return '📄';
    return '📎';
  };

  return (
    <div className="task-attachments">
      <div className="attachments-header">
        <h4>Attachments ({attachments.length})</h4>
        <button 
          className="btn btn-outline btn-sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? 'Uploading...' : '+ Add File'}
        </button>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        style={{ display: 'none' }}
        accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt,.xls,.xlsx"
      />

      {error && <div className="error-message">{error}</div>}

      {/* Attachments List */}
      <div className="attachments-list">
        {attachments.length === 0 ? (
          <div className="empty-attachments">
            No attachments yet. Upload files to share with your team!
          </div>
        ) : (
          attachments.map(attachment => (
            <div key={attachment.id} className="attachment-item">
              <div className="attachment-info">
                <span className="file-icon">{getFileIcon(attachment.file_type)}</span>
                <div className="file-details">
                  <div className="file-name">{attachment.original_name}</div>
                  <div className="file-meta">
                    {formatFileSize(attachment.file_size)} • 
                    Uploaded by {attachment.username} • 
                    {new Date(attachment.uploaded_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="attachment-actions">
                <a 
                  href={`http://localhost:5000/api/attachments/${attachment.id}/download`}
                  className="btn btn-outline btn-sm"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Download
                </a>
                {(currentUser.id === attachment.user_id || currentUser.role === 'admin') && (
                  <button 
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDeleteAttachment(attachment.id)}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TaskAttachments;