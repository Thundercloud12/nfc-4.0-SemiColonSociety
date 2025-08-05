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

import { Router, useRouter } from "next/navigation";


export default function Login() {
const[role,setRole]=useState("Patient");
const[relation,setRelation]=useState("");
const router= useRouter();
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if(role==="Patient"||role==="Relative"){
        router.push("/UserDash");
    }
    else if(role === "AshaWorker") {
    router.push("/AshaDash");
}
   
    console.log("Form submitted");
  };
  return (
    <div className="flex justify-center w-full items-center min-h-screen">
    <div
      className="shadow-input mx-auto w-full max-w-md rounded-none bg-pink-100 p-4 md:rounded-2xl md:p-8 dark:bg-[#FB5AAA]">
      <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200">
        Welcome to Aceternity
      </h2>
      <p className="mt-2 max-w-sm text-sm text-neutral-600 dark:text-neutral-300">
        Fill in the details
      </p>
      
      <form className="my-8" onSubmit={handleSubmit}>
            <LabelInputContainer className="mb-4">
                      <Label htmlFor="logInRole">Role</Label>
                      <select id="logInRole" value={role} onChange={(e)=>setRole(e.target.value)}  className="bg-pink-100 text-black rounded-xl border-1 border-pink-300 p-3">
                       < option  value="Patient" >Patient</option>
                       <option value="Relative" >Relative </option>
                       <option value="AshaWorker" >AshaWorker </option>
                      </select>
                    </LabelInputContainer>  
        
        {(role === "Patient" || role==="AshaWorker")&& (
  <>
    <LabelInputContainer className="mb-4">
      <Label htmlFor="Name">Name</Label>
      <Input id="Name" placeholder="seema" type="text"  className="dark:bg-pink-100"/>
    </LabelInputContainer>


  <LabelInputContainer className="mb-4">
      <Label htmlFor="Password">Password</Label>
      <Input id="Password" placeholder="Enter password" type="password"  className="dark:bg-pink-100"/>
    </LabelInputContainer>
      
  </>
  )}

   {role === "Relative" && (    
  <>
    <LabelInputContainer className="mb-4">
      <Label htmlFor="relativeName"> Patient Name</Label>
      <Input id="relativeName" placeholder="seema" type="text" className="dark:bg-pink-100" />
    </LabelInputContainer>

    <LabelInputContainer className="mb-4">
      <Label htmlFor="relation">Relation</Label>
     <select id="relation" value={relation} onChange={(e)=>setRelation(e.target.value)}  className="bg-pink-100 text-black rounded-xl border-1 border-pink-300 p-3 dark:bg-pink-100">
           <option value="Husband"  >Husband</option>
           < option  value="father" >Father</option>
           < option  value="fatherInLaw" >Father in Law</option>
           <option value="mother"  >Mother</option>
           <option value="motherInLaw"  >Mother in law </option>
           <option value="sister" >Sister</option>
           <option value="Brother">Brother</option>
          </select>
    </LabelInputContainer>

<LabelInputContainer className="mb-4">
      <Label htmlFor="uniCode"> Code</Label>
      <Input id="uniCode" placeholder="Enter code" type="text" className="dark:bg-pink-100" />
    </LabelInputContainer>

  </>
  )}
      
<button  
          className="group/btn relative block h-10 w-full rounded-xl bg-[#FD5DA8] font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:bg-pink-300"
          type="submit"
        >
          Log In &rarr;
          <BottomGradient />
        </button>
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
