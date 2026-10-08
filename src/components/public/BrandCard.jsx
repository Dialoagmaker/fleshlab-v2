import React from "react";
import { Link } from "react-router-dom";
import { Building2 } from "lucide-react";

export default function BrandCard({ brand }) {
  return (
    <Link to={`/brands/${brand.slug}`} className="group block">
      <div className="bg-card rounded-xl overflow-hidden border border-border hover:border-primary/50 transition-all duration-300">
        {/* Cover Image */}
        <div className="relative aspect-video bg-secondary overflow-hidden">
          {brand.cover_image_url ? (
            <img
              src={brand.cover_image_url}
              alt={brand.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <Building2 className="w-12 h-12" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Logo */}
          {brand.logo_url && (
            <div className="w-16 h-16 mx-auto bg-background rounded-full overflow-hidden border border-border">
              <img
                src={brand.logo_url}
                alt={brand.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Name */}
          <h3 className="font-semibold text-lg text-center group-hover:text-primary transition-colors">
            {brand.name}
          </h3>

          {/* Description */}
          {brand.description && (
            <p className="text-sm text-muted-foreground text-center line-clamp-2">
              {brand.description}
            </p>
          )}

          {/* Status */}
          <div className="text-center">
            <span className={`inline-block text-xs px-2 py-1 rounded-full ${
              brand.status === 'active' 
                ? 'bg-green-500/10 text-green-500' 
                : 'bg-muted text-muted-foreground'
            }`}>
              {brand.status === 'active' ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}