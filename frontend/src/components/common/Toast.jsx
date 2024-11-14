import React from 'react';
import { MDBBtn, MDBToast } from 'mdb-react-ui-kit';

const Toast = ({ message, show, onClose }) => {
  return (
    <MDBToast
      show={show}
      autohide
      position='top-right'
      color='info'
      onClose={onClose}
    >
      {message}
    </MDBToast>
  );
};

export default Toast; // Add default export