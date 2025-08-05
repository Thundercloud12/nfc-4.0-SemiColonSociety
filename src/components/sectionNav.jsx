"use client"
import { useRouter } from "next/navigation";

export default function SectionNav({name,text,click}){
  const router= useRouter();
  const handleAdd = (e) => {
    e.preventDefault();
  if (click === "symptom") {
    router.push("/VoiceToText");
    console.log("Redirected to voice page");
  }
};
 
    return(
<div className="flex justify-between items-center bg-base-100 shadow-sm max-w-screen w-full rounded-2xl p-3">
  <div className="flex-start pl-4">
<p>{name}</p>
  </div>
  <div className="flex-end pr-3 flex gap-x-4">
    <button onClick={handleAdd} className="bg-pink-50 p-2.5 pl-3 pr-3 text-md text-pink-600 rounded-md">{text}</button>
  </div>
</div>
    );

}