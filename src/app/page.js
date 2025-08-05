import Details from "@/components/Details";
import FeatureCard from "@/components/FeatureCard";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import Navbar from "@/components/Navbar";
import Image from "next/image";

export default function Home() {
  return (
    <div>
      <Navbar />
      <Hero />
      <Details />
      <h1 className="text-2xl md:text-5xl font-bold text-center text-pink-500 mb-5 mt-8">
        Features
      </h1>
      <FeatureCard />
      <Footer />
    </div>
  );
}
