import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faInstagram,
  faTwitter,
  faLinkedinIn,
  faGithub,
} from "@fortawesome/free-brands-svg-icons";
import { useLocation } from "react-router-dom";

export default function Footer() {
  const location = useLocation();

  // La página Valentine tiene su propio footer, no mostrar el global
  if (location.pathname === "/para-ti") return null;

  return (
    <footer className='footer--t'>
      <div className='footer--text'>
        <p>Copyright &copy; 2026 - Gabriel Abreu </p>
      </div>
      <div className='footer--buttons'>
        <a
          href='https://twitter.com/codewithgabo'
          target='_blank'
          rel='noopener noreferrer'
          className='footer-social-link bg-white text-sky-400 shadow-lg font-normal h-10 w-10 inline-flex items-center justify-center rounded-full outline-none focus:outline-none mr-2'
          aria-label='Twitter'>
          <FontAwesomeIcon icon={faTwitter} />
        </a>

        <a
          href='https://www.instagram.com/codewithgabo/'
          target='_blank'
          rel='noopener noreferrer'
          className='footer-social-link bg-white text-sky-600 shadow-lg font-normal h-10 w-10 inline-flex items-center justify-center rounded-full outline-none focus:outline-none mr-2'
          aria-label='Instagram'>
          <FontAwesomeIcon icon={faInstagram} />
        </a>

        <a
          href='https://www.linkedin.com/in/francisco-gabriel-abreu-cornelio/'
          target='_blank'
          rel='noopener noreferrer'
          className='footer-social-link bg-white text-pink-400 shadow-lg font-normal h-10 w-10 inline-flex items-center justify-center rounded-full outline-none focus:outline-none mr-2'
          aria-label='LinkedIn'>
          <FontAwesomeIcon icon={faLinkedinIn} />
        </a>

        <a
          href='https://github.com/Gabbs27'
          target='_blank'
          rel='noopener noreferrer'
          className='footer-social-link bg-white text-slate-800 shadow-lg font-normal h-10 w-10 inline-flex items-center justify-center rounded-full outline-none focus:outline-none mr-2'
          aria-label='GitHub'>
          <FontAwesomeIcon icon={faGithub} />
        </a>
      </div>
    </footer>
  );
}
