import { Heart } from "lucide-react";
import { Link } from "@inertiajs/react";

export function Footer() {
  return (
    <footer className="bg-card border-t border-border py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <Heart className="w-5 h-5 text-primary-foreground fill-current" />
              </div>
              <span className="font-display text-xl text-foreground">PawsConnect</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Connecting loving homes with pets in need through intelligent AI matchmaking.
            </p>
          </div>

          <div>
            <h4 className="font-display text-base text-foreground mb-4">Adopt</h4>
            <ul className="space-y-2">
              <li><Link href="/pets" className="text-sm text-muted-foreground hover:text-primary transition-colors">Browse Pets</Link></li>
              <li><Link href="/quiz" className="text-sm text-muted-foreground hover:text-primary transition-colors">Take the Quiz</Link></li>
              <li><Link href="/shelters" className="text-sm text-muted-foreground hover:text-primary transition-colors">Partner Shelters</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display text-base text-foreground mb-4">Resources</h4>
            <ul className="space-y-2">
              <li><Link href="/about" className="text-sm text-muted-foreground hover:text-primary transition-colors">About Us</Link></li>
              <li><Link href="/faq" className="text-sm text-muted-foreground hover:text-primary transition-colors">FAQ</Link></li>
              <li><Link href="/contact" className="text-sm text-muted-foreground hover:text-primary transition-colors">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display text-base text-foreground mb-4">Legal</h4>
            <ul className="space-y-2">
              <li><Link href="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} PawsConnect. Made with ❤️ for pets everywhere.
          </p>
        </div>
      </div>
    </footer>
  );
}