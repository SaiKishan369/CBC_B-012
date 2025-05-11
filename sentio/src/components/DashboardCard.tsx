
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface DashboardCardProps {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
  color?: string;
}

const DashboardCard = ({ title, icon: Icon, children, color = "bg-sentio-light-purple" }: DashboardCardProps) => {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardHeader className={`flex flex-row items-center justify-between ${color} bg-opacity-30 p-4`}>
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
        <Icon className="h-5 w-5 text-sentio-dark-purple" />
      </CardHeader>
      <CardContent className="p-5">{children}</CardContent>
    </Card>
  );
};

export default DashboardCard;
