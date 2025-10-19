import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import confetti from "canvas-confetti";

const OrderConfirmation = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card p-8 rounded-lg shadow-card text-center space-y-6">
        <CheckCircle className="h-20 w-20 text-secondary mx-auto" />
        <h1 className="text-3xl font-bold">Order Confirmed!</h1>
        <div className="bg-muted p-4 rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">Your Order ID</p>
          <p className="text-xl font-mono font-bold">{orderId}</p>
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
