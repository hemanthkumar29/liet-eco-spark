import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCartStore } from "@/lib/cartStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

const checkoutSchema = z.object({
  customer_name: z.string().min(1, "Name is required").max(100),
  address: z.string().min(1, "Address is required").max(500),
  mobile_number: z.string().min(10, "Valid mobile number is required").max(15),
  whatsapp_number: z.string().min(10, "Valid WhatsApp number is required").max(15),
});

const Checkout = () => {
  const navigate = useNavigate();
  const { items, getTotalAmount, clearCart } = useCartStore();
  const [formData, setFormData] = useState({
    customer_name: "",
    address: "",
    mobile_number: "",
    whatsapp_number: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      checkoutSchema.parse(formData);
      setIsSubmitting(true);

      // Generate idempotency key for retry safety
      const idempotencyKey = `${formData.mobile_number}-${Date.now()}-${crypto.randomUUID()}`;

      const { data, error } = await supabase.functions.invoke('create-order', {
        body: {
          customer_name: formData.customer_name,
          address: formData.address,
          mobile_number: formData.mobile_number,
          whatsapp_number: formData.whatsapp_number,
          items: items.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            discount_price: item.discount_price,
            quantity: item.quantity,
          })),
        },
        headers: {
          'x-idempotency-key': idempotencyKey,
        },
      });

      if (error) {
        console.error('Order error:', error);
        
        // Handle specific error codes
        if (error.context?.code === 'OUT_OF_STOCK') {
          toast.error(`Some items are no longer available. ${error.context.error}`, {
            duration: 5000,
          });
          // Optionally update cart to reflect available stock
          return;
        }
        
        throw error;
      }

      if (!data?.order) {
        throw new Error('No order data returned');
      }

      const orderId = data.order.order_id;
      
      // Show appropriate message based on price_pending
      if (data.price_pending) {
        toast.success('Order confirmed! Some prices are pending - admin will update you.', {
          duration: 6000,
        });
      } else {
        toast.success('Order placed successfully!');
      }

      clearCart();
      navigate(`/order-confirmation/${orderId}`);
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        console.error('Order submission error:', error);
        toast.error("Failed to place order. Please try again.", {
          action: {
            label: 'Retry',
            onClick: () => handleSubmit(e as any),
          },
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
          <Button onClick={() => navigate("/")}>Continue Shopping</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>
        <form onSubmit={handleSubmit} className="space-y-6 bg-card p-6 rounded-lg shadow-card">
          <div>
            <Label htmlFor="customer_name">Full Name *</Label>
            <Input
              id="customer_name"
              value={formData.customer_name}
              onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
              required
              placeholder="Enter your full name"
            />
          </div>
          <div>
            <Label htmlFor="address">Address *</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              required
              placeholder="Enter your complete address"
            />
          </div>
          <div>
            <Label htmlFor="mobile_number">Mobile Number *</Label>
            <Input
              id="mobile_number"
              type="tel"
              value={formData.mobile_number}
              onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
              required
              placeholder="Enter 10-digit mobile number"
              pattern="[0-9]{10,15}"
            />
          </div>
          <div>
            <Label htmlFor="whatsapp_number">WhatsApp Number *</Label>
            <Input
              id="whatsapp_number"
              type="tel"
              value={formData.whatsapp_number}
              onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
              required
              placeholder="Enter WhatsApp Number"
              pattern="[0-9]{10,15}"
            />
          </div>
          <div className="pt-4 border-t">
            <div className="flex justify-between text-xl font-bold mb-4">
              <span>Total:</span>
              <span className="text-accent">₹{getTotalAmount().toFixed(2)}</span>
            </div>
            <Button type="submit" className="w-full bg-gradient-cta" size="lg" disabled={isSubmitting}>
              {isSubmitting ? "Placing Order..." : "Place Order"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Checkout;
