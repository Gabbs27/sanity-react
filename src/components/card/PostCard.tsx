

const PostCard = (props) => {
  return (
    <div
      className='block h-64 relative rounded  hover:shadow-lg leading-snug bg-white
    border-l-8 border-green-400 mb-40 ml-4 mt-4'
      key={props.id}>
      <a
        href={props.url}
        className=''
        target='_blank'
        rel='noopener noreferrer'>
        <img
          src={props.image}
          alt={props.title}
          className='w-full h-full rounded-r object-cover absolute'
        />

        <span
          className='block relative h-full flex justify-end items-end pr
    -4 pb-4'>
          <h2
            className='text-gray-800 text-lg font-bold px-3 py-4 bg-red-700
      text-red-100  rounded'>
            {props.title}
          </h2>
        </span>
      </a>
      <p className='mt-5'>{props.description}</p>
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
    </div>
  );
};

export default PostCard;

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
