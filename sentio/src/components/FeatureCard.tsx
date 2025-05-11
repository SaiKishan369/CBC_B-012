
import { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  color: "purple" | "blue" | "green" | "pink" | "peach";
}

const FeatureCard = ({ icon: Icon, title, description, color }: FeatureCardProps) => {
  const getColorClasses = () => {
    switch (color) {
      case "blue":
        return "bg-sentio-blue";
      case "green":
        return "bg-sentio-green";
      case "pink":
        return "bg-sentio-pink";
      case "peach":
        return "bg-sentio-peach";
      default:
        return "bg-sentio-light-purple";
    }
  };

  return (
    <div className="sentio-card hover:translate-y-[-4px] transition-all duration-300">
      <div className="p-6">
        <div className={`w-12 h-12 ${getColorClasses()} rounded-lg flex items-center justify-center mb-4`}>
          <Icon className="h-6 w-6 text-sentio-dark-purple" />
        </div>
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </div>
  );
};

export default FeatureCard;
