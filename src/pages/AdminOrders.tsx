import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Order } from "@/types/product";
import { Leaf, LogOut, Download, Search, ChevronDown, ChevronUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, parseISO, startOfDay, isSameDay } from "date-fns";

interface GroupedOrders {
  [date: string]: Order[];
}

const AdminOrders = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [groupedOrders, setGroupedOrders] = useState<GroupedOrders>({});
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    checkAuth();
    setupRealtimeSubscription();
  }, []);

  useEffect(() => {
    if (orders.length > 0) {
      groupOrdersByDate();
    }
  }, [orders, searchTerm, statusFilter]);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        navigate("/");
        return;
      }

      setUser(session.user);

      // Check if user has admin role
      const { data: roleData } = await (supabase as any)
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .single();

      if (roleData?.role === "admin") {
        setIsAdmin(true);
        fetchOrders();
      } else {
        // Not an admin - show nothing (404-like behavior)
        navigate("/");
      }
    } catch (error) {
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel("orders-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          const newOrder = payload.new as Order;
          setOrders((prev) => [newOrder, ...prev]);
          toast.success(`New order from ${newOrder.customer_name}`);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          const updatedOrder = payload.new as Order;
          setOrders((prev) =>
            prev.map((order) => (order.id === updatedOrder.id ? updatedOrder : order))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchOrders = async () => {
    const { data } = await (supabase as any)
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (data) {
      setOrders(data as Order[]);
    }
  };

  const groupOrdersByDate = () => {
    let filtered = orders;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.mobile_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.student_roll.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.department.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status?.toLowerCase() === statusFilter);
    }

    const grouped: GroupedOrders = {};
    
    filtered.forEach((order) => {
      // Group by date using Asia/Kolkata timezone
      const utcDate = parseISO(order.created_at);
      const kolkataDateStr = utcDate.toLocaleDateString('en-IN', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      // Convert to yyyy-MM-dd format for consistency
      const [day, month, year] = kolkataDateStr.split('/');
      const dateKey = `${year}-${month}-${day}`;
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(order);
    });

    // Sort orders within each date by time (newest first)
    Object.keys(grouped).forEach((dateKey) => {
      grouped[dateKey].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });

    setGroupedOrders(grouped);

    // Auto-expand today's orders (Asia/Kolkata timezone)
    const now = new Date();
    const todayKolkataStr = now.toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const [day, month, year] = todayKolkataStr.split('/');
    const todayKey = `${year}-${month}-${day}`;
    
    if (grouped[todayKey]) {
      setExpandedDates(new Set([todayKey]));
    }
  };

  const toggleDateExpansion = (dateKey: string) => {
    setExpandedDates((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(dateKey)) {
        newSet.delete(dateKey);
      } else {
        newSet.add(dateKey);
      }
      return newSet;
    });
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const { error } = await (supabase as any)
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (error) {
      toast.error("Failed to update status");
    } else {
      toast.success("Status updated");
    }
  };

  const exportToCSV = () => {
    let dataToExport = orders;
    
    if (searchTerm || statusFilter !== "all") {
      dataToExport = Object.values(groupedOrders).flat();
    }

    const csv = [
      ["Order ID", "Date", "Time", "Customer Name", "Roll Number", "Department", "Year", "Section", "Address", "Mobile", "WhatsApp", "Total", "Status"],
      ...dataToExport.map((order) => [
        order.order_id,
        format(parseISO(order.created_at), "MMM dd, yyyy"),
        format(parseISO(order.created_at), "hh:mm a"),
        order.customer_name,
        order.student_roll,
        order.department,
        order.year,
        order.section,
        order.address,
        order.mobile_number,
        order.whatsapp_number,
        order.total_amount,
        order.status || "Pending",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `liet-orders-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const todayOrders = orders.filter((o) =>
    isSameDay(parseISO(o.created_at), new Date())
  );
  const todayRevenue = todayOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);

  return (
    <div className="min-h-screen bg-liet-bg">
      {/* Header */}
      <header className="bg-white border-b border-border sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Leaf className="h-8 w-8 text-liet-primary" />
              <div>
                <h1 className="text-2xl font-bold text-liet-primary">LIET Admin Dashboard</h1>
                <p className="text-sm text-muted-foreground">
                  Welcome, {user?.email}
                </p>
              </div>
            </div>
            <Button onClick={() => supabase.auth.signOut()} variant="outline">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="bg-white border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4 bg-gradient-to-br from-liet-primary to-liet-primary/80 text-white">
              <p className="text-sm opacity-90">Today's Orders</p>
              <p className="text-3xl font-bold">{todayOrders.length}</p>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-liet-accent to-liet-accent/80 text-foreground">
              <p className="text-sm opacity-90">Today's Revenue</p>
              <p className="text-3xl font-bold">₹{todayRevenue}</p>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-liet-highlight to-liet-highlight/80 text-foreground">
              <p className="text-sm opacity-90">Total Orders</p>
              <p className="text-3xl font-bold">{orders.length}</p>
            </Card>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="container mx-auto px-4 py-6">
        <Card className="p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by Roll No, Name, or Order ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={exportToCSV} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </Card>

        {/* Orders List Grouped by Date */}
        <div className="space-y-4">
          {Object.entries(groupedOrders)
            .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
            .map(([dateKey, dateOrders]) => {
              const isExpanded = expandedDates.has(dateKey);
              const isToday = isSameDay(parseISO(dateKey), new Date());

              return (
                <Card key={dateKey} className={isToday ? "ring-2 ring-liet-accent" : ""}>
                  <button
                    onClick={() => toggleDateExpansion(dateKey)}
                    className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${isToday ? "bg-liet-accent" : "bg-liet-primary"}`} />
                      <div className="text-left">
                        <h3 className="font-semibold text-lg">
                          {format(parseISO(dateKey), "EEEE, MMM dd, yyyy")}
                          {isToday && (
                            <span className="ml-2 text-sm bg-liet-accent text-foreground px-2 py-1 rounded">
                              Today
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {dateOrders.length} order{dateOrders.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="border-t border-border p-4 space-y-3">
                      {dateOrders.map((order) => (
                        <Card key={order.id} className="p-4 hover:shadow-md transition-shadow">
                          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            <div>
                              <p className="text-xs text-muted-foreground">Time</p>
                              <p className="font-semibold">
                                {new Date(order.created_at).toLocaleTimeString('en-IN', {
                                  timeZone: 'Asia/Kolkata',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: true,
                                })} IST
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Order ID</p>
                              <p className="font-mono text-sm font-bold">{order.order_id}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Customer</p>
                              <p className="font-semibold">{order.customer_name}</p>
                              <p className="text-xs text-muted-foreground">{order.mobile_number}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Roll / Dept</p>
                              <p className="font-medium text-sm">{order.student_roll}</p>
                              <p className="text-xs text-muted-foreground">{order.department} - {order.year} {order.section}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Address</p>
                              <p>{order.address}</p>
                              <p className="text-xs text-muted-foreground">
                                WhatsApp: {order.whatsapp_number}
                              </p>
                            </div>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs text-muted-foreground">Total</p>
                                <p className="font-bold text-lg text-liet-primary">
                                  ₹{order.total_amount}
                                </p>
                              </div>
                              <Select
                                value={order.status || "Pending"}
                                onValueChange={(value) => updateOrderStatus(order.id, value)}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Pending">Pending</SelectItem>
                                  <SelectItem value="Confirmed">Confirmed</SelectItem>
                                  <SelectItem value="Delivered">Delivered</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </Card>
              );
            })}
        </div>
      </div>
    </div>
  );
};

export default AdminOrders;
