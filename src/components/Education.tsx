
import { educationData } from "../assets/educationData";

const Education = () => {
  return (
    <div className='min-h-screen p-12'>
      <div className='container mx-auto py-12'>
        <h1 className='text-4xl font-bold mb-8'>Education</h1>
        <div className='grid md:grid-cols-2 gap-8'>
          {educationData.map((edu) => (
            <div key={edu.id} className='border p-6 rounded-lg shadow-lg'>
              <h2 className='text-2xl font-semibold mb-4'>{edu.degree}</h2>
              <h3 className='text-xl mb-2'>{edu.institution}</h3>
              <p className='text-gray-600'>{edu.location}</p>
              <p className='text-gray-600 mb-4'>{edu.period}</p>
              <p className='text-gray-800'>{edu.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Education;
