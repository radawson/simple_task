// src/components/layout/Navbar.jsx
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  MDBNavbar,
  MDBContainer,
  MDBNavbarBrand,
  MDBNavbarToggler,
  MDBNavbarNav,
  MDBNavbarItem,
  MDBNavbarLink,
  MDBCollapse,
  MDBIcon,
  MDBSideNav,
  MDBSideNavItem,
  MDBSideNavLink
} from 'mdb-react-ui-kit';

export default function Navbar() {
  const [showNav, setShowNav] = useState(false);
  const [sideNavOpen, setSideNavOpen] = useState(false);  
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/', icon: 'home', label: 'Today' },
    { path: '/tasks', icon: 'tasks', label: 'Tasks' },
    { path: '/events', icon: 'calendar', label: 'Events' },
    { path: '/notes', icon: 'note-sticky', label: 'Notes' },
    { path: '/templates', icon: 'clipboard-list', label: 'Templates' },
    { path: '/qr', icon: 'qrcode', label: 'QR Code' },
    { path: 'https://wiki.partridgecrossing.org/', icon: 'book', label: 'Wiki', external: true },
    { path: '/login', icon: 'sign-in-alt', label: 'Login', className: 'ms-auto' }
  ];

  const handleNavigation = (item) => {
    if (item.external) {
      window.open(item.path, '_blank', 'noopener,noreferrer');
    } else {
      navigate(item.path);
    }
    setShowNav(false);
    setSideNavOpen(false);
  };

  const NavLink = ({ item }) => {
    if (item.external) {
      return (
        <MDBNavbarLink 
          href={item.path}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setShowNav(false)}
        >
          <MDBIcon fas icon={item.icon} className='me-2 d-lg-none'/>
          {item.label}
        </MDBNavbarLink>
      );
    }

    return (
      <MDBNavbarLink 
        tag={Link} 
        to={item.path}
        active={location.pathname === item.path}
        onClick={() => setShowNav(false)}
      >
        <MDBIcon fas icon={item.icon} className='me-2 d-lg-none'/>
        {item.label}
      </MDBNavbarLink>
    );
  };

  return (
    <>
      <MDBNavbar expand='lg' light bgColor='light'>
        <MDBContainer fluid>
          <MDBNavbarBrand tag={Link} to='/' className='mt-2 mt-lg-0'>
            <img
              src='/img/ptx_logo2.png'
              height='15'
              alt='PTX Logo'
              loading='lazy'
            />
          </MDBNavbarBrand>
          
          <MDBNavbarToggler
            type='button'
            aria-controls='navbarSupportedContent'
            aria-expanded='false'
            aria-label='Toggle navigation'
            onClick={() => setShowNav(!showNav)}  // Changed to toggle showNav
          >
            <MDBIcon icon='bars' fas />
          </MDBNavbarToggler>

          <MDBCollapse navbar open={showNav}>
            <MDBNavbarNav className='mr-auto mb-2 mb-lg-0'>
              {navItems.map((item, index) => (
                <MDBNavbarItem key={index} className={item.className}>
                  <NavLink item={item} />
                </MDBNavbarItem>
              ))}
            </MDBNavbarNav>
          </MDBCollapse>
        </MDBContainer>
      </MDBNavbar>

      <MDBSideNav
        open={sideNavOpen}
        closeOnEsc
        className='pt-4'
      >
        <div className='list-group list-group-flush'>
          {navItems.map((item, index) => (
            <MDBSideNavItem key={index} className='list-group-item list-group-item-action'>
              <MDBSideNavLink
                onClick={() => handleNavigation(item)}
                className={`d-flex align-items-center ${!item.external && location.pathname === item.path ? 'active' : ''}`}
              >
                <MDBIcon fas icon={item.icon} className='me-2'/>
                {item.label}
              </MDBSideNavLink>
            </MDBSideNavItem>
          ))}
        </div>
      </MDBSideNav>
    </>
  );
}