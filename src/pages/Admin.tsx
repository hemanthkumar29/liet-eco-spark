import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const Admin = () => {
  const [passcode, setPasscode] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const alreadyAuthed = localStorage.getItem("liet-admin-authed");
    if (alreadyAuthed === "true") {
      navigate("/._admin_hidden_link_8462");
    }
  }, [navigate]);

  const adminPasscode = import.meta.env.VITE_ADMIN_PASSCODE ?? "liet-admin";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode.trim() === adminPasscode) {
      localStorage.setItem("liet-admin-authed", "true");
      toast.success("Welcome back, admin!");
      navigate("/._admin_hidden_link_8462");
    } else {
      toast.error("Incorrect passcode");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md p-6">
        <h1 className="text-2xl font-bold mb-6">Admin Access</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="passcode">Passcode</Label>
            <Input
              id="passcode"
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Enter admin passcode"
              required
            />
          </div>
          <Button type="submit" className="w-full">
            Continue
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default Admin;