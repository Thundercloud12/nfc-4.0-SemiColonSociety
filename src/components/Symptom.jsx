import DashNav from "./DashNav";
import SectionNav from "./sectionNav";

export default function SymptomSec(){
    return(
        <div className="max-w-screen  bg-pink-100 ">
            <SectionNav name="Symptom" text="Add Symptom" click="symptom"/>
        </div>
    );
}