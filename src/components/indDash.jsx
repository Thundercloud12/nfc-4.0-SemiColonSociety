import DashNav from "./DashNav";
import SymptomSec from "./Symptom";

export default function IndDash(){
    return(
        <div className="grid min-h-screen  w-full">
            <div className="max-w-screen">
<DashNav/>
            </div>
                <div className="flex  w-full flex-col lg:flex-row">
  <div className=" bg-base-300 rounded-box grid  grow p-5">Content</div>
    <div className="divider lg:divider-horizontal"></div>
  <div className=" bg-base-300 rounded-box grid min-h-screen grow p-5 "><SymptomSec/></div>
</div>
            </div>



    );
}