import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Order } from "@/types/product";

const STATUS_COLORS = {
  Pending: "bg-amber-500",
  Processing: "bg-sky-500",
  Completed: "bg-emerald-500",
  Cancelled: "bg-destructive",
};

const Admin = () => {
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchOrders();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchOrders();
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchOrders = async () => {
    const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    if (data) {
      setOrders(data.map(order => ({
        ...order,
        created_at: order.created_at || '',
        products: order.products as any,
        status: order.status || 'Pending'
      })));
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (error) {
      toast.error("Failed to update status");
    } else {
      toast.success("Status updated successfully");
      fetchOrders();
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) toast.error(error.message);
    else toast.success("Logged in successfully");
  };

  const handleSignUp = async () => {
    const { error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: { emailRedirectTo: `${window.location.origin}/admin` }
    });
    if (error) toast.error(error.message);
    else toast.success("Check your email for confirmation");
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md p-6">
          <h1 className="text-2xl font-bold mb-6">Admin Login</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1">Login</Button>
              <Button type="button" variant="outline" onClick={handleSignUp} className="flex-1">Sign Up</Button>
            </div>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <Button onClick={() => supabase.auth.signOut()}>Logout</Button>
        </div>
        
        {orders.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            No orders yet
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Order ID</p>
                    <p className="font-mono font-bold text-sm">{order.order_id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Student</p>
                    <p className="font-semibold">{order.student_name}</p>
                    <p className="text-xs text-muted-foreground">{order.student_roll}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Department</p>
                    <p>{order.department}</p>
                    <p className="text-xs text-muted-foreground">{order.year} - {order.section}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="font-bold text-accent">₹{order.total_amount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Status</p>
                    <Select 
                      value={order.status} 
                      onValueChange={(value) => updateOrderStatus(order.id, value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue>
                          <Badge className={STATUS_COLORS[order.status as keyof typeof STATUS_COLORS]}>
                            {order.status}
                          </Badge>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="bg-background">
                        <SelectItem value="Pending">
                          <Badge className={STATUS_COLORS.Pending}>Pending</Badge>
                        </SelectItem>
                        <SelectItem value="Processing">
                          <Badge className={STATUS_COLORS.Processing}>Processing</Badge>
                        </SelectItem>
                        <SelectItem value="Completed">
                          <Badge className={STATUS_COLORS.Completed}>Completed</Badge>
                        </SelectItem>
                        <SelectItem value="Cancelled">
                          <Badge className={STATUS_COLORS.Cancelled}>Cancelled</Badge>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;