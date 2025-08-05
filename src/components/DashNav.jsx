export default function DashNav(){
    return(
<div className="flex justify-between items-center bg-base-100 shadow-sm max-w-screen rounded-b-2xl p-5">
  <div className="flex-start pl-4">
<p>MaternalCare</p>
  </div>
  <div className="flex-end pr-3 flex gap-x-4">
    <button className="bg-pink-50 p-2.5 pl-3 pr-3 text-md text-pink-600 rounded-md">Emergency</button>
  </div>
</div>
    );

}