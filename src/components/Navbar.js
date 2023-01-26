import React from "react";

const Navbar = () => {
  return (
    <nav className='navbar'>
      <ul className='nav--ul'>
        <li className='nav--li'>
          <a className='nav--li-a' href='/portfolio'>
            Portfolio
          </a>
        </li>
        <li className='nav--li'>
          <a className='nav--li-a' href='/'>
            All Posts
          </a>
        </li>
        <li className='nav--li'>
          <a className='nav--li-a' href='/about'>
            ...
          </a>
        </li>
        <li className='nav--li'>
          <a className='nav--li-a' href='/gabriel-abreu'>
            About
          </a>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
