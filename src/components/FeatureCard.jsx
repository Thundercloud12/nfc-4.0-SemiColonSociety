import { cn } from "@/lib/utils";

const FeatureCard = () => {
    const features = [
        {
            title: "Personal Dashbord",
            description: "A personalized dashboard to track your health and wellness.",
            header: <img src="/images/dashboard.png" alt="Dashboard" className="w-full h-auto rounded-lg" />
        },
        {
            title: "Family Dashboard",
            description: "A family dashboard to manage and monitor health activities together.",
            header: <img src="/images/family-dashboard.png" alt="Family Dashboard" className="w-full h-auto rounded-lg" />
        },
        {
            title: "Appointment Scheduling", description: "Easily schedule and manage appointments with healthcare providers.",
            header: <img src="/images/appointment-scheduling.png" alt="Appointment Scheduling" className="w-full h-auto rounded-lg" />
        },
        {
            title: "Appointment Reminders",
            description: "Automated reminders for upcoming appointments to ensure you never miss a visit.",
            header: <img src="/images/appointment-reminders.png" alt="Appointment Reminders" className="w-full h-auto rounded-lg" />
        },
        {
            title: "ASHA worker Support",
            description: "Support for ASHA workers to manage community health initiatives.",
            header: <img src="/images/asha-worker-support.png" alt="ASHA Worker Support" className="w-full h-auto rounded-lg" />
        },
        {
            title: "Multi-Language Support",
            description: "Support for multiple languages to cater to diverse communities.",
            header: <img src="/images/multi-language-support.png" alt="Multi-Language Support" className="w-full h-auto rounded-lg" />
        },
        {
            title: "Symptom Checker",
            description: "A symptom checker to help users understand their health conditions.",
            header: <img src="/images/symptom-checker.png" alt="Symptom Checker" className="w-full h-auto rounded-lg" />
        },
    ]
    return (
        <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4  relative z-10 py-10 max-w-7xl mx-auto">
            {features.map((feature, index) => (
                <Feature key={feature.title} {...feature} index={index} />
            ))}
        </div>
    );
}

const Feature = ({
    title,
    description,
    index
}) => {
    return (
        <div
            className={cn(
                "flex flex-col lg:border-r py-10 relative group/feature",
                (index === 0 || index === 4) && "lg:border-l",
                index < 4 && "lg:border-b"
            )}>
            {index < 4 && (
                <div
                    className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-t from-pink-200 to-transparent pointer-events-none" />
            )}
            {index >= 4 && (
                <div
                    className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-b from-pink-200 to-transparent pointer-events-none" />
            )}
            <div className="text-lg font-bold mb-2 relative z-10 px-10">
                <div
                    className="absolute left-0 inset-y-0 h-6 group-hover/feature:h-8 w-1 rounded-tr-full rounded-br-full bg-neutral-30 group-hover/feature:bg-pink-500 transition-all duration-200 origin-center" />
                <span
                    className="group-hover/feature:translate-x-2 transition duration-200 inline-block text-pink-800">
                    {title}
                </span>
            </div>
            <p
                className="text-sm text-pink-400 max-w-xs relative z-10 px-10">
                {description}
            </p>
        </div>
    );
};

export default FeatureCard
