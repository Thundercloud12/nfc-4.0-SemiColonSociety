"use client";


import Image from "next/image";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";

const ImageOverlay = ({ src, alt, title, description }) => (
  <div className="relative h-full w-full rounded-xl overflow-hidden group cursor-pointer transition-all duration-300">
    <Image 
      src={src}
      alt={alt}
      fill
      priority
      className="object-cover transition-transform duration-500 group-hover:scale-110"
      onError={(e) => {
        console.error(`Failed to load image: ${src}`);
        e.target.style.display = 'none';
      }}
    />

    {/* Gradient Overlay */}
    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition duration-300" />

    {/* Text Overlay */}
    <div className="absolute bottom-4 left-4 z-10 transition-all duration-300 group-hover:translate-y-[-4px]">
      <h3 className="text-lg md:text-2xl font-bold text-white drop-shadow-md">
        {title}
      </h3>
      <p className="text-sm md:text-base text-gray-200">{description}</p>
    </div>
  </div>
);

export default function Details() {
  return (
    <div className="px-4">
      <h1 className="text-2xl md:text-5xl font-bold text-center text-pink-500 mb-8">
        Details
      </h1>

      <BentoGrid>
        <BentoGridItem
          header={
            <ImageOverlay 
              src="/images/maternal1.jpeg" 
              alt="Maternal Care" 
              title="Community Awareness Programs" 
              description="Workshops to educate women about maternal health and early care practices."
            />
          }
          className="md:col-span-2 hover:shadow-xl transition-shadow duration-300"
        />
        <BentoGridItem
          header={
            <ImageOverlay 
              src="/images/maternal2.jpeg"
              alt="Maternal Support" 
              title="ASHA Support" 
              description="Healthcare workers providing personalized care in rural communities."
            />
          }
          className="md:col-span-1 hover:shadow-xl transition-shadow duration-300"
        />
        <BentoGridItem
          header={
            <ImageOverlay 
              src="/images/maternal3.jpeg"
              alt="Prenatal" 
              title="Safe Hospital Deliveries" 
              description="Ensuring access to safe and hygienic hospital deliveries for mothers."
            />
          }
          className="md:col-span-1 hover:shadow-xl transition-shadow duration-300"
        />
        <BentoGridItem
          header={
            <ImageOverlay 
              src="/images/maternal4.jpeg" 
              alt="Healthcare" 
              title="Mother & Child Care" 
              description="Programs focusing on postpartum care and mother-child bonding."
            />
          }
          className="md:col-span-2 hover:shadow-xl transition-shadow duration-300"
        />
      </BentoGrid>
    </div>
  );
}
