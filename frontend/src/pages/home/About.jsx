import { useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import './About.css';
import profileImg from '../../assets/ulindu.png';

const experiences = [
  {
    role: 'Chief Technology Officer',
    company: 'Idea Tech (Pvt)Ltd.',
    date: 'May 2025 - Present',
    description: 'Leading a diverse team of technology students and professionals to develop innovative, next-level solutions for government and private sector clients.'
  },
  {
    role: 'Data Analyst',
    company: 'Sri Lanka Telecom',
    date: 'Jun 2026 - Present',
    description: 'Analyzing complex telecom datasets using statistical analysis and EDA. Transforming raw data into high-impact visual dashboards and identifying operational bottlenecks.'
  },
  {
    role: 'Co-Founder',
    company: 'Nutzy Craft',
    date: 'Dec 2025 - Present',
    description: 'Building Sri Lanka’s first next-gen freelance marketplace to connect skilled freelancers with clients through a secure, transparent, and scalable platform.'
  },
  {
    role: 'Quality Assurance Engineer',
    company: 'Idea Tech (Pvt)Ltd.',
    date: 'Apr 2025 - Present',
    description: 'Ensuring the quality and reliability of software products through rigorous testing and quality assurance practices.'
  },
  {
    role: 'ICT Teacher',
    company: 'Self-employed',
    date: 'Apr 2023 - Present',
    description: 'Fostering a dynamic learning environment for students from Grade 8 to A/L. Blending interactive lessons, real-world examples, and hands-on projects.'
  }
];

const educationList = [
  {
    degree: 'BSc (Hons) in Information Technology Specializing in Data Science',
    institution: 'SLIIT',
    date: 'May 2024 - Jul 2028'
  },
  {
    degree: 'BSc (Hons) in Information Technology Specializing in Artificial Intelligence',
    institution: 'ICBT Campus',
    date: 'Jul 2025 - Jul 2029'
  },
  {
    degree: 'A/L, Mathematics',
    institution: 'Mahinda Rajapaksha College Homagama',
    date: 'Nov 2021 - Jan 2024'
  },
  {
    degree: 'O/L',
    institution: 'Ananda College Kottawa',
    date: 'Jan 2010 - Oct 2021'
  }
];

function About() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <Navbar />
      <main className="about-page">
        
        {/* Hero Section */}
        <section className="about-hero">
          <div className="about-hero__content">
            <div className="about-hero__text">
              <span className="about-hero__badge">Meet The Brains Behind The Grades</span>
              <h1 className="about-hero__title">
                Hi, I&apos;m <span className="text-gradient">Ulindu</span>
              </h1>
              <p className="about-hero__subtitle">
                An experienced ICT teacher, technologist, and entrepreneur dedicated to empowering the next generation of tech leaders.
              </p>
              <div className="about-hero__bio">
                <p>
                  My teaching approach blends interactive lessons, real-world examples, and hands-on projects, ensuring that students remain engaged while developing a strong understanding of ICT. I focus on both the theoretical and practical aspects of technology, equipping students with the skills needed to succeed in the digital world.
                </p>
              </div>
            </div>
            <div className="about-hero__image-wrapper">
              <div className="about-hero__image-glow"></div>
              <img src={profileImg} alt="Ulindu" className="about-hero__image" />
            </div>
          </div>
        </section>

        {/* Experience & Education Section */}
        <section className="about-details">
          
          <div className="about-column">
            <h2 className="about-section-title">
              <span className="icon">💼</span> Professional Experience
            </h2>
            <div className="timeline">
              {experiences.map((exp, idx) => (
                <div key={idx} className="timeline-item">
                  <div className="timeline-dot"></div>
                  <div className="timeline-content">
                    <h3 className="timeline-role">{exp.role}</h3>
                    <p className="timeline-company">{exp.company}</p>
                    <span className="timeline-date">{exp.date}</span>
                    <p className="timeline-desc">{exp.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="about-column">
            <h2 className="about-section-title">
              <span className="icon">🎓</span> Education Journey
            </h2>
            <div className="timeline">
              {educationList.map((edu, idx) => (
                <div key={idx} className="timeline-item">
                  <div className="timeline-dot"></div>
                  <div className="timeline-content">
                    <h3 className="timeline-role">{edu.degree}</h3>
                    <p className="timeline-company">{edu.institution}</p>
                    <span className="timeline-date">{edu.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </section>

      </main>
      <Footer />
    </>
  );
}

export default About;
