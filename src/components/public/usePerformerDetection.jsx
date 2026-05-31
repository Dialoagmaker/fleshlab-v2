import React, { useMemo } from "react";
import { base44 } from "@/api/base44Client";

/**
 * Performer Detection Adapter
 * Detects performers for a video using multiple fallback strategies
 */
export function usePerformerDetection(video, performers, videos) {
  return useMemo(() => {
    if (!video || !performers || !videos) {
      return {
        detectedPerformer: null,
        detectionMethod: null,
        performerVideos: [],
        hasFallback: false,
        fallbackPerformer: null,
      };
    }

    // Strategy 1: Direct performer_id on video
    if (video.performer_id) {
      const performer = performers.find(p => p.id === video.performer_id);
      if (performer) {
        const performerVideos = videos.filter(
          v => v.performer_id === video.performer_id && v.id !== video.id
        ).slice(0, 4);
        
        return {
          detectedPerformer: performer,
          detectionMethod: 'direct_performer_id',
          performerVideos,
          hasFallback: false,
        };
      }
    }

    // Strategy 2: performer_ids array (if present)
    if (video.performer_ids && Array.isArray(video.performer_ids)) {
      for (const performerId of video.performer_ids) {
        const performer = performers.find(p => p.id === performerId);
        if (performer) {
          const performerVideos = videos.filter(
            v => v.performer_ids?.includes(performer.id) && v.id !== video.id
          ).slice(0, 4);
          
          return {
            detectedPerformer: performer,
            detectionMethod: 'performer_ids_array',
            performerVideos,
            hasFallback: false,
          };
        }
      }
    }

    // Strategy 3: performers array (if present)
    if (video.performers && Array.isArray(video.performers)) {
      for (const performerRef of video.performers) {
        const performerId = performerRef.performer_id || performerRef.id;
        const performer = performers.find(p => p.id === performerId);
        if (performer) {
          const performerVideos = videos.filter(
            v => v.performers?.some(p => p.performer_id === performer.id) && v.id !== video.id
          ).slice(0, 4);
          
          return {
            detectedPerformer: performer,
            detectionMethod: 'performers_array',
            performerVideos,
            hasFallback: false,
          };
        }
      }
    }

    // Strategy 4: Fuzzy match on title/tags
    const videoText = `${video.title} ${video.tags?.join(' ')}`.toLowerCase();
    for (const performer of performers) {
      const performerNames = [
        performer.display_name?.toLowerCase(),
        performer.stage_name?.toLowerCase(),
        performer.bio?.toLowerCase(),
      ].filter(Boolean);
      
      for (const name of performerNames) {
        if (videoText.includes(name)) {
          const performerVideos = videos.filter(v => {
            const otherText = `${v.title} ${v.tags?.join(' ')}`.toLowerCase();
            return otherText.includes(name) && v.id !== video.id;
          }).slice(0, 4);
          
          return {
            detectedPerformer: performer,
            detectionMethod: 'fuzzy_match_title_tags',
            performerVideos,
            hasFallback: false,
          };
        }
      }
    }

    // Strategy 5: Fallback - featured performer from same brand
    if (video.brand_id) {
      const featuredPerformers = performers.filter(
        p => p.featured === true && p.status === 'active'
      );
      
      // Try to find a performer from the same brand
      const brandPerformer = featuredPerformers.find(p => p.brand_id === video.brand_id);
      
      if (brandPerformer) {
        const brandVideos = videos.filter(
          v => v.brand_id === video.brand_id && v.id !== video.id
        ).slice(0, 4);
        
        return {
          detectedPerformer: brandPerformer,
          detectionMethod: 'fallback_featured_from_brand',
          performerVideos: brandVideos,
          hasFallback: true,
          fallbackPerformer: brandPerformer,
        };
      }
    }

    // Strategy 6: Any active featured performer
    const featuredPerformer = performers.find(
      p => p.featured === true && p.status === 'active'
    );
    
    if (featuredPerformer) {
      const anyVideos = videos.filter(v => v.id !== video.id).slice(0, 4);
      
      return {
        detectedPerformer: featuredPerformer,
        detectionMethod: 'fallback_any_featured_performer',
        performerVideos: anyVideos,
        hasFallback: true,
        fallbackPerformer: featuredPerformer,
      };
    }

    // No performer detected
    return {
      detectedPerformer: null,
      detectionMethod: null,
      performerVideos: [],
      hasFallback: false,
    };
  }, [video, performers, videos]);
}

export default usePerformerDetection;