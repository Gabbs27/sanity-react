import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import "./NavHeader.css";
import ThemeToggle from "../ThemeToggle/ThemeToggle";

const ValentineHeader = () => (
  <header className="header header--valentine" role="banner">
    <nav className="nav-container" role="navigation" aria-label="Valentine navigation">
      <div className="nav-logo">
        <NavLink to="/para-ti" className="logo-link logo-link--valentine">
          ❤️ Para Ti
        </NavLink>
      </div>
      <div className="valentine-nav-flowers">🌹 🌻 🌷 🌺 🌸</div>
    </nav>
  </header>
);

const NavBar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  const isValentine = location.pathname === "/para-ti";

  const handleMenuToggle = () => {
    setMenuOpen(!menuOpen);
  };

  const handleMenuItemClick = () => {
    if (window.innerWidth < 768) {
      // Hide the menu on mobile devices
      setMenuOpen(false);
    }
  };

  if (isValentine) return <ValentineHeader />;

  return (
    <header className="header" role="banner">
      <nav
        className="nav-container"
        role="navigation"
        aria-label="Main navigation">
        <div className="nav-logo">
          <NavLink to="/" className="logo-link">
            Code With Gabo
          </NavLink>
        </div>

        <div className="nav-actions">
          <ThemeToggle />
          <button
            className="menu-toggle"
            onClick={handleMenuToggle}
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}>
            <span className={`hamburger ${menuOpen ? "open" : ""}`}></span>
          </button>
        </div>

        <div className={`nav-links ${menuOpen ? "show" : ""}`} role="menubar">
          <NavLink
            to="/"
            className="nav-item"
            onClick={handleMenuItemClick}
            role="menuitem">
            Portfolio
          </NavLink>
          <NavLink
            to="/allpost"
            className="nav-item"
            onClick={handleMenuItemClick}
            role="menuitem">
            Blog
          </NavLink>
          <NavLink
            to="/services"
            className="nav-item"
            onClick={handleMenuItemClick}
            role="menuitem">
            Services
          </NavLink>
          <NavLink
            to="/about"
            className="nav-item"
            onClick={handleMenuItemClick}
            role="menuitem">
            About
          </NavLink>
          <NavLink
            to="/gabriel-abreu"
            className="nav-item"
            onClick={handleMenuItemClick}
            role="menuitem">
            Contact
          </NavLink>
          <NavLink
            to="/repositorios"
            className="nav-item"
            onClick={handleMenuItemClick}
            role="menuitem">
            Projects
          </NavLink>
          <NavLink
            to="/dashboard"
            className="nav-item nav-item-dashboard"
            onClick={handleMenuItemClick}
            role="menuitem">
            Dashboard
          </NavLink>
        </div>
      </nav>
    </header>
  );
};

export default NavBar;
