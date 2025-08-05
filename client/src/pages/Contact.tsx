import Footer from '../components/Footer.tsx';


const Contact = () => (
  <div className="min-h-screen flex flex-col">
    <main className="flex-1 flex flex-col justify-center items-center p-8">
      <h1 className="text-3xl font-bold mb-4">Contact Us</h1>
      <p className="max-w-xl text-center text-gray-700">For inquiries, support, or feedback, please reach out to our team. Contact details and a form will be available here.</p>
    </main>
    <Footer />
  </div>
);

export default Contact;
