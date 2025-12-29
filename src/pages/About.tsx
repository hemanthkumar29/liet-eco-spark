import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Leaf, Shield, Zap, Recycle, ClipboardCheck, ArrowLeft, ShoppingBag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import lietLogo from "@/assets/liet-logo.jpg";
const lendiLogoSrc = "/lendi-logo.png"; // expected in public/

const About = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white text-foreground">
      <header className="border-b bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img src={lietLogo} alt="LIET LED Manufacturing Logo" className="h-12 w-12 rounded-xl object-contain shadow-sm" />
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">About</p>
              <h1 className="text-xl font-bold">LIET - Lighting Innovations & Energy Technologies</h1>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="hidden sm:inline-flex">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
            <Button size="sm" className="bg-gradient-cta" onClick={() => navigate("/")}>Shop Products</Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 space-y-12">
        <section className="max-w-4xl mx-auto text-center space-y-4">
          <div className="flex justify-center">
            <img src={lendiLogoSrc} alt="Lendi logo" className="h-16 w-auto md:h-20 object-contain" />
          </div>
          <Badge className="bg-primary/10 text-primary border-primary/20">About the initiative</Badge>
          <h2 className="text-3xl md:text-4xl font-bold">Built by students, for a brighter campus</h2>
          <p className="text-lg text-muted-foreground">
            Our LED Bulb Manufacturing Unit at LIET is dedicated to developing energy-efficient lighting solutions while promoting sustainability and reducing electronic waste (e-waste). This initiative is powered by students of the Energy Conservation Club, EEE Department.
          </p>
          <p className="text-base text-muted-foreground">
            Every batch is prototyped, assembled, and tested on campus using industry-aligned practices. LEDs consume up to 80% less energy than incandescent bulbs, and responsible end-of-life collection keeps heavy metals out of landfills. We actively run awareness drives so the community understands the impact of mindful energy use and proper disposal.
          </p>
          <div className="flex flex-wrap justify-center gap-3 text-sm text-muted-foreground">
            {["Student-built in LIET labs", "80%+ energy savings vs. incandescent", "Certified recycling partners for e-waste", "Quality checks by the Energy Conservation Club"].map((item) => (
              <span key={item} className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white shadow-soft border border-border/60">
                <Shield className="h-4 w-4 text-primary" /> {item}
              </span>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[{
            icon: <Zap className="h-10 w-10 text-primary" />, title: "Energy-first design", desc: "High-lumen, low-watt drivers tuned for hostel, classroom, and lab conditions." },
          {
            icon: <Leaf className="h-10 w-10 text-secondary" />, title: "Sustainability in practice", desc: "E-waste collection bins on campus route spent bulbs to certified recyclers." },
          {
            icon: <Recycle className="h-10 w-10 text-accent" />, title: "Circular approach", desc: "Modular designs make maintenance easier and extend usable life." }
          ].map((item) => (
            <Card key={item.title} className="p-6 space-y-3">
              <div className="flex items-center gap-3">
                {item.icon}
                <h3 className="font-semibold text-lg">{item.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </Card>
          ))}
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <h3 className="text-2xl font-semibold">Quality, safety, and awareness</h3>
            <p className="text-base text-muted-foreground leading-relaxed">
              The Energy Conservation Club (EEE Department) oversees QA checklists, driver calibration, thermal testing, and end-of-line verification. We also host awareness sessions for students and staff on energy conservation and safe disposal practices.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[{
                icon: <ClipboardCheck className="h-6 w-6 text-primary" />, label: "QA at every batch" },
              {
                icon: <Shield className="h-6 w-6 text-primary" />, label: "Safety + compliance minded" }
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3 p-4 rounded-lg border border-border/60 bg-white shadow-soft">
                  {item.icon}
                  <span className="text-sm font-medium text-foreground">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
          <Card className="p-6 bg-gradient-hero text-primary-foreground shadow-2xl">
            <div className="space-y-3">
              <h4 className="text-xl font-semibold">How you can support</h4>
              <ul className="list-disc list-inside space-y-2 text-sm leading-relaxed">
                <li>Choose campus-made LEDs to cut power draw and support student innovation.</li>
                <li>Return spent bulbs to our e-waste bins instead of regular trash.</li>
                <li>Spread the word—energy awareness workshops run monthly at the EEE block.</li>
                <li>Share feedback on product performance so we can iterate faster.</li>
              </ul>
              <div className="flex flex-wrap gap-2 pt-2">
                <Button variant="secondary" size="sm" onClick={() => navigate("/")}>Back to Home</Button>
                <Button size="sm" className="bg-gradient-cta" onClick={() => navigate("/checkout")}>
                  <ShoppingBag className="h-4 w-4 mr-2" /> Order Now
                </Button>
              </div>
            </div>
          </Card>
        </section>
      </main>
    </div>
  );
};

export default About;
