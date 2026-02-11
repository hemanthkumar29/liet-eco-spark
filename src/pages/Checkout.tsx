import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCartStore } from "@/lib/cartStore";
import { toast } from "sonner";
import { z } from "zod";
import { buildOrderItemsFromCart, createOrder } from "@/lib/api";
import { Tag, X, CheckCircle } from "lucide-react";

// Coupon codes with their discount percentages (hidden from UI)
const COUPON_CODES: Record<string, number> = {
  "LIET100": 100,    // 100% discount (free)
  "LIET5OFF": 5,     // 5% discount
  "LIET75OFF": 75,   // 75% discount
};

const checkoutSchema = z.object({
  customer_name: z.string().min(1, "Name is required").max(100),
  address: z.string().min(1, "Address is required").max(500),
  mobile_number: z.string().min(10, "Valid mobile number is required").max(15),
  whatsapp_number: z.string().min(10, "Valid WhatsApp number is required").max(15),
  student_roll: z.string().min(1, "Roll number is required").max(50),
  department: z.string().min(1, "Department is required").max(100),
  year: z.string().min(1, "Year of study is required").max(20),
  section: z.string().min(1, "Section is required").max(10),
});

const Checkout = () => {
  const navigate = useNavigate();
  const { items, getTotalAmount, clearCart } = useCartStore();
  const [formData, setFormData] = useState({
    customer_name: "",
    address: "",
    mobile_number: "",
    whatsapp_number: "",
    student_roll: "",
    department: "",
    year: "",
    section: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponError, setCouponError] = useState("");

  const subtotal = getTotalAmount();
  const discountAmount = appliedCoupon ? (subtotal * appliedCoupon.discount) / 100 : 0;
  const finalTotal = subtotal - discountAmount;

  const handleApplyCoupon = () => {
    setCouponError("");
    const trimmedCode = couponCode.trim().toUpperCase();
    
    if (!trimmedCode) {
      setCouponError("Please enter a coupon code");
      return;
    }

    if (appliedCoupon) {
      setCouponError("A coupon is already applied. Remove it first.");
      return;
    }

    const discount = COUPON_CODES[trimmedCode];
    if (discount !== undefined) {
      setAppliedCoupon({ code: trimmedCode, discount });
      setCouponCode("");
      toast.success(`Coupon applied! You get ${discount}% off`);
    } else {
      setCouponError("Invalid coupon code");
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError("");
    toast.info("Coupon removed");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      checkoutSchema.parse(formData);
      setIsSubmitting(true);

      const order = await createOrder({
        customer_name: formData.customer_name,
        address: formData.address,
        mobile_number: formData.mobile_number,
        whatsapp_number: formData.whatsapp_number,
        student_roll: formData.student_roll,
        department: formData.department,
        year: formData.year,
        section: formData.section,
        items: buildOrderItemsFromCart(items),
      });

      toast.success("Order placed successfully!");

      const orderId = order.order_id;

      clearCart();
      navigate(`/order-confirmation/${orderId}`, { 
        state: { orderData: order }
      });
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        console.error('Order submission error:', error);
        const errorMessage = error instanceof Error ? error.message : "Failed to place order. Please try again.";
        toast.error(errorMessage, {
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
          <div>
            <Label htmlFor="student_roll">Roll Number *</Label>
            <Input
              id="student_roll"
              value={formData.student_roll}
              onChange={(e) => setFormData({ ...formData, student_roll: e.target.value })}
              required
              placeholder="Enter Roll Number"
            />
          </div>
          <div>
            <Label htmlFor="department">Department *</Label>
            <Input
              id="department"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              required
              placeholder="Enter Department (e.g., CSE, ECE, ME)"
            />
          </div>
          <div>
            <Label htmlFor="year">Year of Study *</Label>
            <Input
              id="year"
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: e.target.value })}
              required
              placeholder="Enter Year (e.g., 1st, 2nd, 3rd, 4th)"
            />
          </div>
          <div>
            <Label htmlFor="section">Section *</Label>
            <Input
              id="section"
              value={formData.section}
              onChange={(e) => setFormData({ ...formData, section: e.target.value })}
              required
              placeholder="Enter Section (e.g., A, B, C)"
            />
          </div>

          {/* Coupon Code Section */}
          <div className="pt-4 border-t">
            <Label htmlFor="coupon" className="flex items-center gap-2 mb-2">
              <Tag className="h-4 w-4" />
              Have a Coupon Code?
            </Label>
            {appliedCoupon ? (
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-700 dark:text-green-400">
                    {appliedCoupon.code} - {appliedCoupon.discount}% OFF
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveCoupon}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  id="coupon"
                  value={couponCode}
                  onChange={(e) => {
                    setCouponCode(e.target.value);
                    setCouponError("");
                  }}
                  placeholder="Enter coupon code"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleApplyCoupon}
                >
                  Apply
                </Button>
              </div>
            )}
            {couponError && (
              <p className="text-sm text-red-500 mt-1">{couponError}</p>
            )}
          </div>

          <div className="pt-4 border-t">
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal:</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-green-600">
                  <span>Discount ({appliedCoupon.discount}%):</span>
                  <span>-₹{discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-xl font-bold">
                <span>Total:</span>
                <span className="text-accent">₹{finalTotal.toFixed(2)}</span>
              </div>
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
