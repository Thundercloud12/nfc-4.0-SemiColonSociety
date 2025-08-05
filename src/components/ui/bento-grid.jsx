import { cn } from "@/lib/utils";

export const BentoGrid = ({ className, children }) => {
  return (
    <div
      className={cn(
        "mx-auto grid max-w-7xl grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 auto-rows-[12rem] md:auto-rows-[18rem] px-4",
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
}) => {
  return (
    <div
      className={cn(
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
        </div>
      </div>
    </div>
  );
};
