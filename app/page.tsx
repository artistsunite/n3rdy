import Hero from '@/components/landing/Hero';
import FeaturesSection from '@/components/landing/FeaturesSection';
import UseCasesSection from '@/components/landing/UseCasesSection';
import CTASection from '@/components/landing/CTASection';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <>
      <main>
        <Hero />
        <FeaturesSection />
        <UseCasesSection />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
