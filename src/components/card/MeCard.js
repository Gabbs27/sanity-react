import React from "react";
import "./MeCard.css";

function PresentationCard({ name, title, image, description }) {
  const handleContact = () => {
    window.location.href = "mailto:fco.g.abreu@gmail.com";
  };

  return (
    <div class='max-w-4xl mx-auto rounded overflow-hidden shadow-lg'>
      <img class='h-64 w-64 mx-auto' src={image} alt={name} />
      <div class='px-6 py-4'>
        <div class='me-name font-bold text-xl mb-2'>{name}</div>
        <p class='me-subtitle text-gray-700 text-base'>{title}</p>
      </div>
      <div class='px-6 py-4'>
        <p class='me-description text-gray-700 text-base'>{description}</p>
      </div>
      <div className='flex justify-center mt-8 bg-red-500'>
        <button
          className='bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded center'
          onClick={handleContact}>
          Contact Me
        </button>
      </div>
    </div>
  );
}

export default PresentationCard;
