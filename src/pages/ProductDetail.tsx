import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, ArrowLeft, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/types/product";
import { useCartStore } from "@/lib/cartStore";
import { toast } from "sonner";
import bulb9w from "@/assets/bulb-9w.jpg";
import bulb15w from "@/assets/bulb-15w.jpg";
import tube18w from "@/assets/tube-18w.jpg";
import inverterBulb from "@/assets/inverter-bulb.jpg";

const productImages: Record<string, string> = {
  "Ceiling Light": bulb15w,
  "Tube Light": tube18w,
  "Inverter Bulb": inverterBulb,
  "Normal Bulb": bulb9w,
};

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();
    setProduct(data);
  };

  if (!product) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  const imageUrl = productImages[product.name] || bulb9w;
  const displayPrice = product.discount_price || product.price;
  const discountPercent = product.discount_price
    ? Math.round(((product.price - product.discount_price) / product.price) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Products
        </Button>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="relative aspect-square rounded-xl overflow-hidden bg-muted">
            <img src={imageUrl} alt={product.name} className="w-full h-full object-cover" />
            {product.stock > 0 && product.stock < 5 && (
              <Badge className="absolute top-4 left-4 bg-destructive">Only {product.stock} left!</Badge>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <Badge className="mb-2">{product.category}</Badge>
              <h1 className="text-4xl font-bold mb-2">{product.name}</h1>
              <p className="text-muted-foreground">{product.description}</p>
            </div>

            <div className="flex items-baseline gap-3">
              {product.discount_price ? (
                <>
                  <span className="text-4xl font-bold text-accent">₹{product.discount_price}</span>
                  {discountPercent > 0 && (
                    <>
                      <span className="text-xl text-muted-foreground line-through">₹{product.price}</span>
                      <Badge className="bg-accent text-accent-foreground">{discountPercent}% OFF</Badge>
                    </>
                  )}
                </>
              ) : product.price > 0 ? (
                <span className="text-4xl font-bold">₹{product.price}</span>
              ) : (
                <span className="text-2xl font-semibold text-muted-foreground">Price TBD - Contact for pricing</span>
              )}
            </div>

            {product.features && (
              <div className="space-y-2">
                <h3 className="font-semibold">Features:</h3>
                {product.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-secondary" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            )}

            <Button
              size="lg"
              className="w-full bg-gradient-cta"
              onClick={() => {
                addItem(product);
                toast.success("Added to cart!");
              }}
              disabled={product.stock === 0}
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
