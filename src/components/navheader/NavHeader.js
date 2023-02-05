import React from "react";
import { NavLink, Link } from "react-router-dom";
import "./NavHeader.css";
import { Fade } from "react-reveal";
//import { Navbar, Nav, NavItem, NavbarBrand } from "reactstrap";
import head from "../../assets/head.png";

const NavBar = () => {
  return (
    <Fade>
      <div>
        <header className='header'>
          <NavLink to='/' tag={Link} className='logo'>
            <img className='header--img' src={head} alt='header' />
          </NavLink>
          <ul className='menu'>
            <li>
              <NavLink to='/portfolio'>Portfolio</NavLink>
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

            {/* 
            <NavItem>
              <Link
                className={`nav-link ${
                  selected === "Gabriel Abreu" && "selected"
                }`}
                to='/gabriel-abreu'>
                Gabriel Abreu
              </Link>
            </NavItem> */}
          </ul>
        </header>
      </div>
    </Fade>
  );
};

export default NavBar;
