import io from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  connect() {
    if (!this.socket) {
      this.socket = io('http://localhost:5000');
      
      this.socket.on('connect', () => {
        console.log('🔌 Connected to server');
        this.isConnected = true;
      });

      this.socket.on('disconnect', () => {
        console.log('🔌 Disconnected from server');
        this.isConnected = false;
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        this.isConnected = false;
      });
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  joinProject(projectId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join_project', projectId);
    }
  }

  joinTask(taskId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join_task', taskId);
    }
  }

  // Task Events
  onTaskUpdated(callback) {
    if (this.socket) {
      this.socket.on('task_updated', callback);
    }
  }

  onTaskCreated(callback) {
    if (this.socket) {
      this.socket.on('task_created', callback);
    }
  }

  onTaskUpdatedDetails(callback) {
    if (this.socket) {
      this.socket.on('task_updated_details', callback);
    }
  }

  onTaskAssigned(callback) {
    if (this.socket) {
      this.socket.on('task_assigned', callback);
    }
  }

  // Comment Events
  onNewComment(callback) {
    if (this.socket) {
      this.socket.on('new_comment', callback);
    }
  }

  // Attachment Events
  onAttachmentUploaded(callback) {
    if (this.socket) {
      this.socket.on('attachment_uploaded', callback);
    }
  }

  onAttachmentDeleted(callback) {
    if (this.socket) {
      this.socket.on('attachment_deleted', callback);
    }
  }

  // Remove Event Listeners
  offTaskUpdated(callback) {
    if (this.socket) {
      this.socket.off('task_updated', callback);
    }
  }

  offTaskCreated(callback) {
    if (this.socket) {
      this.socket.off('task_created', callback);
    }
  }

  offTaskUpdatedDetails(callback) {
    if (this.socket) {
      this.socket.off('task_updated_details', callback);
    }
  }

  offTaskAssigned(callback) {
    if (this.socket) {
      this.socket.off('task_assigned', callback);
    }
  }

  offNewComment(callback) {
    if (this.socket) {
      this.socket.off('new_comment', callback);
    }
  }

  offAttachmentUploaded(callback) {
    if (this.socket) {
      this.socket.off('attachment_uploaded', callback);
    }
  }

  offAttachmentDeleted(callback) {
    if (this.socket) {
      this.socket.off('attachment_deleted', callback);
    }
  }

  // Emit Events
  emitTaskUpdated(data) {
    if (this.socket && this.isConnected) {
      this.socket.emit('task_updated', data);
    }
  }

  emitTaskCreated(data) {
    if (this.socket && this.isConnected) {
      this.socket.emit('task_created', data);
    }
  }

  emitNewComment(data) {
    if (this.socket && this.isConnected) {
      this.socket.emit('new_comment', data);
    }
  }
}

export default new SocketService();