import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { authApi, LoginCredentials, SignupCredentials } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { toast } from "sonner";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const defaultTab = searchParams.get("mode") === "signup" ? "signup" : "login";
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id.replace("-signup", "")]: value
    }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const credentials: LoginCredentials = {
        email: formData.email,
        password: formData.password,
      };

      const response = await authApi.login(credentials);
      localStorage.setItem("token", response.token);
      localStorage.setItem("user", JSON.stringify(response.user));
      toast.success("Login successful!");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const credentials: SignupCredentials = {
        email: formData.email,
        password: formData.password,
        name: `${formData.firstName} ${formData.lastName}`,
      };

      const response = await authApi.signup(credentials);
      localStorage.setItem("token", response.token);
      localStorage.setItem("user", JSON.stringify(response.user));
      toast.success("Account created successfully!");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Signup failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">Welcome to Sentio</h1>
            <p className="text-muted-foreground mt-2">
              Your personalized emotional wellness platform
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-sentio-gray/30 overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="bg-sentio-light-purple/30 px-6 py-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Log In</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>
              </div>

              <div className="p-6">
                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium mb-1">
                        Email
                      </label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        className="sentio-input"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium mb-1">
                        Password
                      </label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        className="sentio-input"
                        required
                        value={formData.password}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="remember" />
                        <label
                          htmlFor="remember"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Remember me
                        </label>
                      </div>
                      <a href="#" className="text-sm text-sentio-purple hover:text-sentio-dark-purple">
                        Forgot password?
                      </a>
                    </div>
                    <Button 
                      type="submit" 
                      className="sentio-button-primary w-full"
                      disabled={isLoading}
                    >
                      {isLoading ? "Logging in..." : "Log In"}
                    </Button>
                    <div className="text-center text-sm text-muted-foreground">
                      Don't have an account?{" "}
                      <button
                        type="button"
                        onClick={() => setActiveTab("signup")}
                        className="text-sentio-purple hover:text-sentio-dark-purple font-medium"
                      >
                        Sign up
                      </button>
                    </div>
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="firstName" className="block text-sm font-medium mb-1">
                          First Name
                        </label>
                        <Input
                          id="firstName"
                          type="text"
                          placeholder="Jane"
                          className="sentio-input"
                          required
                          value={formData.firstName}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div>
                        <label htmlFor="lastName" className="block text-sm font-medium mb-1">
                          Last Name
                        </label>
                        <Input
                          id="lastName"
                          type="text"
                          placeholder="Doe"
                          className="sentio-input"
                          required
                          value={formData.lastName}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="email-signup" className="block text-sm font-medium mb-1">
                        Email
                      </label>
                      <Input
                        id="email-signup"
                        type="email"
                        placeholder="you@example.com"
                        className="sentio-input"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div>
                      <label htmlFor="password-signup" className="block text-sm font-medium mb-1">
                        Password
                      </label>
                      <Input
                        id="password-signup"
                        type="password"
                        placeholder="••••••••"
                        className="sentio-input"
                        required
                        value={formData.password}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="flex items-start space-x-2">
                      <Checkbox id="terms" className="mt-1" required />
                      <label
                        htmlFor="terms"
                        className="text-sm text-muted-foreground"
                      >
                        I agree to the{" "}
                        <a href="#" className="text-sentio-purple hover:text-sentio-dark-purple">
                          Terms of Service
                        </a>{" "}
                        and{" "}
                        <a href="#" className="text-sentio-purple hover:text-sentio-dark-purple">
                          Privacy Policy
                        </a>
                      </label>
                    </div>
                    <Button 
                      type="submit" 
                      className="sentio-button-primary w-full"
                      disabled={isLoading}
                    >
                      {isLoading ? "Creating Account..." : "Create Account"}
                    </Button>
                    <div className="text-center text-sm text-muted-foreground">
                      Already have an account?{" "}
                      <button
                        type="button"
                        onClick={() => setActiveTab("login")}
                        className="text-sentio-purple hover:text-sentio-dark-purple font-medium"
                      >
                        Log in
                      </button>
                    </div>
                  </form>
                </TabsContent>
              </div>
            </Tabs>
          </div>
          
          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>
              By signing up, you agree to our{" "}
              <a href="#" className="text-sentio-dark-purple hover:underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="text-sentio-dark-purple hover:underline">
                Privacy Policy
              </a>
              .
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Auth;
