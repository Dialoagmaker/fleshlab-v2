/**
 * applyP1MetadataCleanup - P1 SEO Metadata + Slug Cleanup
 * 
 * Applies approved P1 metadata and slug cleanup to exactly 4 videos.
 * Does NOT touch P0 videos or any other published videos.
 * 
 * Updates:
 * - slug (with legacy_slugs preservation)
 * - title (remove risky terms)
 * - meta_title
 * - meta_description
 * - short_summary
 * - description (remove risky framing)
 * - tags (remove misleading tags)
 * - categories (remove teen_18)
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { apply = false } = await req.json();
    
    // P1 VIDEO CONFIGURATIONS - EXACTLY 4 VIDEOS
    const p1Config = [
      {
        id: '6a231adb60c0314bd765b684',
        old_slug: 'the-fitmaster-asian-twink-bedroom-oral',
        new_slug: 'the-fitmaster-filipino-twink-bedroom-deepthroat',
        title: 'Slim Asian Twink Deepthroats Filipino Twink in Bedroom',
        meta_title: 'Slim Asian Twink Deepthroats Filipino Twink - FLESHLAB',
        meta_description: 'Experience a raw bedroom deepthroat as a slim Asian twink takes a thick Filipino cock. Watch this exclusive FLESHLAB amateur scene now.',
        short_summary: 'A Filipino twink and slim Asian twink\'s passionate bedroom encounter!',
        description: "In the privacy of a bedroom lit by red LED lights, this slim Asian twink gets down to business on a massive Filipino rod. Watch as he takes the entire Filipino twink's hard cock into his mouth, his throat swallowing every inch with wet, sloppy noises. The muscular performer lies back and groans while his thick shaft is engulfed by the hungry lips of his slim partner. You can see the veins on his dick as he gets sucked to the brink of a messy explosion right there on the bed. This raw encounter is a FLESHLAB exclusive featuring the hottest slim Asian twink talent.",
        tags_remove: ['slim asian boy'],
        tags_keep: ['filipino twink', 'asian blowjob', 'bedroom blowjob', 'fleshlab', 'filipino male', 'deepthroat', 'gay amateur', 'pinoy gay'],
        categories_remove: ['teen_18'],
        categories_keep: ['asian', 'amateur', 'blowjob', 'gay', 'twink', 'muscular_body', 'couple']
      },
      {
        id: '6a22c065f551f26a8ec7567c',
        old_slug: 'fleshlab-exclusive-asian-twink-nipple-torture-cumshot-in-live-cam',
        new_slug: 'the-fitmaster-filipino-nipple-torture-glasses-cumshot',
        title: 'Muscular Filipino Twink with Glasses Nipple Torture and Messy Cumshot',
        meta_title: 'Muscular Filipino Twink Glasses Nipple Torture Cumshot',
        meta_description: 'Watch muscular Filipino twink The_Fitmaster engage in intense nipple torture and solo jerking. A messy amateur cumshot finale from FLESHLAB Studios.',
        short_summary: 'Watch an Asian twink surrender to nipple torture and explosive pleasure!',
        description: 'This muscular Filipino twink with glasses gets off in his bedroom while pushing his limits with intense nipple torture. Watch him pinch and pull at his pierced nips as his thick, vascular cock stays rock hard in his camo underwear. The amateur intensity builds as he moans through the pain, eventually stroking his meat until he explodes in a messy, thick cumshot. His sweaty, toned body and focus on his sensitive chest make this FLESHLAB exclusive a raw display of solo Asian fetish. This slim Asian boy delivers a real, unscripted finish that leaves him covered in his own nut.',
        tags_remove: [],
        tags_keep: ['asian', 'filipino', 'nipple torture', 'solo', 'cumshot', 'muscular twink', 'amateur', 'fetish', 'glasses', 'gay'],
        categories_remove: [],
        categories_keep: ['solo', 'asian', 'amateur', 'muscular_body', 'piercing', 'solo_masturbation', 'shower']
      },
      {
        id: '6a22ae6fc793e2843243f212',
        old_slug: 'filipino-twink-fucks-his-younger-cousin-bareback-with-parents-nearby',
        new_slug: 'filipino-twink-bareback-shower-creampie',
        title: 'Filipino Twink Bareback Shower Hookup with Creampie',
        meta_title: 'Filipino Twink Bareback Shower Creampie - FLESHLAB',
        meta_description: 'Watch a Filipino twink in a raw bareback shower session ending with a hot creampie. Exclusive amateur hookup from FLESHLAB Studios.',
        short_summary: 'Raw bareback shower hookup between Filipino twinks ending in a hot creampie.',
        description: 'This intense amateur hookup features a horny Filipino twink taking his partner for a raw bareback session in the shower. Experience the authentic passion as they trade positions and push boundaries in this homemade Filipino encounter. The tension fuels every thrust before a massive internal cumshot finish.',
        tags_remove: [],
        tags_keep: ['filipino', 'twink', 'bareback', 'shower', 'creampie', 'homemade', 'asian', 'hookup', 'breeding', 'internal cumshot'],
        categories_remove: [],
        categories_keep: ['Asian', 'Filipino', 'Bareback', 'Twink']
      },
      {
        id: '6a1ca6595423410fce57dc96',
        old_slug: 'filipino-twink-gets-raw-fucked-after-breakup-with-his-girlfriend',
        new_slug: 'the-fitmaster-filipino-twink-armpit-worship-raw-anal',
        title: 'Filipino Twink Armpit Worship and Raw Anal with The_Fitmaster',
        meta_title: 'Filipino Twink Armpit Worship Raw Anal - FLESHLAB',
        meta_description: 'Watch a Filipino twink surrender to intense armpit worship and raw anal pounding from muscular top The_Fitmaster. Exclusive FLESHLAB scene.',
        short_summary: 'Filipino twink experiences intense armpit worship and raw anal from The_Fitmaster.',
        description: "After his partner leaves, this horny Filipino twink finds distraction in The_Fitmaster's massive raw cock. The session starts with primal armpit worship and a deep, sloppy blowjob before transitioning to a heavy bedroom pounding. Watch as the muscular Asian top stretches the twink's tight, inexperienced hole until he moans in total surrender. This raw Pinoy encounter captures the unbridled intensity that leaves both men drenched in sweat.",
        tags_remove: ['breakup sex', 'rebound', 'horny twink'],
        tags_keep: ['pinoy', 'filipino', 'the_fitmaster', 'raw anal', 'armpit worship', 'asian twink', 'muscular', 'deepthroat', 'amateur', 'Blowjob', 'Oral'],
        categories_remove: [],
        categories_keep: ['Filipino', 'Asian', 'Anal']
      }
    ];

    const results = [];

    for (const config of p1Config) {
      try {
        const video = await base44.entities.Video.get(config.id);
        
        if (!video) {
          results.push({
            video_id: config.id,
            status: 'error',
            error: 'Video not found'
          });
          continue;
        }

        // Get current tags and categories
        const currentTags = video.tags || [];
        const currentCategories = video.categories || [];
        
        // Filter tags: remove unwanted, keep approved
        const filteredTags = currentTags.filter(tag => {
          if (config.tags_remove?.includes(tag.toLowerCase())) return false;
          return true;
        });
        
        // Add any missing tags from keep list
        config.tags_keep?.forEach(tag => {
          if (!filteredTags.some(t => t.toLowerCase() === tag.toLowerCase())) {
            filteredTags.push(tag);
          }
        });
        
        // Filter categories: remove unwanted, keep approved
        const filteredCategories = currentCategories.filter(cat => {
          if (config.categories_remove?.includes(cat.toLowerCase())) return false;
          return true;
        });
        
        // Add any missing categories from keep list
        config.categories_keep?.forEach(cat => {
          if (!filteredCategories.some(c => c.toLowerCase() === cat.toLowerCase())) {
            filteredCategories.push(cat);
          }
        });

        // Prepare legacy_slugs
        const legacySlugs = video.legacy_slugs || [];
        if (!legacySlugs.includes(config.old_slug)) {
          legacySlugs.push(config.old_slug);
        }

        // Prepare update payload
        const updatePayload = {
          slug: config.new_slug,
          legacy_slugs: legacySlugs,
          title: config.title,
          meta_title: config.meta_title,
          meta_description: config.meta_description,
          short_summary: config.short_summary,
          description: config.description,
          tags: filteredTags,
          categories: filteredCategories
        };

        if (apply) {
          // Apply the update
          await base44.entities.Video.update(config.id, updatePayload);
          
          results.push({
            video_id: config.id,
            old_slug: config.old_slug,
            new_slug: config.new_slug,
            title_updated: true,
            meta_updated: true,
            tags_categories_cleaned: true,
            legacy_slugs: legacySlugs,
            status: 'completed'
          });
        } else {
          // Dry run - show what would change
          results.push({
            video_id: config.id,
            old_slug: config.old_slug,
            new_slug: config.new_slug,
            title_updated: config.title !== video.title,
            meta_updated: config.meta_title !== video.meta_title,
            tags_categories_cleaned: true,
            legacy_slugs_would_store: legacySlugs,
            status: 'proposed'
          });
        }
        
      } catch (error) {
        results.push({
          video_id: config.id,
          status: 'error',
          error: error.message
        });
      }
    }

    return Response.json({
      ok: true,
      mode: apply ? 'apply' : 'dry_run',
      total: p1Config.length,
      completed: results.filter(r => r.status === 'completed').length,
      errors: results.filter(r => r.status === 'error').length,
      results
    });
    
  } catch (error) {
    console.error('applyP1MetadataCleanup error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});