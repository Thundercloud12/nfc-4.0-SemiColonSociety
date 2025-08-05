import DashNav from "./DashNav";
import SectionNav from "./sectionNav";

export default function SymptomSec(){
    return(
        <div className="max-w-screen">
            <SectionNav name="Symptom" text="Add Symptom" click="symptom"/>
        </div>
    );
}