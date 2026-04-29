import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faInstagram,
  faTwitter,
  faLinkedinIn,
  faGithub,
} from "@fortawesome/free-brands-svg-icons";
import { Link, useLocation } from "react-router-dom";

export default function Footer() {
  const location = useLocation();

  // La página Valentine tiene su propio footer, no mostrar el global
  if (location.pathname === "/para-ti") return null;

  // Admin section is a focused workspace — no public footer there either.
  if (
    location.pathname === "/admin-login" ||
    location.pathname === "/dashboard" ||
    location.pathname.startsWith("/admin/")
  ) {
    return null;
  }

  return (
    <footer className='footer--t'>
      <div className='footer--text'>
        <p>
          Copyright &copy; 2026 - Gabriel Abreu —{" "}
          <Link to="/privacy" className='footer-link'>Privacy Policy</Link>
        </p>
      </div>
      <div className='footer--buttons'>
        <a
          href='https://twitter.com/codewithgabo'
          target='_blank'
          rel='noopener noreferrer'
          className='footer-social-link bg-white shadow-lg font-normal h-10 w-10 inline-flex items-center justify-center rounded-full outline-none focus:outline-none'
          aria-label='Twitter'>
          <FontAwesomeIcon icon={faTwitter} />
        </a>

        <a
          href='https://www.instagram.com/codewithgabo/'
          target='_blank'
          rel='noopener noreferrer'
          className='footer-social-link bg-white shadow-lg font-normal h-10 w-10 inline-flex items-center justify-center rounded-full outline-none focus:outline-none'
          aria-label='Instagram'>
          <FontAwesomeIcon icon={faInstagram} />
        </a>

        <a
          href='https://www.linkedin.com/in/francisco-gabriel-abreu-cornelio/'
          target='_blank'
          rel='noopener noreferrer'
          className='footer-social-link bg-white shadow-lg font-normal h-10 w-10 inline-flex items-center justify-center rounded-full outline-none focus:outline-none'
          aria-label='LinkedIn'>
          <FontAwesomeIcon icon={faLinkedinIn} />
        </a>

        <a
          href='https://github.com/Gabbs27'
          target='_blank'
          rel='noopener noreferrer'
          className='footer-social-link bg-white shadow-lg font-normal h-10 w-10 inline-flex items-center justify-center rounded-full outline-none focus:outline-none'
          aria-label='GitHub'>
          <FontAwesomeIcon icon={faGithub} />
        </a>
      </div>
    </footer>
  );
}
