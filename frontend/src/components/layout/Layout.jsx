//src/components/layout/Layout.jsx
import React from 'react';
import Navbar from './Navbar';
import Toast from '../common/Toast';
import { Outlet } from 'react-router-dom';

const Layout = () => {
  return (
    <>
      <Navbar />
      <div className="container-fluid">
        <main>
          <Toast />
          <Outlet />
        </main>
      </div>
    </>
  );
};

export default Layout;