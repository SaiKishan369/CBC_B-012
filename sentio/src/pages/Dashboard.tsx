import { useState, useRef, useEffect } from "react";
import { MessageCircle, Brain, Video, Watch, ChevronRight, LineChart, Power } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DashboardCard from "@/components/DashboardCard";
import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Dashboard = () => {
  const [progress] = useState(68);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isVideoOn) {
      startVideo();
    } else {
      stopVideo();
    }

    return () => {
      stopVideo();
    };
  }, [isVideoOn]);

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setIsVideoOn(false);
    }
  };

  const stopVideo = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      streamRef.current = null;
    }
  };

  const toggleVideo = () => {
    setIsVideoOn(!isVideoOn);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow">
        {/* Dashboard Preview Banner */}
        <div className="bg-sentio-purple/10 py-3">
          <div className="sentio-container">
            <div className="flex flex-col sm:flex-row items-center justify-between">
              <p className="text-sm font-medium">
                <span className="text-sentio-dark-purple">Dashboard Preview</span> — Sign up to unlock all features
              </p>
              <NavLink to="/auth?mode=signup" className="mt-2 sm:mt-0">
                <Button size="sm" className="bg-sentio-purple hover:bg-sentio-dark-purple text-white text-sm h-8">
                  Sign Up Free
                </Button>
              </NavLink>
            </div>
          </div>
        </div>

        {/* Header */}
        <section className="bg-white py-8 border-b border-sentio-gray/20">
          <div className="sentio-container">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
                <p className="text-muted-foreground">Tuesday, May 10, 2025</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-white rounded-lg border border-sentio-gray/30 p-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="bg-sentio-green rounded-full w-2 h-2 animate-pulse-soft"></div>
                    <span className="text-sm font-medium">Wellbeing Score</span>
                  </div>
                  <div className="mt-1">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-2xl font-bold">{progress}</span>
                      <span className="text-xs text-sentio-purple">+5%</span>
                    </div>
                    <Progress value={progress} className="h-1.5" />
                  </div>
                </div>
                <Button variant="outline" className="hidden md:flex">Refresh Data</Button>
              </div>
            </div>
          </div>
        </section>

        {/* Dashboard Content */}
        <section className="py-8 bg-sentio-gray/10">
          <div className="sentio-container">
            <Tabs defaultValue="overview" className="space-y-6">
              <div className="flex justify-between items-center">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="insights">Insights</TabsTrigger>
                  <TabsTrigger value="tools">Tools</TabsTrigger>
                </TabsList>
                <Button variant="ghost" size="sm" className="text-sm hidden sm:flex">
                  Last 7 days <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>

              <TabsContent value="overview" className="space-y-6">
                {/* Main Dashboard Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* AI Chatbot Card */}
                  <DashboardCard title="AI Chatbot" icon={MessageCircle} color="bg-sentio-light-purple">
                    <div className="space-y-4">
                      <div className="bg-sentio-gray/40 rounded-lg p-3 max-w-[80%] text-sm">
                        How are you feeling today?
                      </div>
                      <div className="flex justify-end">
                        <div className="bg-sentio-purple/20 rounded-lg p-3 max-w-[80%] text-sm">
                          I'm feeling a bit stressed about work deadlines.
                        </div>
                      </div>
                      <div className="bg-sentio-gray/40 rounded-lg p-3 max-w-[80%] text-sm">
                        I understand that can be challenging. Would you like to talk through some stress management techniques?
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="text-xs">
                          Yes, please
                        </Button>
                        <Button variant="ghost" size="sm" className="text-xs">
                          Not now
                        </Button>
                      </div>
                    </div>
                  </DashboardCard>

                  {/* Speech Analysis Card */}
                  <DashboardCard title="Speech Analysis" icon={Brain} color="bg-sentio-blue">
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-full h-10 bg-sentio-gray/30 rounded-md relative overflow-hidden">
                          <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
                            Tap to record your voice
                          </div>
                          <div className="absolute bottom-0 left-0 h-1 bg-sentio-purple w-full scale-x-0 origin-left"></div>
                        </div>
                        <Button variant="outline" size="icon" className="h-10 w-10">
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Confidence</span>
                          <div className="flex items-center gap-1">
                            <span className="font-medium">High</span>
                            <div className="w-16 h-2 bg-sentio-gray/30 rounded-full overflow-hidden">
                              <div className="bg-sentio-purple h-full w-4/5"></div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Anxiety</span>
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Low</span>
                            <div className="w-16 h-2 bg-sentio-gray/30 rounded-full overflow-hidden">
                              <div className="bg-sentio-purple h-full w-1/5"></div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Clarity</span>
                          <div className="flex items-center gap-1">
                            <span className="font-medium">Medium</span>
                            <div className="w-16 h-2 bg-sentio-gray/30 rounded-full overflow-hidden">
                              <div className="bg-sentio-purple h-full w-3/5"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </DashboardCard>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Video Emotion Recognition */}
                  <DashboardCard title="Emotion Recognition" icon={Video} color="bg-sentio-green">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Power className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Camera</span>
                        </div>
                        <Switch
                          checked={isVideoOn}
                          onCheckedChange={toggleVideo}
                        />
                      </div>
                      <div className="aspect-video bg-sentio-gray/30 rounded-lg overflow-hidden relative">
                        {isVideoOn ? (
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Video className="h-8 w-8 text-muted-foreground mb-2 opacity-50" />
                            <p className="text-sm text-muted-foreground">Camera is off</p>
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <span className="px-2 py-1 bg-sentio-light-purple/50 rounded text-xs">😊 Happy</span>
                        <span className="px-2 py-1 bg-sentio-blue/50 rounded text-xs">😐 Neutral</span>
                        <span className="px-2 py-1 bg-sentio-pink/50 rounded text-xs">😟 Concerned</span>
                      </div>
                    </div>
                  </DashboardCard>

                  {/* Smartwatch Data */}
                  <DashboardCard title="Biometric Data" icon={Watch} color="bg-sentio-pink">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Heart Rate</span>
                        <span className="text-sm font-medium">72 bpm</span>
                      </div>
                      <div className="h-10 bg-sentio-gray/20 rounded-md overflow-hidden relative">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <LineChart className="h-5 w-5 text-sentio-purple opacity-50" />
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Sleep Quality</span>
                        <span className="text-sm font-medium">6.5 hrs</span>
                      </div>
                      <div className="h-2 bg-sentio-gray/20 rounded-full overflow-hidden">
                        <div className="bg-sentio-purple h-full w-3/4"></div>
                      </div>
                    </div>
                  </DashboardCard>

                  {/* Emotional Trends */}
                  <DashboardCard title="Weekly Trends" icon={LineChart} color="bg-sentio-peach">
                    <div className="space-y-4">
                      <div className="h-24 bg-sentio-gray/20 rounded-md overflow-hidden relative">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <LineChart className="h-8 w-8 text-muted-foreground opacity-50" />
                        </div>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Mon</span>
                        <span>Tue</span>
                        <span>Wed</span>
                        <span>Thu</span>
                        <span>Fri</span>
                        <span>Sat</span>
                        <span>Sun</span>
                      </div>
                    </div>
                  </DashboardCard>
                </div>
              </TabsContent>

              <TabsContent value="insights">
                <div className="min-h-[300px] flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-xl font-semibold">Sign up to view insights</p>
                    <p className="text-muted-foreground mb-4">Unlock access to personalized emotional insights</p>
                    <NavLink to="/auth?mode=signup">
                      <Button>Create Free Account</Button>
                    </NavLink>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="tools">
                <div className="min-h-[300px] flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-xl font-semibold">Sign up to access tools</p>
                    <p className="text-muted-foreground mb-4">Unlock our full suite of emotional wellness tools</p>
                    <NavLink to="/auth?mode=signup">
                      <Button>Create Free Account</Button>
                    </NavLink>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* CTA Section */}
        <section className="sentio-section bg-white border-t border-sentio-gray/20">
          <div className="sentio-container">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                Ready to unlock your full emotional potential?
              </h2>
              <p className="text-md md:text-lg text-muted-foreground mb-8">
                Create a free account to access all dashboard features and start your wellness journey.
              </p>
              <NavLink to="/auth?mode=signup">
                <Button size="lg" className="sentio-button-primary">
                  Create Free Account
                </Button>
              </NavLink>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;
