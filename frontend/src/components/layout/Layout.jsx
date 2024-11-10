import React from 'react';
import Navbar from './Navbar';
import Toast from '../common/Toast';

const Layout = ({ children }) => {
  return (
    <>
      <Navbar />
      <div className="container-fluid">
        <main>
          <Toast />
          {children}
        </main>
      </div>
    </>
  );
};

export default Layout;