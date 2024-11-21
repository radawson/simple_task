// src/components/common/Toast.jsx
import React, { useEffect } from 'react';
import { MDBToast } from 'mdb-react-ui-kit';

const Toast = ({ 
  show = false, 
  message = '', 
  type = 'info', 
  onClose = () => {}, 
  duration = 3000 
}) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, onClose, duration]);

  if (!show) return null;

  const { color, title, icon } = {
    success: { color: 'success', title: 'Success', icon: 'check-circle' },
    error: { color: 'danger', title: 'Error', icon: 'exclamation-circle' },
    warning: { color: 'warning', title: 'Warning', icon: 'exclamation-triangle' },
    info: { color: 'info', title: 'Notification', icon: 'info-circle' }
  }[type] || { color: 'info', title: 'Notification', icon: 'info-circle' };

  return (
    <div style={{ 
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 1050,
      minWidth: '250px',
      maxWidth: '350px'
    }}>
      <MDBToast
        color={color}
        className="mb-3 fade show"
        autohide={false}
        headerContent={
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <i className={`fas fa-${icon} me-2`}></i>
              <span className="fw-bold">{title}</span>
            </div>
            <button 
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
            />
          </div>
        }
      >
        <div className="toast-body">{message}</div>
      </MDBToast>
    </div>
  );
};

export default Toast;