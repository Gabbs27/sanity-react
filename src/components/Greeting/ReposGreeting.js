import React from "react";
import "./Greeting.css";
import { Fade } from "react-reveal";
import p from "../../assets/p-red.png";

const ReposGreeting = () => {
  return (
    <Fade bottom duration={2000} distance='40px'>
      <div className='greet-main mb-10'>
        <div className='greeting-main'>
          <div className='greeting-text-div'>
            <div>
              <h1 className='greeting-text mb-6'>Repositories</h1>
              <h2 className='greeting-nickname mb-6'>(Gabbs279)</h2>
              <p className='greeting-text-p subTitle mt-'>
                Explore my public GitHub repositories that showcase my diverse
                development skills across various projects, from web development
                to innovative solutions. Get a glimpse of my expertise in
                software development and see the breadth of my work.
              </p>
            </div>
          </div>
          <div className='greeting-image-div ml-20'>
            <img
              className=''
              src={p}
              alt='professional work collection illustration'
              style={{ width: "80%" }}
            />
          </div>
        </div>
      </div>
    </Fade>
  );
};

// <div className='flex flex-col items-center'>
//   <div className='flex'>
//     <div className='ml-12' style={{ flexBasis: "50%" }}>
//       <h2 className='text-3xl'>Professional Work Collection</h2>
//       <h3 className='text-lg text-gray-600'>
//         A passionate individual who always thrives to work on end to end
//         products which develop sustainable and scalable social and technical
//         systems to create impact.
//       </h3>
//     </div>
//     <div className='mr-12' style={{ flexBasis: "50%" }}>
//       <img
//         className=''
//         src={p}
//         alt='professional work collection illustration'
//         style={{ width: "80%" }}
//       />
//     </div>
//   </div>
// </div>

export default ReposGreeting;
