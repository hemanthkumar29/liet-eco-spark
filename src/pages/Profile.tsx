import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Order } from "@/types/product";
import { User, Session } from "@supabase/supabase-js";
import { Loader2, LogOut, ShoppingBag, Package } from "lucide-react";

const STATUS_COLORS = {
  Pending: "bg-amber-500",
  Processing: "bg-sky-500",
  Completed: "bg-emerald-500",
  Cancelled: "bg-destructive",
};

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/auth");
      } else {
        setTimeout(() => {
          fetchUserData(session.user.id);
        }, 0);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/auth");
      } else {
        fetchUserData(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchUserData = async (userId: string) => {
    try {
      setIsLoading(true);
      
      const [profileRes, ordersRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
        supabase.from("orders").select("*").eq("user_id", userId).order("created_at", { ascending: false })
      ]);

      if (profileRes.data) {
        setProfile(profileRes.data);
      }

      if (ordersRes.data) {
        setOrders(ordersRes.data.map(order => ({
          ...order,
          created_at: order.created_at || '',
          products: order.products as any,
          status: order.status || 'Pending'
        })));
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast.error("Failed to load profile data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">My Profile</h1>
          <Button onClick={handleLogout} variant="outline">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>

        <Card className="p-6 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-2xl font-bold text-primary">
                {profile?.full_name?.[0]?.toUpperCase() || "U"}
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-bold">{profile?.full_name || "User"}</h2>
              <p className="text-muted-foreground">{profile?.phone_number || user?.phone}</p>
            </div>
          </div>
        </Card>

        <div className="mb-6 flex items-center gap-2">
          <Package className="h-5 w-5" />
          <h2 className="text-2xl font-bold">Order History</h2>
          <Badge variant="secondary">{orders.length}</Badge>
        </div>

        {orders.length === 0 ? (
          <Card className="p-12 text-center">
            <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">No orders yet</p>
            <Button onClick={() => navigate("/")}>Start Shopping</Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Order ID</p>
                    <p className="font-mono font-bold">{order.order_id}</p>
                  </div>
                  <Badge className={STATUS_COLORS[order.status as keyof typeof STATUS_COLORS]}>
                    {order.status}
                  </Badge>
                </div>
                
                <div className="space-y-2 mb-4">
                  {order.products.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>{item.name} x {item.quantity}</span>
                      <span className="font-semibold">₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {new Date(order.created_at).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                  <span className="font-bold text-lg text-accent">
                    Total: ₹{order.total_amount}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
