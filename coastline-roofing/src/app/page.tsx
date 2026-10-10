import { AreasCovered } from "@/components/AreasCovered";
import { FloatingContactBubble } from "@/components/FloatingContactBubble";
import { Footer } from "@/components/Footer";
import { Gallery } from "@/components/Gallery";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { QuoteSection } from "@/components/QuoteSection";
import { Reviews } from "@/components/Reviews";
import { Services } from "@/components/Services";
import { TrustBar } from "@/components/TrustBar";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <TrustBar />
        <Services />
        <Gallery />
        <Reviews />
        <AreasCovered />
        <QuoteSection />
      </main>
      <Footer />
      <FloatingContactBubble />
    </>
  );
}
