import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faReact } from "@fortawesome/free-brands-svg-icons";
import Navbar from "./Navbar";
import head from "../assets/head.png";

function Header() {
  return (
    <>
      <header className='header'>
        <img className='header--img' src={head} alt='header' />
        {/* <FontAwesomeIcon icon={faReact} className='nav--logo' /> */}
      </header>
      <Navbar />
    </>
  );
}

export default Header;
