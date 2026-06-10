import { useState } from "react";
import LoadingScreen from "../components/portfolio/LoadingScreen";
import PortfolioNav from "../components/portfolio/PortfolioNav";
import Hero from "../components/portfolio/Hero";
import SelectedWorks from "../components/portfolio/SelectedWorks";
import Journal from "../components/portfolio/Journal";
import Explorations from "../components/portfolio/Explorations";
import Stats from "../components/portfolio/Stats";
import ContactFooter from "../components/portfolio/ContactFooter";

export default function Landing() {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="portfolio-page min-h-screen" data-testid="landing-portfolio">
      {isLoading && <LoadingScreen onComplete={() => setIsLoading(false)} />}
      <PortfolioNav />
      <Hero />
      <SelectedWorks />
      <Journal />
      <Explorations />
      <Stats />
      <ContactFooter />
    </div>
  );
}
