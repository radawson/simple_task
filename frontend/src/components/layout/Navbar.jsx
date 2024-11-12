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
  MDBIcon
} from 'mdb-react-ui-kit';

export default function Navbar() {
  const [showBasic, setShowBasic] = useState(false);

  return (
    <MDBNavbar expand='lg' light bgColor='light'>
      <MDBContainer>
        <MDBNavbarBrand href='/' className='navbar-brand mt-2 mt-lg-0'>
          <img
            src='/img/ptx_logo2.png'  // Static image path in public folder
            height='15'              // Image height
            alt='PTX Logo'           // Alt text
            loading='lazy'           // Loading attribute
          />
        </MDBNavbarBrand>
        <MDBNavbarToggler
          onClick={() => setShowBasic(!showBasic)}
          aria-controls='navbarExample01'
          aria-expanded={showBasic ? 'true' : 'false'}
          aria-label='Toggle navigation'
        >
          <MDBIcon icon='bars' fas />
        </MDBNavbarToggler>
        <MDBCollapse navbar show={showBasic.toString()}>
          <MDBNavbarNav className='mb-2 mb-lg-0'>
            <MDBNavbarItem>
              <MDBNavbarLink href='/tasks'>Tasks</MDBNavbarLink>
            </MDBNavbarItem>
            <MDBNavbarItem>
              <MDBNavbarLink href='/templates'>Templates</MDBNavbarLink>
            </MDBNavbarItem>
            <MDBNavbarItem>
              <MDBNavbarLink href='/qr'>QR Code</MDBNavbarLink>
            </MDBNavbarItem>
          </MDBNavbarNav>
          <MDBNavbarNav right>
            <MDBNavbarItem>
              <MDBNavbarLink href='/login'>Login</MDBNavbarLink>
            </MDBNavbarItem>
          </MDBNavbarNav>
        </MDBCollapse>
      </MDBContainer>
    </MDBNavbar>
  );
}