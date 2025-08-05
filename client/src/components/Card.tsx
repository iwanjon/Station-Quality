type CardProps = {
  imageSrc: string;
  title: string;
  description: string;
  price: string;
  rating?: number; // Optional, for stars
  buttonText?: string;
};

const Card = ({
  imageSrc,
  title,
  description,
  price,
  rating = 4,
  buttonText = "View Analysis",
}: CardProps) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-yellow-300 p-6 w-80 flex flex-col items-center text-center hover:shadow-xl transition-shadow">
      <img
        src={imageSrc}
        alt={title}
        className="w-32 h-32 object-contain mb-4"
      />
      <h2 className="text-2xl font-semibold mb-1">{title}</h2>

      <div className="flex justify-center items-center mb-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} className={`text-yellow-400 text-lg`}>
            {i < rating ? "★" : "☆"}
          </span>
        ))}
      </div>

      <p className="text-gray-600 text-sm mb-3">{description}</p>

      <div className="text-black text-2xl font-bold mb-4">${price}</div>

      <button className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition">
        {buttonText}
      </button>
    </div>
  );
};

export default Card;

// type CardProps = {
//   title: string;
//   description: string;
// };

// const Card = ({ title, description }: CardProps) => (
//   <div className="bg-white rounded-xl shadow-md p-6 w-64 flex flex-col items-center border border-gray-200">
//     <h2 className="text-xl font-semibold mb-2">{title}</h2>
//     <p className="text-gray-700 text-center">{description}</p>
//   </div>
// );

// export default Card;
