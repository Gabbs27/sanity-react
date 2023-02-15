import React from "react";

function PresentationCard({ name, title, image, description }) {
  return (
    <div class='max-w-4xl mx-auto rounded overflow-hidden shadow-lg'>
      <img class='h-64 w-64 mx-auto' src={image} alt={name} />
      <div class='px-6 py-4'>
        <div class='font-bold text-xl mb-2'>{name}</div>
        <p class='text-gray-700 text-base'>{title}</p>
      </div>
      <div class='px-6 py-4'>
        <p class='text-gray-700 text-base'>{description}</p>
      </div>
    </div>
  );
}

export default PresentationCard;
