import Navbar from '../../components/Navbar';
import Hero from '../../components/Hero';
import Features from '../../components/Features';
import CoursesShowcase from '../../components/CoursesShowcase';
import Footer from '../../components/Footer';

function Landing() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Features />
        <CoursesShowcase />
      </main>
      <Footer />
    </>
  );
}

export default Landing;
