import { Link } from "react-router-dom";
import { Video, Heart, Star } from "lucide-react";
import { isPublicImageUrl } from "@/lib/seoValidation";

/**
 * PerformerWorldCard - Premium performer card for studio portal design
 */
export default function PerformerWorldCard({ performer }) {
  // Validate image URL
  const hasValidImage = isPublicImageUrl(performer.profile_image_url);
  
  // Calculate age from date_of_birth if available
  const calculateAge = () => {
    if (!performer.date_of_birth) return null;
    const birthDate = new Date(performer.date_of_birth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };
  
  const age = calculateAge();
  
  return (
    <Link
      to={`/performers/${performer.slug}`}
      className="group block bg-[#0A0A0A] rounded-xl overflow-hidden border border-white/[0.05] hover:border-rose-600/30 transition-all duration-300"
    >
      {/* Portrait */}
      <div className="relative aspect-[3/4] overflow-hidden">
        {hasValidImage ? (
          <img
            src={performer.profile_image_url}
            alt={performer.display_name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] flex items-center justify-center">
            <span className="text-4xl text-[#F5F5F5]/20 font-serif">
              {performer.display_name.charAt(0)}
            </span>
          </div>
        )}
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
        
        {/* Status badges */}
        <div className="absolute top-3 right-3 flex flex-col gap-1">
          {performer.verified && (
            <span className="px-2 py-1 rounded text-xs font-medium text-white bg-blue-600/90 flex items-center gap-1">
              <Star className="w-3 h-3" />
              Verified
            </span>
          )}
          
          {performer.fanclub_enabled && (
            <span className="px-2 py-1 rounded text-xs font-medium text-white bg-rose-600/90 flex items-center gap-1">
              <Heart className="w-3 h-3" />
              Fanclub
            </span>
          )}
        </div>
        
        {/* Name overlay (bottom) */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-xl font-bold text-white mb-1 group-hover:text-rose-500 transition-colors">
            {performer.display_name}
          </h3>
          
          <div className="flex items-center gap-2 text-xs text-[#F5F5F5]/80">
            {performer.nationality && (
              <span>{performer.nationality}</span>
            )}
            {age && (
              <>
                <span>•</span>
                <span>{age}y</span>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Info */}
      <div className="p-4">
        {/* Stats */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-[#F5F5F5]/60">
            <Video className="w-4 h-4" />
            <span>{performer.video_count || 0} videos</span>
          </div>
          
          {performer.fanclub_enabled && (
            <span className="text-xs text-rose-500 font-medium">
              Join Fanclub
            </span>
          )}
        </div>
        
        {/* Bio preview */}
        {performer.bio && (
          <p className="text-sm text-[#F5F5F5]/60 mt-3 line-clamp-2">
            {performer.bio}
          </p>
        )}
        
        {/* CTA */}
        <div className="mt-4 pt-4 border-t border-white/[0.05]">
          <span className="text-sm text-rose-500 font-medium group-hover:text-rose-400 transition-colors flex items-center gap-1">
            Explore World
          </span>
        </div>
      </div>
    </Link>
  );
}