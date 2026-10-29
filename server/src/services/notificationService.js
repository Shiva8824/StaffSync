const Notification = require('../models/Notification');

/**
 * Creates a notification for a specific user
 */
const createNotification = async ({ recipient, title, message, type = 'System', link = '' }) => {
  try {
    const notification = await Notification.create({
      recipient,
      title,
      message,
      type,
      link,
    });
    return notification;
  } catch (error) {
    console.error('[Notification Service Error]', error.message);
    return null;
  }
};

/**
 * Creates notifications for multiple recipients (e.g., all users or department)
 */
const createMultiNotification = async ({ recipients, title, message, type = 'System', link = '' }) => {
  try {
    const docs = recipients.map((recipientId) => ({
      recipient: recipientId,
      title,
      message,
      type,
      link,
    }));
    return await Notification.insertMany(docs);
  } catch (error) {
    console.error('[Multi Notification Error]', error.message);
    return [];
  }
};

module.exports = {
  createNotification,
  createMultiNotification,
};
