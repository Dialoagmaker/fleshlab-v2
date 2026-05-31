import { Link } from "react-router-dom";
import { Zap, ArrowRight } from "lucide-react";

export default function ComingSoon({ title = "Page" }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-16">
      <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5">
        <Zap className="w-6 h-6 text-primary" />
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-2">{title}</h1>
      <p className="text-muted-foreground mb-6 max-w-sm text-sm">
        This section is in active development. Check back soon.
      </p>
      <Link
        to="/"
        className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
      >
        Back to home <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}