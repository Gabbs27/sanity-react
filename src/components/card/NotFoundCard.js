import React from "react";
import "./MeCard.css";

function NotFoundCard({ name, title, description }) {
  return (
    <div class='max-w-4xl mx-auto rounded overflow-hidden shadow-lg'>
      <div class='px-6 py-4'>
        <div class='me-name font-bold text-xl mb-2'>{name}</div>
        <p class='me-subtitle text-gray-700 text-base'>{title}</p>
      </div>
      <div class='px-6 py-4'>
        <p class='me-description text-gray-700 text-base'>{description}</p>
      </div>
    </div>
  );
}

export default NotFoundCard;
