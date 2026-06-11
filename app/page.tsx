import Hero from '../components/Hero';
import AboutSection from '../components/AboutSection';
import FeaturedVideoSection from '../components/FeaturedVideoSection';
import PhilosophySection from '../components/PhilosophySection';
import ServicesSection from '../components/ServicesSection';
import Footer from '../components/Footer';

export default function Home() {
  return (
    <>
      <main>
        <Hero />
        <AboutSection />
        <FeaturedVideoSection />
        <PhilosophySection />
        <ServicesSection />
      </main>
      <Footer />
    </>
  );
}
