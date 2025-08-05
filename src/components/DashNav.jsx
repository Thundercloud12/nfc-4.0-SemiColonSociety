export default function DashNav(){
    return(
<div className="flex justify-between items-center bg-base-100 shadow-sm max-w-screen mt-2 rounded-2xl p-5">
  <div className="flex-start pl-4">
<p className="text-pink-600 text-lg">MaternalCare</p>
  </div>
  <div className="flex-end pr-3 flex gap-x-4">
    <button className="bg-pink-50 p-2.5 pl-3 pr-3 text-md text-pink-600 rounded-md hover:bg-pink-400 hover:text-white">Emergency</button>
  </div>
</div>
    );

}