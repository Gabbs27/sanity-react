import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faInstagram,
  faTwitter,
  faLinkedinIn,
  faGithub,
} from "@fortawesome/free-brands-svg-icons";

export default function Footer() {
  return (
    <footer className='footer--t'>
      <div className='footer--text'>
        <p>Copyright © 2023 - Gabriel Abreu </p>
      </div>
      <div className='footer--buttons'>
        <button
          className='bg-white text-lightBlue-400 shadow-lg font-normal h-10 w-10 items-center justify-center align-center rounded-full outline-none focus:outline-none mr-2'
          type='button'>
          <FontAwesomeIcon icon={faTwitter} />
        </button>

        <button
          className='bg-white text-lightBlue-600 shadow-lg font-normal h-10 w-10 items-center justify-center align-center rounded-full outline-none focus:outline-none mr-2'
          type='button'>
          <FontAwesomeIcon icon={faInstagram} />
        </button>

        <a
          href='https://www.linkedin.com/in/francisco-gabriel-abreu-cornelio/'
          target='_blank'
          rel='noopener noreferrer'>
          <button
            className='bg-white text-pink-400 shadow-lg font-normal h-10 w-10 items-center justify-center align-center rounded-full outline-none focus:outline-none mr-2'
            type='button'>
            <FontAwesomeIcon icon={faLinkedinIn} />
          </button>
        </a>

        <a href='https://github.com/Gabbs27'>
          <button
            className='bg-white text-blueGray-800 shadow-lg font-normal h-10 w-10 items-center justify-center align-center rounded-full outline-none focus:outline-none mr-2'
            type='button'>
            <FontAwesomeIcon icon={faGithub} />
          </button>
        </a>
      </div>
      {/* <small>
        Coded with ❤️ by{" "}
        <a
          className='footer--link'
          href='https://www.linkedin.com/in/francisco-gabriel-abreu-cornelio/'>
          Gabriel Abreu
        </a>
        .
      </small>
       */}
    </footer>
  );
}
