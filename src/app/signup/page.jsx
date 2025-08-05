"use client";
import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  IconBrandGithub,
  IconBrandGoogle,
  IconBrandOnlyfans,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
export function SignUp() {
    const router= useRouter();
    const[role,setRole]=useState("Patient");

  const handleNext = (e) => {
    e.preventDefault();
    if (role) router.push(`/Details?role=${role}`);
    console.log(role);
    console.log("Form moved to next");
  };
  return (
    <div className="flex justify-center w-full items-center min-h-screen">
    <div
      className="shadow-input mx-auto w-full max-w-md rounded-none bg-pink-100 p-4 md:rounded-2xl md:p-8 dark:bg-[#FB5AAA]">
      <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200">
        Welcome to Aceternity
      </h2>
      <p className="mt-2 max-w-sm text-sm text-neutral-600 dark:text-neutral-300">
        Login to aceternity if you can because we don&apos;t have a login flow
        yet
      </p>
      <form className="my-8" onSubmit={handleNext}>
        <div
          className="mb-4 flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2 ">
          <LabelInputContainer>
            <Label htmlFor="firstname">First name</Label>
            <Input id="firstname" placeholder="Tyler" type="text"  autoComplete="name"  className="dark:bg-pink-100"/>
          </LabelInputContainer>
          <LabelInputContainer>
            <Label htmlFor="lastname">Last name</Label>
            <Input id="lastname" placeholder="Durden" type="text"  autoComplete="name"  className="dark:bg-pink-100"/>
          </LabelInputContainer>
        </div>
        <LabelInputContainer className="mb-4">
          <Label htmlFor="phone">Phone number</Label>
          <Input id="phone" placeholder="+91-98756XXXXX" type="tel"  autoComplete="phone"  className="dark:bg-pink-100" />
        </LabelInputContainer>
        <LabelInputContainer className="mb-4">
          <Label htmlFor="role">Role</Label>
          <select id="role" value={role} onChange={(e)=>setRole(e.target.value)}  className="bg-pink-100 text-black  rounded-xl border-1 border-pink-400 p-3">
           < option value="Pateint" >Pateint</option>
           <option value="Relative" >Relative</option>
          </select>
        </LabelInputContainer>  
        
        
        
      
  <button
          className="group/btn relative block h-10 w-full rounded-xl bg-[#FD5DA8]  font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset]  dark:bg-pink-300"
          type="submit">
          Next &rarr;
         
        </button>
        <Link href="/login">
        <p>Login</p>
        </Link>

        <div
          className="my-8 h-[1px] w-full bg-gradient-to-r from-transparent via-neutral-300 to-transparent dark:via-neutral-700" />

       
      </form>
    </div>
    </div>
  );
}

const BottomGradient = () => {
  return (
    <>
      <span
        className="absolute inset-x-0 -bottom-px block h-px w-full bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-0 transition duration-500 group-hover/btn:opacity-100" />
      <span
        className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 blur-sm transition duration-500 group-hover/btn:opacity-100" />
    </>
  );
};

const LabelInputContainer = ({
  children,
  className
}) => {
  return (
    <div className={cn("flex w-full flex-col space-y-2", className)}>
      {children}
    </div>
  );
};
