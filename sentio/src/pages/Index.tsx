
import { NavLink } from 'react-router-dom';
import { ArrowRight, MessageCircle, Brain, Video, Watch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import HeroSection from '@/components/HeroSection';
import FeatureCard from '@/components/FeatureCard';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <HeroSection />

        {/* Features Section */}
        <section className="sentio-section bg-white">
          <div className="sentio-container">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Advanced AI Tools for Emotional Intelligence
              </h2>
              <p className="text-lg text-muted-foreground">
                Sentio combines cutting-edge AI technologies to help you understand and improve your emotional wellbeing.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <FeatureCard
                icon={MessageCircle}
                title="AI Chatbot"
                description="Talk through your emotions with our empathetic AI assistant trained to provide personalized support."
                color="purple"
              />
              <FeatureCard
                icon={Brain}
                title="Speech Analysis"
                description="Convert your speech to insights with our advanced emotional tone detection technology."
                color="blue"
              />
              <FeatureCard
                icon={Video}
                title="Emotion Recognition"
                description="Analyze facial expressions in real-time video to better understand your emotional responses."
                color="green"
              />
              <FeatureCard
                icon={Watch}
                title="Biometric Tracking"
                description="Integrate with your smartwatch to correlate physical signals with emotional states."
                color="pink"
              />
            </div>

            <div className="text-center mt-12">
              <NavLink to="/features">
                <Button variant="outline" className="group">
                  View All Features
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </NavLink>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="sentio-section bg-sentio-light-purple/30">
          <div className="sentio-container">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Trusted by People Like You
              </h2>
              <p className="text-lg text-muted-foreground">
                See how Sentio has helped people improve their emotional wellbeing and mental health.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-sentio-gray/30">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-sentio-gray flex items-center justify-center text-lg font-medium">
                      {i}
                    </div>
                    <div>
                      <h3 className="font-medium">User {i}</h3>
                      <p className="text-sm text-muted-foreground">Sentio User</p>
                    </div>
                  </div>
                  <p className="text-muted-foreground">
                    "Sentio has been a game-changer for my emotional wellbeing. The AI chatbot helps me process my feelings, and the analytics provide valuable insights I never noticed before."
                  </p>
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
                Start Your Emotional Wellness Journey Today
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Join thousands of users who are improving their emotional intelligence and wellbeing with Sentio.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <NavLink to="/auth?mode=signup">
                  <Button size="lg" className="sentio-button-primary w-full sm:w-auto">
                    Sign Up for Free
                  </Button>
                </NavLink>
                <NavLink to="/features">
                  <Button variant="outline" size="lg" className="sentio-button-secondary w-full sm:w-auto">
                    Learn More
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

export default Index;
