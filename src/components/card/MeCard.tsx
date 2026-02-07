
import "./MeCard.css";

interface PresentationCardProps {
  name: string;
  title: string;
  image: string;
  description: string;
}

function PresentationCard({ name, title, image, description }: PresentationCardProps) {
  const handleContact = () => {
    window.location.href = "mailto:fco.g.abreu@gmail.com";
  };

  return (
    <div className='max-w-4xl mx-auto rounded overflow-hidden shadow-lg'>
      <img className='h-64 w-64 mx-auto' src={image} alt={name} />
      <div className='px-6 py-4'>
        <div className='me-name font-bold text-xl mb-2'>{name}</div>
        <p className='me-subtitle text-gray-700 text-base'>{title}</p>
      </div>
      <div className='px-6 py-4'>
        <p className='me-description text-gray-700 text-base'>{description}</p>
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
