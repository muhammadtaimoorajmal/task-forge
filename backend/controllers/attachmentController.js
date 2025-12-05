const db = require('../config/database');
const path = require('path');
const fs = require('fs');
const { getIO } = require('../socket/socketHandler');

const uploadAttachment = (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { filename, originalname, size, mimetype, path: filePath } = req.file;

    // Save attachment to database
    db.run(
      `INSERT INTO task_attachments (task_id, user_id, filename, original_name, file_path, file_size, file_type) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [taskId, userId, filename, originalname, filePath, size, mimetype],
      function(err) {
        if (err) {
          console.error('Error saving attachment:', err);
          // Delete uploaded file if database save fails
          fs.unlinkSync(filePath);
          return res.status(500).json({ error: 'Error saving attachment' });
        }

        // Get the newly created attachment with user info
        db.get(
          `SELECT ta.*, u.username, u.email 
           FROM task_attachments ta
           LEFT JOIN users u ON ta.user_id = u.id
           WHERE ta.id = ?`,
          [this.lastID],
          (err, attachment) => {
            if (err) {
              console.error('Error fetching attachment:', err);
              return res.status(500).json({ error: 'Error fetching attachment' });
            }

            // Emit real-time event
            try {
              const io = getIO();
              io.to(`task_${taskId}`).emit('attachment_uploaded', {
                attachment: attachment,
                taskId: taskId
              });
            } catch (socketError) {
              console.error('Socket emit error:', socketError);
            }

            res.status(201).json({
              message: 'File uploaded successfully!',
              attachment: attachment
            });
          }
        );
      }
    );

  } catch (error) {
    console.error('Upload attachment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getTaskAttachments = (req, res) => {
  try {
    const { taskId } = req.params;

    db.all(
      `SELECT ta.*, u.username, u.email 
       FROM task_attachments ta
       LEFT JOIN users u ON ta.user_id = u.id
       WHERE ta.task_id = ?
       ORDER BY ta.uploaded_at DESC`,
      [taskId],
      (err, attachments) => {
        if (err) {
          console.error('Get attachments error:', err);
          return res.status(500).json({ error: 'Database error' });
        }

        res.json(attachments);
      }
    );

  } catch (error) {
    console.error('Get attachments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteAttachment = (req, res) => {
  try {
    const { attachmentId } = req.params;
    const userId = req.user.id;

    // Get attachment details first
    db.get(
      `SELECT * FROM task_attachments WHERE id = ? AND user_id = ?`,
      [attachmentId, userId],
      (err, attachment) => {
        if (err) {
          console.error('Error finding attachment:', err);
          return res.status(500).json({ error: 'Database error' });
        }

        if (!attachment) {
          return res.status(404).json({ error: 'Attachment not found or access denied' });
        }

        // Delete from database
        db.run(
          'DELETE FROM task_attachments WHERE id = ?',
          [attachmentId],
          function(err) {
            if (err) {
              console.error('Error deleting attachment:', err);
              return res.status(500).json({ error: 'Error deleting attachment' });
            }

            // Delete physical file
            try {
              fs.unlinkSync(attachment.file_path);
            } catch (fileError) {
              console.error('Error deleting file:', fileError);
            }

            // Emit real-time event
            try {
              const io = getIO();
              io.to(`task_${attachment.task_id}`).emit('attachment_deleted', {
                attachmentId: attachmentId,
                taskId: attachment.task_id
              });
            } catch (socketError) {
              console.error('Socket emit error:', socketError);
            }

            res.json({
              message: 'Attachment deleted successfully!',
              attachmentId: attachmentId
            });
          }
        );
      }
    );

  } catch (error) {
    console.error('Delete attachment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const downloadAttachment = (req, res) => {
  try {
    const { attachmentId } = req.params;

    db.get(
      `SELECT * FROM task_attachments WHERE id = ?`,
      [attachmentId],
      (err, attachment) => {
        if (err || !attachment) {
          return res.status(404).json({ error: 'Attachment not found' });
        }

        if (!fs.existsSync(attachment.file_path)) {
          return res.status(404).json({ error: 'File not found on server' });
        }

        res.download(attachment.file_path, attachment.original_name);
      }
    );

  } catch (error) {
    console.error('Download attachment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { uploadAttachment, getTaskAttachments, deleteAttachment, downloadAttachment };