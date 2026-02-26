import { Link, usePage, router } from "@inertiajs/react";
import { motion } from "framer-motion";
import { Heart, Menu, X, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button"; // Fixed path with capital C
import { useState } from "react";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/pets", label: "Adopt" },
  { href: "/quiz", label: "Find Your Match" },
  { href: "/about", label: "About" },
];

export function Navbar() {
  const { url, props } = usePage();
  
  // In Laravel, user data comes from props.auth.user
  const user = (props.auth as any)?.user; 

  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    // In Laravel, logout is a POST request
    router.post('/logout');
    setMobileOpen(false);
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border"
    >
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Changed 'to' to 'href' because Inertia Link uses href */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
            <Heart className="w-5 h-5 text-primary-foreground fill-current" />
          </div>
          <span className="font-display text-xl text-foreground">PawsConnect</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href} // Changed 'to' to 'href'
              className={`font-body text-sm transition-colors hover:text-primary ${
                url === link.href ? "text-primary font-medium" : "text-muted-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {user ? (
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => router.visit("/profile")}>
              <User className="w-4 h-4 mr-1" />
              {user.name.split(" ")[0]}
            </Button>
            <Button variant="soft" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-1" />
              Sign Out
            </Button>
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-3">
            <Button variant="soft" size="sm" onClick={() => router.visit("/login")}>
              Sign In
            </Button>
            <Button variant="hero" size="sm" onClick={() => router.visit("/register")}>
              Get Started
            </Button>
          </div>
        )}

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="md:hidden bg-background border-b border-border"
        >
          <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`font-body text-base transition-colors hover:text-primary ${
                  url === link.href ? "text-primary font-medium" : "text-muted-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
            {user ? (
              <div className="flex flex-col gap-2 pt-2">
                <Button variant="ghost" size="sm" className="justify-start" onClick={() => { router.visit("/profile"); setMobileOpen(false); }}>
                  <User className="w-4 h-4 mr-2" />
                  My Profile
                </Button>
                <Button variant="soft" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="flex gap-3 pt-2">
                <Button variant="soft" size="sm" className="flex-1" onClick={() => { router.visit("/login"); setMobileOpen(false); }}>
                  Sign In
                </Button>
                <Button variant="hero" size="sm" className="flex-1" onClick={() => { router.visit("/register"); setMobileOpen(false); }}>
                  Get Started
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </motion.header>
  );
}