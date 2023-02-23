import React, { useState } from "react";
import { NavLink, Link } from "react-router-dom";
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
      <div>
        <header className='header mb-0'>
          <NavLink to='/' tag={Link} className='logo'>
            <img
              className='header--img ml-10'
              src={head}
              alt='Code with Gabo'
            />
          </NavLink>

          <button
            className='menu-btn'
            onClick={handleMenuToggle}
            aria-expanded={menuOpen}>
            <span className='sr-only'>Toggle Menu</span>
            <span></span>
            <span></span>
          </button>

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
      </div>
    </Fade>
  );
};

export default NavBar;
