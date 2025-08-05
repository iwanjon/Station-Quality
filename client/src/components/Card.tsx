type CardProps = {
  title: string;
  description: string;
};

const Card = ({ title, description }: CardProps) => (
  <div className="bg-white rounded-xl shadow-md p-6 w-64 flex flex-col items-center border border-gray-200">
    <h2 className="text-xl font-semibold mb-2">{title}</h2>
    <p className="text-gray-700 text-center">{description}</p>
  </div>
);

export default Card;
