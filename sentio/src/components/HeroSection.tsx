
import { Button } from "@/components/ui/button";
import { NavLink } from "react-router-dom";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-sentio-light-purple/50 to-transparent py-20 lg:py-32">
      <div className="absolute inset-0 bg-hero-pattern opacity-20"></div>
      <div className="sentio-container relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="flex flex-col justify-center space-y-6">
            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                Understand your <span className="sentio-gradient-text">emotions</span> better
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mt-4 max-w-xl">
                Sentio helps you track, analyze, and improve your emotional wellbeing with AI-powered tools and insights.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <NavLink to="/auth?mode=signup">
                <Button size="lg" className="sentio-button-primary w-full sm:w-auto">
                  Get Started
                </Button>
              </NavLink>
              <NavLink to="/features">
                <Button variant="outline" size="lg" className="sentio-button-secondary w-full sm:w-auto">
                  Explore Features
                </Button>
              </NavLink>
            </div>

            <div className="flex items-center gap-2 mt-6 text-sm text-muted-foreground">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full border-2 border-white bg-sentio-gray flex items-center justify-center text-xs font-semibold"
                  >
                    {i}
                  </div>
                ))}
              </div>
              <span>Join for improving your emotional wellness</span>
            </div>
          </div>

          <div className="relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] md:w-[400px] md:h-[400px] rounded-full bg-sentio-purple/10 blur-3xl"></div>
            <div className="relative bg-white rounded-2xl shadow-xl border border-sentio-gray/20 overflow-hidden">
              <div className="p-6 bg-gradient-to-br from-sentio-purple/10 to-transparent">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sentio-purple to-sentio-dark-purple"></div>
                    <span className="font-medium">Sentio Assistant</span>
                  </div>
                  <div className="px-2 py-1 bg-sentio-green rounded-full text-xs font-medium text-sentio-dark-purple">Online</div>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-sentio-gray rounded-lg p-3 max-w-[80%]">
                  <p className="text-sm">How are you feeling today?</p>
                </div>
                <div className="bg-sentio-light-purple rounded-lg p-3 max-w-[80%] ml-auto">
                  <p className="text-sm">I'm feeling a bit anxious about my presentation today.</p>
                </div>
                <div className="bg-sentio-gray rounded-lg p-3 max-w-[80%]">
                  <p className="text-sm">I understand that feeling. Would you like to try a quick breathing exercise to help reduce your anxiety?</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    className="text-xs px-3 py-2 bg-sentio-light-purple hover:bg-sentio-purple/20 text-sentio-dark-purple rounded-lg transition-colors"
                    onClick={() => window.location.href = 'http://localhost:3000/'}
                  >
                    Yes, please
                  </button>

                  <button className="text-xs px-3 py-2 bg-sentio-gray hover:bg-sentio-gray/80 rounded-lg transition-colors">
                    Not now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
