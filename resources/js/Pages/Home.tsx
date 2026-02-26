import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/home/HeroSection";
import { FeaturedPets } from "@/components/home/FeaturedPets";
import { HowItWorks } from "@/components/home/HowItWorks";
import { CTASection } from "@/components/home/CTASection";

const Index = () => {
  return (
    <div className="min-h-screen">
      { <Navbar /> }
      <main>
        <h1>If you see this, Home is fine!</h1>
        { <HeroSection /> }
        { <FeaturedPets /> }
        { <HowItWorks /> }
        { <CTASection /> }
      </main>
      { <Footer /> }
    </div>
  );
};
export default Index;