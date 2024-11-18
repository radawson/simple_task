// src/components/common/Toast.jsx
import React, { useEffect } from 'react';
import { MDBToast } from 'mdb-react-ui-kit';

const Toast = ({ message, show, onClose }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000); // Auto hide after 3 seconds
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  return show ? (
    <div 
      style={{ 
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 1050 
      }}
    >
      <MDBToast
        show={true}
        color='info'
        className="mb-3"
        autohide={false}
        headerContent={
          <div className="d-flex justify-content-between align-items-center">
            <span>Notification</span>
            <button 
              className="btn-close" 
              onClick={onClose}
            />
          </div>
        }
      >
        {message}
      </MDBToast>
    </div>
  ) : null;
};

export default Toast;