import Navbar from '../../components/Navbar';
import Hero from '../../components/Hero';
import Features from '../../components/Features';
import InstructorsShowcase from '../../components/InstructorsShowcase';
import CoursesShowcase from '../../components/CoursesShowcase';
import Footer from '../../components/Footer';

function Landing() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Features />
        <InstructorsShowcase />
        <CoursesShowcase />
      </main>
      <Footer />
    </>
  );
}

export default Landing;
