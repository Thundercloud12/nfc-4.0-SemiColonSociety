import { cn } from "@/lib/utils";

<<<<<<< HEAD
export const BentoGrid = ({ className, children }) => {
  return (
    <div
      className={cn(
        "mx-auto grid max-w-7xl grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 auto-rows-[12rem] md:auto-rows-[18rem] px-4",
=======
export const BentoGrid = ({
  className,
  children,
}) => {
  return (
    <div
      className={cn(
        "grid md:auto-rows-[18rem] grid-cols-1 md:grid-cols-3 gap-4 max-w-7xl mx-auto",
>>>>>>> 273bca88eb7bc929934c0ff922073cd440029dfd
        className
      )}
    >
      {children}
    </div>
  );
};

export const BentoGridItem = ({
  className,
  title,
  description,
  header,
<<<<<<< HEAD
=======
  icon,
>>>>>>> 273bca88eb7bc929934c0ff922073cd440029dfd
}) => {
  return (
    <div
      className={cn(
<<<<<<< HEAD
        "group/bento relative flex flex-col rounded-2xl border border-neutral-200 bg-[#FA86C4] overflow-hidden transition-all hover:shadow-2xl hover:-translate-y-1",
        className
      )}
    >
      {/* Header Section (Image/Skeleton) */}
      <div className="flex-1">{header}

        {/* Content */}
        <div className="p-4 transition duration-300 group-hover/bento:translate-x-2">
          <h3 className="font-sans text-lg font-semibold">
            {title}
          </h3>
          <p className="text-sm">{description}</p>
=======
        "row-span-1 rounded-xl group/bento hover:shadow-xl transition duration-200 shadow-input dark:shadow-none p-4 dark:bg-black dark:border-white/[0.2] bg-white border border-transparent justify-between flex flex-col space-y-4",
        className
      )}
    >
      {header}
      <div className="group-hover/bento:translate-x-2 transition duration-200">
        {icon}
        <div className="font-sans font-bold text-neutral-600 dark:text-neutral-200 mb-2 mt-2">
          {title}
        </div>
        <div className="font-sans font-normal text-neutral-600 text-xs dark:text-neutral-300">
          {description}
>>>>>>> 273bca88eb7bc929934c0ff922073cd440029dfd
        </div>
      </div>
    </div>
  );
};
