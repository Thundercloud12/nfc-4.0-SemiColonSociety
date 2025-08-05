"use client";
import React, { useState } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import {
  IconAdCircleFilled,
  IconArrowLeft,
  IconBrandTabler,
  IconSettings,
  IconUserBolt,
} from "@tabler/icons-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import PatientDash from "@/components/patientDash";
import SymptomLogger from "./symptomLogger";
export default function SidebarDemo() {
   const [selectedPage, setSelectedPage] = useState("PatientDash");
  const links = [
    
    {
      label: "Patient Dashboard",
      value: "PatientDash",
      icon: (
        <IconBrandTabler className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: "Symptom Logger",
      value: "SymptomLogger",
      icon: (
        <IconUserBolt className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: "Logout",
      value: "#",
      icon: (
        <IconArrowLeft className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
  ];
  const [open, setOpen] = useState(false);
   const renderPage = () => {
    switch (selectedPage) {
      case "PatientDash":
        return <PatientDash/>;
      case "SymptomLogger":
        return <SymptomLogger/>;
      case "Logout":
        return <div className="p-8">You have been logged out.</div>;
      default:
        return <div className="p-8">Select a section from the sidebar</div>;
    }
  };
  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-screen min-h-screen flex-1 flex-col overflow-hidden rounded-md border border-neutral-200 bg-pink-50 md:flex-row dark:border-neutral-700 dark:bg-neutral-800",

      )}>
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10 bg-pink-50">
          <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto  bg-pink-50">
            
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedPage(link.value)}
                  className="flex items-center gap-2 px-4 py-2 rounded hover:bg-pink-200 text-left transition"
                >
                  {link.icon}
                  <span className="text-sm font-medium text-neutral-800">{link.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <SidebarLink
              link={{
                label: "Manu Arora",
                href: "#",
                icon: (
                  <img
                    src="https://assets.aceternity.com/manu.png"
                    className="h-7 w-7 shrink-0 rounded-full"
                    width={50}
                    height={50}
                    alt="Avatar" />
                ),
              }} />
          </div>
        </SidebarBody>
      </Sidebar>
     <div className="flex-1">{renderPage()}</div>
    </div>
  );
}

export const LogoIcon = () => {
  return (
    <a
      href="#"
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-black">
      <div
        className="h-5 w-6 shrink-0 rounded-tl-lg rounded-tr-sm rounded-br-lg rounded-bl-sm bg-black dark:bg-white" />
    </a>
  );
};



