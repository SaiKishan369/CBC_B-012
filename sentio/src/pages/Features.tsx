
import { MessageCircle, Brain, Video, Watch, LineChart, Calendar, Settings, UserCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NavLink } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FeatureCard from '@/components/FeatureCard';

const Features = () => {
  const mainFeatures = [
    {
      icon: MessageCircle,
      title: "AI Chatbot",
      description: "Our emotion-aware AI assistant provides personalized support and guidance based on your emotional state and history.",
      color: "purple"
    },
    {
      icon: Brain,
      title: "Speech Analysis",
      description: "Convert your spoken thoughts into emotional insights with our advanced speech recognition and tone analysis.",
      color: "blue"
    },
    {
      icon: Video,
      title: "Emotion Recognition",
      description: "Our video analysis tool detects micro-expressions to help you understand your emotional responses in various situations.",
      color: "green"
    },
    {
      icon: Watch,
      title: "Biometric Tracking",
      description: "Integration with popular wearables allows you to correlate physical signals like heart rate with emotional states.",
      color: "pink"
    }
  ];

  const additionalFeatures = [
    {
      icon: LineChart,
      title: "Trends & Analytics",
      description: "Visualize your emotional patterns over time to identify triggers and track improvements.",
      color: "peach"
    },
    {
      icon: Calendar,
      title: "Emotional Journal",
      description: "Keep a structured emotional journal with AI-assisted reflection prompts and insights.",
      color: "green"
    },
    {
      icon: Settings,
      title: "Personalization",
      description: "Customize your experience with preferences, reminders, and tailored recommendations.",
      color: "blue"
    },
    {
      icon: UserCircle,
      title: "Professional Support",
      description: "Optional connection with licensed therapists and counselors for additional guidance.",
      color: "purple"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-sentio-light-purple/50 to-transparent py-20">
          <div className="sentio-container">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Powerful Features for <span className="sentio-gradient-text">Emotional Wellness</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                Discover how Sentio's comprehensive suite of AI-powered tools can help you understand and improve your emotional wellbeing.
              </p>
              <NavLink to="/auth?mode=signup">
                <Button className="sentio-button-primary">
                  Get Started Now
                </Button>
              </NavLink>
            </div>
          </div>
        </section>

        {/* Main Features */}
        <section className="sentio-section bg-white">
          <div className="sentio-container">
            <h2 className="text-3xl font-bold mb-12 text-center">Core Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {mainFeatures.map((feature, index) => (
                <div key={index} className="flex gap-6">
                  <div className={`w-14 h-14 shrink-0 bg-sentio-${feature.color} rounded-xl flex items-center justify-center`}>
                    <feature.icon className="h-7 w-7 text-sentio-dark-purple" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                    <ul className="mt-3 space-y-1">
                      <li className="flex items-center text-sm text-muted-foreground">
                        <div className="w-1.5 h-1.5 bg-sentio-purple rounded-full mr-2"></div>
                        Personalized recommendations
                      </li>
                      <li className="flex items-center text-sm text-muted-foreground">
                        <div className="w-1.5 h-1.5 bg-sentio-purple rounded-full mr-2"></div>
                        Real-time feedback
                      </li>
                      <li className="flex items-center text-sm text-muted-foreground">
                        <div className="w-1.5 h-1.5 bg-sentio-purple rounded-full mr-2"></div>
                        Data-driven insights
                      </li>
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Additional Features */}
        <section className="sentio-section bg-sentio-gray/30">
          <div className="sentio-container">
            <h2 className="text-3xl font-bold mb-12 text-center">Additional Features</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {additionalFeatures.map((feature, index) => (
                <FeatureCard
                  key={index}
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                  color={feature.color as any}
                />
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="sentio-section bg-white">
          <div className="sentio-container">
            <h2 className="text-3xl font-bold mb-12 text-center">How Sentio Works</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((step) => (
                <div key={step} className="relative">
                  {step < 3 && (
                    <div className="hidden md:block absolute top-10 left-full w-full h-0.5 bg-sentio-light-purple z-0 -translate-x-12"></div>
                  )}
                  <div className="relative z-10 bg-white rounded-xl border border-sentio-gray/30 p-6 shadow-sm">
                    <div className="w-10 h-10 rounded-full bg-sentio-purple text-white flex items-center justify-center font-medium mb-4">
                      {step}
                    </div>
                    <h3 className="text-xl font-semibold mb-2">
                      {step === 1 ? "Connect Your Data" : step === 2 ? "Get AI Analysis" : "Receive Insights"}
                    </h3>
                    <p className="text-muted-foreground">
                      {step === 1
                        ? "Allow Sentio to analyze your data from conversations, video, or wearable devices."
                        : step === 2
                        ? "Our AI processes your emotional signals and identifies patterns and trends."
                        : "View personalized insights and recommendations to improve your emotional wellbeing."}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="sentio-section bg-gradient-to-r from-sentio-purple/10 via-sentio-light-purple/20 to-sentio-purple/10">
          <div className="sentio-container">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Experience Sentio?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Join thousands of users who are improving their emotional intelligence and wellbeing with our platform.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <NavLink to="/auth?mode=signup">
                  <Button size="lg" className="sentio-button-primary w-full sm:w-auto">
                    Create Free Account
                  </Button>
                </NavLink>
                <NavLink to="/dashboard">
                  <Button variant="outline" size="lg" className="sentio-button-secondary w-full sm:w-auto group">
                    Preview Dashboard
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </NavLink>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Features;
