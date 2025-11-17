import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Zap } from "lucide-react";
import { Product } from "@/types/product";
import { useCartStore } from "@/lib/cartStore";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import bulb9w from "@/assets/bulb-9w.jpg";
import bulb12w from "@/assets/bulb-12w.jpg";
import bulb15w from "@/assets/bulb-15w.jpg";
import bulb7w from "@/assets/bulb-7w.jpg";
import tube18w from "@/assets/tube-18w.jpg";
import bulbSmart from "@/assets/bulb-smart.jpg";

const productImages: Record<string, string> = {
  "Ceiling Light": bulb15w,
  "Tube Light": tube18w,
  "Inverter Bulb": bulb12w,
  "Normal Bulb": bulb9w,
};

interface ProductCardProps {
  product: Product;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const addItem = useCartStore((state) => state.addItem);
  const navigate = useNavigate();
  const lietPrice = product.liet_price || product.discount_price;
  const discountPercent = lietPrice
    ? Math.round(((product.price - lietPrice) / product.price) * 100)
    : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.stock > 0) {
      addItem(product);
      toast.success(`${product.name} added to cart!`);
    } else {
      toast.error("Out of stock");
    }
  };

  const imageUrl = productImages[product.name] || bulb9w;

  return (
    <Card
      onClick={() => navigate(`/product/${product.id}`)}
      className="group overflow-hidden transition-all duration-300 hover:shadow-card cursor-pointer bg-card"
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={imageUrl}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
        {product.stock > 0 && product.stock < 5 && (
          <Badge className="absolute top-3 left-3 bg-destructive text-destructive-foreground">
            Only {product.stock} left!
          </Badge>
        )}
        {discountPercent > 0 && (
          <Badge className="absolute top-3 right-3 bg-accent text-accent-foreground shadow-glow">
            {discountPercent}% OFF
          </Badge>
        )}
      </div>
      
      <div className="p-5">
        <div className="mb-2">
          <Badge variant="outline" className="mb-2 border-primary/20 text-primary">
            <Zap className="mr-1 h-3 w-3" />
            {product.category}
          </Badge>
          <h3 className="font-semibold text-lg text-card-foreground line-clamp-1">
            {product.name}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
            {product.description}
          </p>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-baseline gap-2">
            {lietPrice ? (
              <>
                <span className="text-2xl font-bold text-accent">
                  ₹{lietPrice}
                </span>
                {discountPercent > 0 && (
                  <span className="text-sm text-muted-foreground line-through">
                    ₹{product.price}
                  </span>
                )}
              </>
            ) : product.price > 0 ? (
              <span className="text-2xl font-bold text-foreground">
                ₹{product.price}
              </span>
            ) : (
              <span className="text-lg font-semibold text-muted-foreground">
                Price TBD
              </span>
            )}
          </div>
          
          <Button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            size="sm"
            className="bg-gradient-cta hover:opacity-90 transition-opacity"
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            Add
          </Button>
        </div>
      </div>
    </Card>
  );
};
