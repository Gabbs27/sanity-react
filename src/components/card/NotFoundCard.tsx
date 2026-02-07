
import "./MeCard.css";

interface NotFoundCardProps {
  name: string;
  title: string;
  description: string;
}

function NotFoundCard({ name, title, description }: NotFoundCardProps) {
  return (
    <div className='max-w-4xl mx-auto rounded overflow-hidden shadow-lg'>
      <div className='px-6 py-4'>
        <div className='me-name font-bold text-xl mb-2'>{name}</div>
        <p className='me-subtitle text-gray-700 text-base'>{title}</p>
      </div>
      <div className='px-6 py-4'>
        <p className='me-description text-gray-700 text-base'>{description}</p>
      </div>
    </div>
  );
}

export default NotFoundCard;
