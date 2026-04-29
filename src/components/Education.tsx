
import { educationData } from "../assets/educationData";

const Education = () => {
  return (
    <div className='min-h-screen p-12'>
      <div className='container mx-auto py-12'>
        <h1 className='text-4xl font-bold mb-8'>Education</h1>
        <div className='grid md:grid-cols-2 gap-8'>
          {educationData.map((edu) => (
            <div key={edu.id} className='border border-current/20 p-6 rounded-lg shadow-lg'>
              <h2 className='text-2xl font-semibold mb-4'>{edu.degree}</h2>
              <h3 className='text-xl mb-2'>{edu.institution}</h3>
              <p className='opacity-70'>{edu.location}</p>
              <p className='opacity-70 mb-4'>{edu.period}</p>
              <p>{edu.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Education;
