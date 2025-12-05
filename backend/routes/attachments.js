const express = require('express');
const { uploadAttachment, getTaskAttachments, deleteAttachment, downloadAttachment } = require('../controllers/attachmentController');
const { authenticateToken } = require('../middleware/auth');
const upload = require('../config/upload');

const router = express.Router();

router.post('/:taskId/upload', authenticateToken, upload.single('file'), uploadAttachment);
router.get('/:taskId', authenticateToken, getTaskAttachments);
router.delete('/:attachmentId', authenticateToken, deleteAttachment);
router.get('/:attachmentId/download', authenticateToken, downloadAttachment);

module.exports = router;