import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import confetti from "canvas-confetti";
import { supabase } from "@/integrations/supabase/client";
import type { Order } from "@/types/product";

const OrderConfirmation = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [orderDetails, setOrderDetails] = useState<Order | null>(location.state?.orderData || null);

  useEffect(() => {
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    
    // If order details weren't passed, fetch them
    if (!orderDetails && orderId) {
      supabase
        .from('orders')
        .select('*')
        .eq('order_id', orderId)
        .single()
        .then(({ data }) => {
          if (data) setOrderDetails(data as any);
        });
    }
  }, [orderId, orderDetails]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card p-8 rounded-lg shadow-card text-center space-y-6">
        <CheckCircle className="h-20 w-20 text-secondary mx-auto" />
        <h1 className="text-3xl font-bold">Order Confirmed!</h1>
        <div className="bg-muted p-4 rounded-lg space-y-3">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Your Order ID</p>
            <p className="text-xl font-mono font-bold">{orderId}</p>
          </div>
          {orderDetails && (
            <div className="text-left space-y-2 pt-3 border-t border-border">
              <div>
                <p className="text-xs text-muted-foreground">Roll Number</p>
                <p className="font-medium">{orderDetails.student_roll}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Department</p>
                <p className="font-medium">{orderDetails.department}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Year & Section</p>
                <p className="font-medium">{orderDetails.year} - {orderDetails.section}</p>
              </div>
            </div>
          )}
        </div>
        <p className="text-muted-foreground">
          Thank you for supporting LIET's energy conservation initiative! Your order has been placed successfully.
        </p>
        <div className="flex gap-3">
          <Button onClick={() => navigate("/")} className="flex-1">Continue Shopping</Button>
          <Button variant="outline" onClick={() => window.print()} className="flex-1">Print Receipt</Button>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
