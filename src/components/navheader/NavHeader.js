import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import "./NavHeader.css";
import { Fade } from "react-reveal";
import head from "../../assets/head.png";

const NavBar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleMenuToggle = () => {
    setMenuOpen(!menuOpen);
    console.log(menuOpen);
  };

  return (
    <Fade>
      <header className='header'>
        <div className='logo'>
          <img src={head} alt='Logo' className='header--img' />
          {/* <span className='logo-name'>Code With Gabo</span> */}
        </div>
        <div className='menu-btn' onClick={handleMenuToggle}>
          <span></span>
          <span></span>
          <span></span>
        </div>
        <ul className={`menu ${menuOpen ? "open" : ""}`}>
          <li>
            <NavLink to='/' activeClassName='active'>
              Portfolio
            </NavLink>
          </li>
          <li>
            <NavLink className='nav-link' to='/allpost'>
              All Posts
            </NavLink>
          </li>
          <li>
            <NavLink className='nav-link' to='/about'>
              About
            </NavLink>
          </li>
          <li>
            <NavLink className='nav-link' to='/gabriel-abreu'>
              Gabriel Abreu
            </NavLink>
          </li>

          <li>
            <NavLink className='nav-link' to='/Repositorios'>
              Repositorios
            </NavLink>
          </li>
          <li>
            <NavLink className='nav-link' to='/gabriel-abreu'>
              Educacion
            </NavLink>
          </li>
        </ul>
      </header>
    </Fade>
  );
};

export default NavBar;
