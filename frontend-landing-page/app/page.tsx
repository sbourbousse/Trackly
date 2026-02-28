import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { ProblemSolution } from "@/components/landing/ProblemSolution";
import { Features } from "@/components/landing/Features";
import { Pricing } from "@/components/landing/Pricing";
import { Trust } from "@/components/landing/Trust";
import { Faq } from "@/components/landing/Faq";
import { CtaFinal } from "@/components/landing/CtaFinal";
import { Footer } from "@/components/landing/Footer";

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <ProblemSolution />
        <Features />
        <Pricing />
        <Trust />
        <Faq />
        <CtaFinal />
        <Footer />
      </main>
    </>
  );
}
