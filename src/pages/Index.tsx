import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ProductCard } from "@/components/ProductCard";
import { CartDrawer } from "@/components/CartDrawer";
import { Product } from "@/types/product";
import { Leaf, Zap, Shield, Search, User, Menu, X, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroBanner from "@/assets/hero-banner.jpg";
import lietLogo from "@/assets/liet-logo.jpg";
import { fetchProducts as fetchProductsApi } from "@/lib/api";

const Index = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const navLinks = [
    { label: "Products", target: "products" },
    { label: "Why LIET", target: "impact" },
    { label: "Contact", target: "footer" },
  ];

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [selectedCategory, searchQuery, products]);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const data = await fetchProductsApi();
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = products;

    if (selectedCategory !== "All") {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }

    if (searchQuery) {
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
  };

  const categories = ["All", ...Array.from(new Set(products.map((p) => p.category)))];

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setIsMenuOpen(false);
    }
  };

  return (
    <div className="app-shell">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={lietLogo}
              alt="LIET LED Manufacturing Logo"
              className="h-12 w-12 rounded-xl object-contain shadow-sm"
            />
            <div>
              <h1 className="text-2xl font-bold text-primary">LIET - Lighting Innovations & Energy Technologies</h1>
              <p className="text-xs text-muted-foreground">Energy Conservation Initiative</p>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Button
                key={link.label}
                variant="ghost"
                size="sm"
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
                onClick={() => scrollTo(link.target)}
              >
                {link.label}
              </Button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="hidden md:inline-flex bg-gradient-eco hover:opacity-90 text-foreground"
              onClick={() => scrollTo("products")}
            >
              Shop Products
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin")}>
              <User className="h-4 w-4" />
            </Button>
            <CartDrawer />
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsMenuOpen((prev) => !prev)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="lg:hidden border-t bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/80">
            <div className="container mx-auto px-4 py-3 flex flex-col gap-2">
              {navLinks.map((link) => (
                <Button
                  key={link.label}
                  variant="ghost"
                  className="justify-start text-base"
                  onClick={() => scrollTo(link.target)}
                >
                  {link.label}
                </Button>
              ))}
              <div className="flex gap-2 pt-2">
                <Button className="flex-1 bg-gradient-cta hover:opacity-90" onClick={() => scrollTo("products")}>
                  Shop Now
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => navigate("/checkout")}>
                  Checkout
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section id="home" className="relative overflow-hidden py-20">
        <div className="hero-glow" aria-hidden />
        <div className="absolute inset-0 opacity-15">
          <img src={heroBanner} alt="Hero" className="w-full h-full object-cover" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-6 fade-up">
              <Badge className="bg-white text-primary shadow-card w-fit">
                <Shield className="mr-2 h-3 w-3 text-primary" /> Official LIET Energy-Conservation Product
              </Badge>
              <h2 className="text-4xl md:text-6xl font-bold leading-tight text-foreground">
                Light Up Smarter,
                <span className="text-primary"> Save Brighter.</span>
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground">
                Premium LED solutions engineered by LIET students for a sustainable campus. High efficiency, long life, and exclusive pricing.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="bg-gradient-cta hover:scale-[1.01] transition" onClick={() => scrollTo("products")}>
                  Shop the Catalog
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-primary/30 text-primary hover:bg-primary/10"
                  onClick={() => navigate("/checkout")}
                >
                  Go to Checkout
                </Button>
              </div>
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                {["80% energy savings", "2x lifespan vs. standard bulbs", "Campus-certified quality"].map((item) => (
                  <span key={item} className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white/80 shadow-soft">
                    <CheckCircle2 className="h-4 w-4 text-primary" /> {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="relative lg:pl-8 fade-up">
              <div className="absolute -inset-6 rounded-3xl bg-gradient-hero opacity-20 blur-3xl" aria-hidden />
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/60 bg-white/90 backdrop-blur">
                <img src={heroBanner} alt="LIET LED Products" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Banners */}
      <section id="impact" className="py-10 bg-white/70 backdrop-blur">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[{
              icon: <Leaf className="h-10 w-10 text-secondary" />, title: "Eco-Friendly", desc: "Up to 80% energy savings"
            }, {
              icon: <Shield className="h-10 w-10 text-primary" />, title: "LIET Certified", desc: "Designed and made by students"
            }, {
              icon: <Zap className="h-10 w-10 text-accent" />, title: "Exclusive Deals", desc: "Campus-only pricing and support"
            }].map((item) => (
              <div key={item.title} className="flex items-center gap-3 p-5 bg-card rounded-xl shadow-soft border border-border/60">
                {item.icon}
                <div>
                  <h3 className="font-semibold text-lg">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="py-14">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <div className="text-center space-y-2 mb-6">
              <h2 className="text-3xl md:text-4xl font-bold">Our Products</h2>
              <p className="text-muted-foreground">Curated, efficient lighting built for LIET.</p>
            </div>
            
            {/* Search Bar */}
            <div className="max-w-md mx-auto mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2 justify-center">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category)}
                  className={selectedCategory === category ? "bg-primary" : ""}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          {isLoading ? (
            <div className="text-center py-12">Loading products...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No products found matching your criteria.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer id="footer" className="bg-gradient-hero text-primary-foreground py-10 mt-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img
                src={lietLogo}
                alt="LIET LED Manufacturing Logo"
                className="h-14 w-14 object-contain bg-white/10 rounded-lg p-3"
              />
              <div>
                <h3 className="text-xl font-semibold">LIET - Lighting Innovations & Energy Technologies</h3>
                <p className="text-sm opacity-90">Lighting the campus sustainably.</p>
              </div>
            </div>
            <div className="text-sm opacity-90 text-center lg:text-right">
              © 2025 LIET - Lighting Innovations & Energy Technologies Initiative. Made with 💚 by LIET students for a sustainable future.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
