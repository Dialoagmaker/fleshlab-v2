import { Link } from "react-router-dom";
import { Lock, Star, Film, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * JoinTheVault - Membership conversion module
 */
export default function JoinTheVault() {
  const benefits = [
    {
      icon: Film,
      text: "Unlock full scenes"
    },
    {
      icon: Star,
      text: "Exclusive drops"
    },
    {
      icon: Lock,
      text: "Behind-the-scenes access"
    },
    {
      icon: Heart,
      text: "Direct performer support"
    }
  ];

  return (
    <section className="py-20 px-4 bg-[#0A0A0A]">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">Join the Vault</h2>
          <p className="text-xl text-[#F5F5F5]/60">Full access to the archive</p>
        </div>

        <div className="bg-[#0F0F0F] rounded-2xl border border-white/[0.05] p-8 md:p-12">
          {/* Benefits */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
            {benefits.map((benefit, idx) => {
              const Icon = benefit.icon;
              return (
                <div
                  key={idx}
                  className="flex items-center gap-4 p-4 rounded-lg bg-[#0A0A0A]/50"
                >
                  <div className="w-12 h-12 rounded-full bg-rose-600/20 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-rose-500" />
                  </div>
                  <span className="text-[#F5F5F5]/80 font-medium">
                    {benefit.text}
                  </span>
                </div>
              );
            })}
          </div>

          {/* CTA */}
          <div className="text-center">
            <Link to="/fanclub">
              <Button
                className="bg-rose-600 hover:bg-rose-700 text-white px-10 py-6 text-lg font-medium rounded-lg transition-all hover:scale-105"
                size="lg"
              >
                BECOME A MEMBER
              </Button>
            </Link>

            <p className="text-sm text-[#F5F5F5]/40 mt-6">
              Already a member?{" "}
              <Link to="/login" className="text-rose-500 hover:text-rose-400 underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}