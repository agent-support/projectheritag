import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, User, Mail, Phone, Home, Calendar, Edit } from "lucide-react";
import type { User as AuthUser } from "@supabase/supabase-js";

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    full_name: "",
    username: "",
    email: "",
    phone: "",
    address: "",
    date_of_birth: "",
    age: "",
    profile_picture_url: ""
  });

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (data) {
        setProfile({
          full_name: data.full_name || "",
          username: data.username || "",
          email: data.email || "",
          phone: data.phone || "",
          address: data.address || "",
          date_of_birth: data.date_of_birth || "",
          age: data.age?.toString() || "",
          profile_picture_url: data.profile_picture_url || ""
        });
      }
    };
    loadProfile();
  }, [navigate]);

  const handleSave = async () => {
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: profile.full_name,
        username: profile.username,
        phone: profile.phone,
        address: profile.address,
        date_of_birth: profile.date_of_birth || null,
        age: profile.age ? parseInt(profile.age) : null,
        profile_picture_url: profile.profile_picture_url
      })
      .eq("id", user!.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Success", description: "Profile updated successfully" });
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-primary">
      <Navbar />
      <div className="pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <Button onClick={() => navigate("/dashboard")} variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-foreground">My Profile</h1>
            <Button onClick={() => isEditing ? handleSave() : setIsEditing(true)}>
              {isEditing ? "Save Changes" : "Edit Profile"}
              {!isEditing && <Edit className="w-4 h-4 ml-2" />}
            </Button>
          </div>

          <Card className="p-8 bg-card border-border">
            <div className="flex flex-col items-center mb-8">
              <div className="w-32 h-32 bg-accent/20 rounded-full flex items-center justify-center mb-4 overflow-hidden">
                {profile.profile_picture_url ? (
                  <img src={profile.profile_picture_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-16 h-16 text-accent" />
                )}
              </div>
              {isEditing && (
                <div className="w-full max-w-md">
                  <Label>Profile Picture URL</Label>
                  <Input 
                    value={profile.profile_picture_url}
                    onChange={(e) => setProfile({...profile, profile_picture_url: e.target.value})}
                    placeholder="Enter image URL"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4" />
                  Full Name
                </Label>
                <Input 
                  value={profile.full_name}
                  onChange={(e) => setProfile({...profile, full_name: e.target.value})}
                  disabled={!isEditing}
                />
              </div>

              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4" />
                  Username
                </Label>
                <Input 
                  value={profile.username}
                  onChange={(e) => setProfile({...profile, username: e.target.value})}
                  disabled={!isEditing}
                  placeholder="Enter username"
                />
              </div>

              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <Mail className="w-4 h-4" />
                  Email
                </Label>
                <Input 
                  value={profile.email}
                  disabled
                />
              </div>

              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <Phone className="w-4 h-4" />
                  Phone Number
                </Label>
                <Input 
                  value={profile.phone}
                  onChange={(e) => setProfile({...profile, phone: e.target.value})}
                  disabled={!isEditing}
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4" />
                  Date of Birth
                </Label>
                <Input 
                  type="date"
                  value={profile.date_of_birth}
                  onChange={(e) => setProfile({...profile, date_of_birth: e.target.value})}
                  disabled={!isEditing}
                />
              </div>

              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4" />
                  Age
                </Label>
                <Input 
                  type="number"
                  value={profile.age}
                  onChange={(e) => setProfile({...profile, age: e.target.value})}
                  disabled={!isEditing}
                  placeholder="Enter age"
                />
              </div>

              <div className="md:col-span-2">
                <Label className="flex items-center gap-2 mb-2">
                  <Home className="w-4 h-4" />
                  Address
                </Label>
                <Input 
                  value={profile.address}
                  onChange={(e) => setProfile({...profile, address: e.target.value})}
                  disabled={!isEditing}
                  placeholder="Enter your address"
                />
              </div>
            </div>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Profile;