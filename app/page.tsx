import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Pipeline from '../components/Pipeline';
import IntelligenceEngine from '../components/IntelligenceEngine';
import SampleReport from '../components/SampleReport';
import PredictiveChains from '../components/PredictiveChains';
import TelegramDemo from '../components/TelegramDemo';
import MarketCoverage from '../components/MarketCoverage';
import Architecture from '../components/Architecture';
import WhyN3RDY from '../components/WhyN3RDY';
import FinalCTA from '../components/FinalCTA';
import Footer from '../components/Footer';

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Pipeline />
        <IntelligenceEngine />
        <SampleReport />
        <PredictiveChains />
        <TelegramDemo />
        <MarketCoverage />
        <Architecture />
        <WhyN3RDY />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
