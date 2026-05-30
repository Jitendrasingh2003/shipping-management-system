const Notification = require('../models/mongodb/Notification');

// @desc  Get notifications for logged-in user
// @route GET /api/notifications
const getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 15 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({ userId: req.user.id }).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Notification.countDocuments({ userId: req.user.id }),
      Notification.countDocuments({ userId: req.user.id, isRead: false }),
    ]);
    res.json({ success: true, notifications, total, unreadCount });
  } catch (err) { next(err); }
};

// @desc  Mark notification as read
// @route PUT /api/notifications/:id/read
const markRead = async (req, res, next) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true, readAt: new Date() });
    res.json({ success: true, message: 'Marked as read.' });
  } catch (err) { next(err); }
};

// @desc  Mark all as read
// @route PUT /api/notifications/read-all
const markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ userId: req.user.id, isRead: false }, { isRead: true, readAt: new Date() });
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) { next(err); }
};

// @desc  Delete notification
// @route DELETE /api/notifications/:id
const deleteNotification = async (req, res, next) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Notification deleted.' });
  } catch (err) { next(err); }
};

module.exports = { getNotifications, markRead, markAllRead, deleteNotification };
