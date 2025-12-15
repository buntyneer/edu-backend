import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LogIn,
  BarChart3,
  Users,
  UserCheck,
  MessageSquare,
  QrCode,
  Shield,
  Zap,
  LogOut
} from "lucide-react";
import { User } from "@/api/entities";
import { School as SchoolEntity } from "@/api/entities";
import { toast } from "sonner";

/* ---------------- FEATURES ---------------- */

const features = [
  {
    icon: Users,
    title: "Easy Student Management",
    description: "Keep all students info in one place."
  },
  {
    icon: QrCode,
    title: "Magic QR Attendance",
    description: "Scan & mark attendance instantly."
  },
  {
    icon: MessageSquare,
    title: "Auto WhatsApp Updates",
    description: "Parents get real-time updates."
  },
  {
    icon: UserCheck,
    title: "Happy Gatekeepers",
    description: "Simple app for security staff."
  },
  {
    icon: BarChart3,
    title: "Smart Reports",
    description: "Analytics that actually help."
  },
  {
    icon: Shield,
    title: "Secure Always",
    description: "Top-level security for data."
  }
];

/* ---------------- COMPONENT ---------------- */

export default function Homepage() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [school, setSchool] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  /* ---------- AUTO LOGIN CHECK ---------- */
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await User.me();
        setCurrentUser(user);

        if (user?.school_id) {
          const schools = await SchoolEntity.filter({ id: user.school_id });
          if (schools.length) setSchool(schools[0]);
        }
      } catch {
        setCurrentUser(null);
        setSchool(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, []);

  /* ---------- GOOGLE LOGIN ---------- */
  const handleGoogleLogin = () => {
    // 🔥 IMPORTANT: backend Google OAuth route
    window.location.href = "http://localhost:5000/api/auth/google";
    // 👉 production me yahan Render backend URL daalna
  };

  /* ---------- LOGOUT ---------- */
  const handleLogout = async () => {
    await User.logout();
    localStorage.removeItem("token");
    setCurrentUser(null);
    toast.success("Logged out");
    navigate("/");
  };

  /* ---------- UI LOADER ---------- */
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* ---------- HEADER ---------- */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
          <h1 className="text-xl font-bold text-blue-600">
            {school?.display_name || "Edumanege"}
          </h1>

          {currentUser ? (
            <div className="flex gap-3 items-center">
              <span className="text-sm">Hi, {currentUser.full_name}</span>
              <Button onClick={() => navigate("/AdminDashboard")}>
                Dashboard
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-1" /> Logout
              </Button>
            </div>
          ) : (
            <Button onClick={handleGoogleLogin} variant="outline">
              <LogIn className="w-4 h-4 mr-2" />
              Login with Google
            </Button>
          )}
        </div>
      </nav>

      {/* ---------- HERO ---------- */}
      <div className="text-center py-20">
        <h2 className="text-4xl font-extrabold mb-4">
          Smart School Management
        </h2>
        <p className="text-lg text-slate-600 mb-6">
          AI powered attendance, reports & parent communication
        </p>
        <Button
          size="lg"
          onClick={() =>
            currentUser
              ? navigate("/AdminDashboard")
              : navigate("/SchoolRegistration")
          }
        >
          <Zap className="w-5 h-5 mr-2" />
          Start Free Trial
        </Button>
      </div>

      {/* ---------- FEATURES ---------- */}
      <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-6 px-4 pb-20">
        {features.map((f, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <f.icon className="w-8 h-8 text-blue-600 mb-3" />
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-slate-600">{f.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ---------- FOOTER ---------- */}
      <footer className="bg-slate-900 text-white text-center py-6">
        <p className="text-sm">© 2024 Edumanege</p>
      </footer>
    </div>
  );
}
