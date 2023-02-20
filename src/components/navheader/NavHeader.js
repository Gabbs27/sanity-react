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
        <header className='header mb-0 '>
          <NavLink to='/' tag={Link} className='logo'>
            <img
              className='header--img ml-10'
              src={head}
              alt='Code with Gabo'
            />
          </NavLink>
          <div className='mr-10'>
            <ul className='menu'>
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
          </div>
        </header>
      </div>
    </Fade>
  );
};

export default NavBar;
