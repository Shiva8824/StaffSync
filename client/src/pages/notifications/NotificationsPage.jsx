import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../context/ToastContext';
import { notificationApi } from '../../api/services';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { formatDate } from '../../utils/formatters';
import { Link } from 'react-router-dom';

const NotificationsPage = () => {
  const { showToast } = useToast();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [markAllLoading, setMarkAllLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await notificationApi.getAll();
      if (res.data.success) {
        setNotifications(res.data.notifications);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      showToast('Failed to load notifications', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      // Ignore
    }
  };

  const handleMarkAllAsRead = async () => {
    setMarkAllLoading(true);
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      showToast('All notifications marked as read', 'success');
    } catch (err) {
      showToast('Failed to mark notifications as read', 'error');
    } finally {
      setMarkAllLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await notificationApi.delete(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      showToast('Notification deleted', 'info');
    } catch (err) {
      showToast('Failed to delete notification', 'error');
    }
  };

  const getIconForType = (type) => {
    switch (type) {
      case 'Leave':
        return 'bi-calendar2-check text-warning';
      case 'Attendance':
        return 'bi-clock-history text-primary';
      case 'Announcement':
        return 'bi-megaphone text-info';
      case 'Training':
        return 'bi-mortarboard text-success';
      default:
        return 'bi-info-circle text-secondary';
    }
  };

  return (
    <div className="container-fluid px-0">
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-4">
        <div>
          <h3 className="fw-bold text-dark mb-1">Notifications Center</h3>
          <p className="text-secondary small mb-0">
            Alerts for leave approvals, published announcements, and workshop updates
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            className="btn btn-outline-primary btn-sm px-3 fw-semibold shadow-sm"
            onClick={handleMarkAllAsRead}
            disabled={markAllLoading}
          >
            <i className="bi bi-check2-all me-1"></i>
            {markAllLoading ? 'Marking...' : 'Mark All as Read'}
          </button>
        )}
      </div>

      {loading ? (
        <LoadingSpinner message="Checking for recent alerts..." />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon="bi-bell-slash"
          title="No notifications"
          description="You are completely caught up! New alerts regarding your profile, attendance, leaves, or training will appear here."
        />
      ) : (
        <div className="card shadow-sm border-0">
          <div className="card-header bg-white border-bottom py-3 d-flex align-items-center justify-content-between">
            <span className="fw-bold text-dark small text-uppercase">
              Alerts Inbox ({notifications.length})
            </span>
            {unreadCount > 0 && (
              <span className="badge bg-danger rounded-pill px-2.5">
                {unreadCount} Unread
              </span>
            )}
          </div>

          <div className="list-group list-group-flush">
            {notifications.map((n) => (
              <div
                key={n._id}
                className={`list-group-item p-3.5 d-flex align-items-start gap-3 transition ${
                  !n.isRead ? 'bg-primary bg-opacity-10 border-start border-3 border-primary' : ''
                }`}
              >
                <div
                  className="rounded-circle bg-white border p-2 d-flex align-items-center justify-content-center shadow-sm flex-shrink-0"
                  style={{ width: '42px', height: '42px', fontSize: '1.25rem' }}
                >
                  <i className={`bi ${getIconForType(n.type)}`}></i>
                </div>

                <div className="flex-grow-1 min-width-0">
                  <div className="d-flex align-items-center justify-content-between mb-1 flex-wrap gap-2">
                    <span className="fw-bold text-dark">{n.title}</span>
                    <span className="text-muted small" style={{ fontSize: '0.78rem' }}>
                      {formatDate(n.createdAt)}
                    </span>
                  </div>

                  <p className="text-secondary small mb-2">{n.message}</p>

                  <div className="d-flex align-items-center gap-3">
                    {n.link && (
                      <Link to={n.link} className="btn btn-sm btn-link p-0 text-primary small text-decoration-none">
                        View Details &rarr;
                      </Link>
                    )}

                    {!n.isRead && (
                      <button
                        className="btn btn-sm btn-link p-0 text-secondary small text-decoration-none"
                        onClick={() => handleMarkAsRead(n._id)}
                      >
                        <i className="bi bi-check2 me-1"></i>Mark as Read
                      </button>
                    )}
                  </div>
                </div>

                <button
                  className="btn btn-sm text-muted p-1 hover-danger"
                  onClick={() => handleDelete(n._id)}
                  title="Dismiss notification"
                >
                  <i className="bi bi-x fs-5"></i>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
