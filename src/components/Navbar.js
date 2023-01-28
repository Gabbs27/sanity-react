import React, { useState } from "react";

const Navbar = () => {
  const [selected, setSelected] = useState("");

  const handleClick = (e) => {
    setSelected(e.target.innerHTML);
    console.log(selected);
  };

  return (
    <nav className='navbar'>
      <ul className='nav--ul'>
        <li className='nav--li'>
          <a
            className={`nav--li-a ${selected === "portfolio" && "selected"}`}
            href='/portfolio'
            onClick={handleClick}>
            Portfolio
          </a>
        </li>
        <li className='nav--li'>
          <a
            className={`nav--li-a ${selected === "All Posts" && "selected"}`}
            href='/'
            onClick={handleClick}>
            All Posts
          </a>
        </li>
        <li className='nav--li'>
          <a
            className={`nav--li-a ${selected === "About" && "selected"}`}
            href='/about'
            onClick={handleClick}>
            About
          </a>
        </li>
        <li className='nav--li'>
          <a
            className={`nav--li-a ${
              selected === "Gabriel Abreu" && "selected"
            }`}
            href='/gabriel-abreu'
            onClick={handleClick}>
            Gabriel Abreu
          </a>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
