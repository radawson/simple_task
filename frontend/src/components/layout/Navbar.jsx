import React, { useState } from 'react';
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
  const [showSidenav, setShowSidenav] = useState(false);

  const toggleSidenav = () => {
    setShowSidenav(!showSidenav);
  };

  return (
    <>
      <MDBNavbar expand='lg' light bgColor='light'>
        <MDBContainer>
          <MDBNavbarBrand href='/' className='navbar-brand mt-2 mt-lg-0'>
            <img
              src='/img/ptx_logo2.png'
              height='15'
              alt='PTX Logo'
              loading='lazy'
            />
          </MDBNavbarBrand>
          <MDBNavbarToggler
            type='button'
            data-target='#navbarToggleSidebar'
            aria-controls='navbarToggleSidebar'
            aria-expanded='false'
            aria-label='Toggle navigation'
            onClick={() => setShowSidenav(!showSidenav)}
          >
            <MDBIcon icon='bars' fas />
          </MDBNavbarToggler>

          {/* Desktop Navigation */}
          <MDBCollapse navbar show={false}>
            <MDBNavbarNav className='mb-2 mb-lg-0'>
              <MDBNavbarItem>
                <MDBNavbarLink href='/tasks'>Tasks</MDBNavbarLink>
              </MDBNavbarItem>
              <MDBNavbarItem>
                <MDBNavbarLink href='/events'>Events</MDBNavbarLink>
              </MDBNavbarItem>
              <MDBNavbarItem>
                <MDBNavbarLink href='/notes'>Notes</MDBNavbarLink>
              </MDBNavbarItem>
              <MDBNavbarItem>
                <MDBNavbarLink href='/templates'>Templates</MDBNavbarLink>
              </MDBNavbarItem>
              <MDBNavbarItem>
                <MDBNavbarLink href='/qr'>QR Code</MDBNavbarLink>
              </MDBNavbarItem>
              <MDBNavbarItem right>
                <MDBNavbarLink href='/login'>Login</MDBNavbarLink>
              </MDBNavbarItem>
            </MDBNavbarNav>
          </MDBCollapse>
        </MDBContainer>
      </MDBNavbar>

      {/* Sidenav */}
      <MDBSideNav
        open={showSidenav}
        setOpen={showSidenav}
        position='end'
        closeOnEsc={true}
        className='list-unstyled'
      >
        <div className='p-3'>
        <MDBSideNavItem
            onClick={toggleSidenav}
          >
            <MDBSideNavLink href='/'>
              <MDBIcon fas icon='home' className='me-2'/> Today
            </MDBSideNavLink>
          </MDBSideNavItem>
          <MDBSideNavItem
            onClick={toggleSidenav}
          >
            <MDBSideNavLink href='/tasks'>
              <MDBIcon fas icon='tasks' className='me-2'/> Tasks
            </MDBSideNavLink>
          </MDBSideNavItem>
          <MDBSideNavItem
            onClick={toggleSidenav}
          >
            <MDBSideNavLink href='/events'>
              <MDBIcon fas icon='calendar' className='me-2'/> Events
            </MDBSideNavLink>
          </MDBSideNavItem>
          <MDBSideNavItem
            onClick={toggleSidenav}
          >
            <MDBSideNavLink href='/notes'>
              <MDBIcon fas icon='note-sticky' className='me-2'/> Notes
            </MDBSideNavLink>
          </MDBSideNavItem>
          <MDBSideNavItem
            onClick={toggleSidenav}
          >
            <MDBSideNavLink href='/templates'>
              <MDBIcon fas icon='clipboard-list' className='me-2'/> Templates
            </MDBSideNavLink>
          </MDBSideNavItem>
          <MDBSideNavItem
            onClick={toggleSidenav}
          >
            <MDBSideNavLink href='/qr'>
              <MDBIcon fas icon='qrcode' className='me-2'/> QR Code
            </MDBSideNavLink>
          </MDBSideNavItem>
          <MDBSideNavItem
            onClick={toggleSidenav}
          >
            <MDBSideNavLink href='/login'>
              <MDBIcon fas icon='sign-in-alt' className='me-2'/> Login
            </MDBSideNavLink>
          </MDBSideNavItem>
        </div>
      </MDBSideNav>
    </>
  );
}