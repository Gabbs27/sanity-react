import React from "react";
import Navbar from "./Navbar";
import head from "../assets/head.png";

function Header() {
  return (
    <>
      <header className='header'>
        <img className='header--img' src={head} alt='header' />
      </header>
      <Navbar />
    </>
  );
}

export default Header;
