export default function SectionNav({name,text,click}){
    return(
<div className="navbar bg-base-100 shadow-sm max-w-screen w-full rounded-2xl">
  <div className="navbar-start pl-4">
<p>{name}</p>
  </div>
  <div className="navbar-end pr-3 flex gap-x-4">
    <button  className="btn btn-soft btn-secondary">{text}</button>
  </div>
</div>
    );

}