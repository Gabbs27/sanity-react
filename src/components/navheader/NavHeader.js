import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import "./NavHeader.css";
import { Fade } from "react-reveal";
import head from "../../assets/head.png";

const NavBar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleMenuToggle = () => {
    setMenuOpen(!menuOpen);
  };

  const handleMenuItemClick = () => {
    if (window.innerWidth < 768) {
      // Hide the menu on mobile devices
      setMenuOpen(false);
    }
  };

  return (
    <Fade>
      <header className='header'>
        <nav className='nav-container'>
          <div className='nav-logo'>
            <NavLink to='/' className='logo-link'>
              Code With Gabo
            </NavLink>
          </div>

          <button
            className='menu-toggle'
            onClick={handleMenuToggle}
            aria-label='Toggle menu'>
            <span className={`hamburger ${menuOpen ? "open" : ""}`}></span>
          </button>

          <div className={`nav-links ${menuOpen ? "show" : ""}`}>
            <NavLink to='/' className='nav-item'>
              Portfolio
            </NavLink>
            <NavLink to='/allpost' className='nav-item'>
              Blog
            </NavLink>
            <NavLink to='/services' className='nav-item'>
              Services
            </NavLink>
            <NavLink to='/about' className='nav-item'>
              About
            </NavLink>
            <NavLink to='/gabriel-abreu' className='nav-item'>
              Contact
            </NavLink>
            <NavLink to='/repositories' className='nav-item'>
              Projects
            </NavLink>
          </div>
        </nav>
      </header>
    </Fade>
  );
};

export default NavBar;
