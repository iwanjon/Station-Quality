import Footer from '../components/Footer.tsx';

const About = () => (
  <div className="min-h-screen flex flex-col">
    <main className="flex-1 flex flex-col justify-center items-center p-8">
      <h1 className="text-3xl font-bold mb-4">About Station Quality Control</h1>
      <p className="max-w-xl text-center text-gray-700">This website provides information and tools for monitoring and managing the quality of weather stations. Learn more about our mission and team here.</p>
    </main>
    <Footer />
  </div>
);

export default About;
