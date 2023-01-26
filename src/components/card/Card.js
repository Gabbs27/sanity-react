import React from "react";

const Card = (props) => {
  return (
    <span
      className='block h-64 relative rounded shadow leading-snug bg-white
    border-l-8 border-green-400 mb-40 ml-4 mt-4'
      key={props.id}>
      <img
        src={props.image}
        alt={props.title}
        className='w-full h-full rounded-r object-cover absolute'
      />

      <span
        className='block relative h-full flex justify-end items-end pr
    -4 pb-4'>
        <a href={props.url} className=''>
          <h2
            className='text-gray-800 text-lg font-bold px-3 py-4 bg-red-700
      text-red-100  rounded'>
            {props.title}
          </h2>
        </a>
      </span>
      <p>{props.description}</p>
      <div className='flex flex-wrap'>
        {props.languages.map((language, index) => {
          return (
            <span
              key={index}
              className='bg-gray-300 text-gray-800 font-medium px-2 py-1 mr-2 mb-2 rounded-full hover:bg-blue hover:text-white'>
              #{language}
            </span>
          );
        })}
      </div>
    </span>
  );
};

export default Card;

// <span
//   className='block h-64 relative rounded shadow leading-snug bg-white
//     border-l-8 border-green-400'
//   key={index}>
//   <img
//     className='w-full h-full rounded-r object-cover absolute'
//     src={post.mainImage.asset.url}
//     alt=''
//   />
//   <span
//     className='block relative h-full flex justify-end items-end pr
//     -4 pb-4'>
//     <h2
//       className='text-gray-800 text-lg font-bold px-3 py-4 bg-red-700
//       text-red-100 bg-opacity-75 rounded'>
//       {post.title}
//     </h2>
//   </span>
// </span>;
