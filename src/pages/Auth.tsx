import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [country, setCountry] = useState("");
  const [address, setAddress] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
      }
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        navigate("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Check if user is blocked
      if (data.user) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("status")
          .eq("id", data.user.id)
          .single();

        if (profileError) throw profileError;

        if (profile?.status === "blocked") {
          await supabase.auth.signOut();
          toast({
            title: "Account Restricted",
            description: "Your account has been restricted. Please contact support.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
      }

      toast({
        title: "Success!",
        description: "You have been signed in successfully.",
      });
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to sign in",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Send OTP email first
      const { error: otpError } = await supabase.functions.invoke('send-otp-email', {
        body: {
          email,
          name: `${firstName} ${lastName}`,
        },
      });

      if (otpError) throw otpError;

      // Store user data temporarily for after OTP verification
      setPendingUserId(email);
      setShowOtpVerification(true);

      toast({
        title: "Verification Code Sent!",
        description: "Please check your email for the 6-digit verification code.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send verification code",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpLoading(true);

    try {
      // Verify OTP from database - trim both values to ensure accurate comparison
      const { data: otpData, error: otpError } = await supabase
        .from('otp_codes')
        .select('*')
        .eq('email', email.trim().toLowerCase())
        .eq('otp_code', otp.trim())
        .single();

      if (otpError || !otpData) {
        throw new Error("Invalid verification code");
      }

      // Check if OTP is expired
      if (new Date(otpData.expires_at) < new Date()) {
        throw new Error("Verification code has expired. Please request a new one.");
      }

      // Check if already verified
      if (otpData.verified) {
        throw new Error("This verification code has already been used.");
      }

      // Mark OTP as verified
      await supabase
        .from('otp_codes')
        .update({ verified: true })
        .eq('email', email)
        .eq('otp_code', otp);

      // Now create the actual user account
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            first_name: firstName,
            last_name: lastName,
            full_name: `${firstName} ${lastName}`,
            date_of_birth: dateOfBirth,
            country,
            address,
            username,
            phone,
          },
        },
      });

      if (signUpError) throw signUpError;

      // Upload profile picture if provided
      if (profilePicture && authData.user) {
        const fileExt = profilePicture.name.split('.').pop();
        const fileName = `${authData.user.id}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('profile-pictures')
          .upload(filePath, profilePicture);

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('profile-pictures')
            .getPublicUrl(filePath);

          await supabase
            .from('profiles')
            .update({ profile_picture_url: publicUrl })
            .eq('id', authData.user.id);
        }
      }

      toast({
        title: "Success!",
        description: "Account created successfully. You can now sign in.",
      });

      // Reset form and hide OTP verification
      setShowOtpVerification(false);
      setOtp("");
      setPendingUserId(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to verify code",
        variant: "destructive",
      });
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setOtpLoading(true);
    try {
      const { error } = await supabase.functions.invoke('send-otp-email', {
        body: {
          email,
          name: `${firstName} ${lastName}`,
        },
      });

      if (error) throw error;

      toast({
        title: "Code Resent!",
        description: "A new verification code has been sent to your email.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to resend code",
        variant: "destructive",
      });
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary">
      <Navbar />
      <div className="pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-md">
          <Card className="p-8 bg-card border-border">
            <h1 className="text-3xl font-bold text-center mb-8 text-foreground">Account Access</h1>
            
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-foreground">Email</label>
                    <Input 
                      type="email" 
                      placeholder="Enter your email" 
                      className="bg-background"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-foreground">Password</label>
                    <Input 
                      type="password" 
                      placeholder="Enter your password" 
                      className="bg-background"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button className="w-full" size="lg" disabled={loading}>
                    {loading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                {!showOtpVerification ? (
                  <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-foreground">First Name</label>
                      <Input 
                        type="text" 
                        placeholder="First name" 
                        className="bg-background"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-foreground">Last Name</label>
                      <Input 
                        type="text" 
                        placeholder="Last name" 
                        className="bg-background"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-foreground">Username</label>
                    <Input 
                      type="text" 
                      placeholder="Choose a username" 
                      className="bg-background"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-foreground">Email</label>
                    <Input 
                      type="email" 
                      placeholder="Enter your email" 
                      className="bg-background"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-foreground">Phone Number</label>
                    <Input 
                      type="tel" 
                      placeholder="Enter your phone number" 
                      className="bg-background"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-foreground">Date of Birth</label>
                    <Input 
                      type="date" 
                      className="bg-background"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-foreground">Country</label>
                    <Input 
                      type="text" 
                      placeholder="Enter your country" 
                      className="bg-background"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-foreground">House Address</label>
                    <Input 
                      type="text" 
                      placeholder="Enter your address" 
                      className="bg-background"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-foreground">Profile Picture</label>
                    <div className="flex items-center gap-2">
                      <Input 
                        type="file" 
                        accept="image/*"
                        className="bg-background"
                        onChange={(e) => setProfilePicture(e.target.files?.[0] || null)}
                      />
                      <Upload className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-foreground">Password</label>
                    <Input 
                      type="password" 
                      placeholder="Create a password" 
                      className="bg-background"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                    <Button className="w-full" size="lg" disabled={loading}>
                      {loading ? "Sending verification code..." : "Continue"}
                    </Button>
                  </form>
                ) : (
                  <div className="space-y-6">
                    <div className="text-center">
                      <h3 className="text-xl font-semibold mb-2 text-foreground">Verify Your Email</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        We've sent a 6-digit verification code to <span className="font-semibold">{email}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        The code will expire in 30 minutes
                      </p>
                    </div>
                    
                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-foreground">Verification Code</label>
                        <Input 
                          type="text" 
                          placeholder="Enter 6-digit code" 
                          className="bg-background text-center text-2xl tracking-widest"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          maxLength={6}
                          required
                        />
                      </div>
                      
                      <Button className="w-full" size="lg" disabled={otpLoading || otp.length !== 6}>
                        {otpLoading ? "Verifying..." : "Verify & Create Account"}
                      </Button>
                      
                      <div className="text-center">
                        <Button
                          type="button"
                          variant="link"
                          onClick={handleResendOtp}
                          disabled={otpLoading}
                          className="text-sm"
                        >
                          Didn't receive the code? Resend
                        </Button>
                      </div>
                      
                      <div className="text-center">
                        <Button
                          type="button"
                          variant="link"
                          onClick={() => {
                            setShowOtpVerification(false);
                            setOtp("");
                          }}
                          className="text-sm text-muted-foreground"
                        >
                          Back to signup form
                        </Button>
                      </div>
                    </form>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Auth;
