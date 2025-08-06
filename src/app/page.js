"use client";
import Details from "@/components/Details";
import FeatureCard from "@/components/FeatureCard";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import Navbar from "@/components/Navbar";
import { useTranslation } from "@/lib/useTranslation";

export default function Home() {
  const { t } = useTranslation('common');
  
  return (
    <div>
      <Navbar />
      <Hero />
      <Details />
      <h1 className="text-2xl md:text-5xl font-bold text-center text-pink-500 mb-5 mt-8">
        {t('features.title')}
      </h1>
      <FeatureCard />
      <Footer />
    </div>
  );
}