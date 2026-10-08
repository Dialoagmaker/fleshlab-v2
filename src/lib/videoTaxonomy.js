/**
 * Video Taxonomy Configuration
 * Centralized approved categories for video classification
 * 
 * Rules:
 * - All categories involving younger appearance must use 18+ wording
 * - "Teen" must always display as "Teen (18+)"
 * - No free text category creation allowed
 * - Categories must come from this approved taxonomy only
 */

export const VIDEO_TAXONOMY = {
  groups: [
    {
      id: 'age_appearance',
      label: 'Age / Appearance',
      categories: [
        { id: 'teen_18', label: 'Teen (18+)', slug: 'teen-18', aliases: ['teen', 'young teen', '18+ teen'], seoWeight: 3 },
        { id: 'young_adult', label: 'Young Adult', slug: 'young-adult', aliases: ['young', 'young guy'], seoWeight: 2 },
        { id: 'college_guy', label: 'College Guy', slug: 'college-guy', aliases: ['college', 'student'], seoWeight: 2 },
        { id: 'mature', label: 'Mature', slug: 'mature', aliases: ['older', 'mature guy'], seoWeight: 2 },
        { id: 'daddy', label: 'Daddy', slug: 'daddy', aliases: ['dad', 'older guy'], seoWeight: 2 },
        { id: 'twink', label: 'Twink', slug: 'twink', aliases: ['twink boy'], seoWeight: 3 },
        { id: 'boyish', label: 'Boyish', slug: 'boyish', aliases: ['boy'], seoWeight: 1 },
        { id: 'slim', label: 'Slim', slug: 'slim', aliases: ['slim build'], seoWeight: 1 },
        { id: 'fit', label: 'Fit', slug: 'fit', aliases: ['fitness'], seoWeight: 1 },
        { id: 'muscular', label: 'Muscular', slug: 'muscular', aliases: ['muscle', 'buff'], seoWeight: 2 },
        { id: 'hairy', label: 'Hairy', slug: 'hairy', aliases: ['hairy guy'], seoWeight: 1 },
        { id: 'smooth', label: 'Smooth', slug: 'smooth', aliases: ['smooth body'], seoWeight: 1 },
        { id: 'chubby', label: 'Chubby', slug: 'chubby', aliases: ['chub', 'bigger guy'], seoWeight: 1 },
        { id: 'bear', label: 'Bear', slug: 'bear', aliases: ['bear type'], seoWeight: 2 },
        { id: 'jock', label: 'Jock', slug: 'jock', aliases: ['athlete', 'sports guy'], seoWeight: 2 },
        { id: 'nerd', label: 'Nerd', slug: 'nerd', aliases: ['geek', 'nerdy'], seoWeight: 1 },
        { id: 'alt_guy', label: 'Alt Guy', slug: 'alt-guy', aliases: ['alternative', 'punk', 'goth'], seoWeight: 1 },
        { id: 'tattooed', label: 'Tattooed', slug: 'tattooed', aliases: ['tattoos', 'inked'], seoWeight: 1 },
        { id: 'pierced', label: 'Pierced', slug: 'pierced', aliases: ['piercings'], seoWeight: 1 },
      ]
    },
    {
      id: 'ethnicity_origin',
      label: 'Ethnicity / Origin',
      categories: [
        { id: 'asian', label: 'Asian', slug: 'asian', aliases: ['asian guy'], seoWeight: 3 },
        { id: 'filipino', label: 'Filipino', slug: 'filipino', aliases: ['pinoy', 'philippines'], seoWeight: 3 },
        { id: 'thai', label: 'Thai', slug: 'thai', aliases: ['thailand'], seoWeight: 2 },
        { id: 'vietnamese', label: 'Vietnamese', slug: 'vietnamese', aliases: ['vietnam'], seoWeight: 2 },
        { id: 'indonesian', label: 'Indonesian', slug: 'indonesian', aliases: ['indonesia'], seoWeight: 2 },
        { id: 'malaysian', label: 'Malaysian', slug: 'malaysian', aliases: ['malaysia'], seoWeight: 1 },
        { id: 'japanese', label: 'Japanese', slug: 'japanese', aliases: ['japan'], seoWeight: 2 },
        { id: 'korean', label: 'Korean', slug: 'korean', aliases: ['korea'], seoWeight: 2 },
        { id: 'chinese', label: 'Chinese', slug: 'chinese', aliases: ['china'], seoWeight: 2 },
        { id: 'taiwanese', label: 'Taiwanese', slug: 'taiwanese', aliases: ['taiwan'], seoWeight: 2 },
        { id: 'indian', label: 'Indian', slug: 'indian', aliases: ['india'], seoWeight: 2 },
        { id: 'south_asian', label: 'South Asian', slug: 'south-asian', aliases: ['pakistani', 'bangladeshi'], seoWeight: 1 },
        { id: 'middle_eastern', label: 'Middle Eastern', slug: 'middle-eastern', aliases: ['arab', 'persian'], seoWeight: 1 },
        { id: 'latino', label: 'Latino', slug: 'latino', aliases: ['hispanic', 'latin'], seoWeight: 2 },
        { id: 'black', label: 'Black', slug: 'black', aliases: ['african', 'black guy'], seoWeight: 2 },
        { id: 'white', label: 'White', slug: 'white', aliases: ['caucasian', 'white guy'], seoWeight: 1 },
        { id: 'mixed', label: 'Mixed', slug: 'mixed', aliases: ['biracial', 'multiracial'], seoWeight: 1 },
        { id: 'european', label: 'European', slug: 'european', aliases: ['europe'], seoWeight: 1 },
      ]
    },
    {
      id: 'body_type',
      label: 'Body Type',
      categories: [
        { id: 'slim_body', label: 'Slim Body', slug: 'slim-body', aliases: ['slim build'], seoWeight: 1 },
        { id: 'skinny', label: 'Skinny', slug: 'skinny', aliases: ['thin'], seoWeight: 1 },
        { id: 'lean', label: 'Lean', slug: 'lean', aliases: ['lean build'], seoWeight: 1 },
        { id: 'athletic', label: 'Athletic', slug: 'athletic', aliases: ['athletic build'], seoWeight: 2 },
        { id: 'muscular_body', label: 'Muscular', slug: 'muscular-body', aliases: ['muscular build'], seoWeight: 2 },
        { id: 'smooth_body', label: 'Smooth Body', slug: 'smooth-body', aliases: ['smooth skin'], seoWeight: 1 },
        { id: 'hairy_body', label: 'Hairy Body', slug: 'hairy-body', aliases: ['hairy chest'], seoWeight: 1 },
        { id: 'big_cock', label: 'Big Cock', slug: 'big-cock', aliases: ['large cock', 'well endowed'], seoWeight: 3 },
        { id: 'thick_cock', label: 'Thick Cock', slug: 'thick-cock', aliases: ['thick dick'], seoWeight: 2 },
        { id: 'cut', label: 'Cut', slug: 'cut', aliases: ['circumcised'], seoWeight: 1 },
        { id: 'uncut', label: 'Uncut', slug: 'uncut', aliases: ['uncircumcised'], seoWeight: 2 },
        { id: 'bubble_butt', label: 'Bubble Butt', slug: 'bubble-butt', aliases: ['nice butt', 'great ass'], seoWeight: 2 },
        { id: 'nice_ass', label: 'Nice Ass', slug: 'nice-ass', aliases: ['good ass'], seoWeight: 2 },
        { id: 'abs', label: 'Abs', slug: 'abs', aliases: ['six pack', 'abs visible'], seoWeight: 1 },
        { id: 'tattoo', label: 'Tattoo', slug: 'tattoo', aliases: ['tattoos'], seoWeight: 1 },
        { id: 'piercing', label: 'Piercing', slug: 'piercing', aliases: ['piercings'], seoWeight: 1 },
      ]
    },
    {
      id: 'orientation_audience',
      label: 'Orientation / Audience',
      categories: [
        { id: 'gay', label: 'Gay', slug: 'gay', aliases: ['gay content'], seoWeight: 3 },
        { id: 'bi', label: 'Bi', slug: 'bi', aliases: ['bisexual', 'bi guy'], seoWeight: 2 },
        { id: 'straight_guy', label: 'Straight Guy', slug: 'straight-guy', aliases: ['straight'], seoWeight: 2 },
        { id: 'curious_guy', label: 'Curious Guy', slug: 'curious-guy', aliases: ['curious', 'experimenting'], seoWeight: 1 },
        { id: 'msm', label: 'MSM', slug: 'msm', aliases: ['men who have sex with men'], seoWeight: 1 },
        { id: 'gay_amateur', label: 'Gay Amateur', slug: 'gay-amateur', aliases: ['amateur gay'], seoWeight: 3 },
        { id: 'gay_solo', label: 'Gay Solo', slug: 'gay-solo', aliases: ['solo gay'], seoWeight: 2 },
        { id: 'gay_couple', label: 'Gay Couple', slug: 'gay-couple', aliases: ['couple', 'gay pair'], seoWeight: 2 },
        { id: 'gay_group', label: 'Gay Group', slug: 'gay-group', aliases: ['group gay'], seoWeight: 2 },
        { id: 'queer', label: 'Queer', slug: 'queer', aliases: ['queer content'], seoWeight: 1 },
      ]
    },
    {
      id: 'number_of_people',
      label: 'Number of People',
      categories: [
        { id: 'solo', label: 'Solo', slug: 'solo', aliases: ['solo guy', 'one guy'], seoWeight: 3 },
        { id: 'couple', label: 'Couple', slug: 'couple', aliases: ['two guys', 'pair'], seoWeight: 3 },
        { id: 'threesome', label: 'Threesome', slug: 'threesome', aliases: ['three way', '3some'], seoWeight: 3 },
        { id: 'group', label: 'Group', slug: 'group', aliases: ['group sex', 'multiple'], seoWeight: 2 },
        { id: 'one_on_one', label: 'One-on-One', slug: 'one-on-one', aliases: ['1 on 1'], seoWeight: 1 },
        { id: 'duo', label: 'Duo', slug: 'duo', aliases: ['two people'], seoWeight: 1 },
        { id: 'multiple_guys', label: 'Multiple Guys', slug: 'multiple-guys', aliases: ['several guys'], seoWeight: 1 },
      ]
    },
    {
      id: 'scene_type',
      label: 'Scene Type',
      categories: [
        { id: 'solo_masturbation', label: 'Solo Masturbation', slug: 'solo-masturbation', aliases: ['masturbation', 'wanking'], seoWeight: 3 },
        { id: 'jerk_off', label: 'Jerk Off', slug: 'jerk-off', aliases: ['jerking off', 'jacking off'], seoWeight: 3 },
        { id: 'joi', label: 'JOI', slug: 'joi', aliases: ['jerk off instruction'], seoWeight: 2 },
        { id: 'cumshot', label: 'Cumshot', slug: 'cumshot', aliases: ['cum shot', 'money shot'], seoWeight: 3 },
        { id: 'edging', label: 'Edging', slug: 'edging', aliases: ['edge play', 'orgasm control'], seoWeight: 2 },
        { id: 'orgasm', label: 'Orgasm', slug: 'orgasm', aliases: ['coming', 'climax'], seoWeight: 2 },
        { id: 'striptease', label: 'Striptease', slug: 'striptease', aliases: ['strip', 'stripping'], seoWeight: 2 },
        { id: 'tease', label: 'Tease', slug: 'tease', aliases: ['teasing'], seoWeight: 2 },
        { id: 'shower', label: 'Shower', slug: 'shower', aliases: ['shower scene'], seoWeight: 2 },
        { id: 'outdoor', label: 'Outdoor', slug: 'outdoor', aliases: ['outdoors', 'outside'], seoWeight: 2 },
        { id: 'public', label: 'Public', slug: 'public', aliases: ['public place'], seoWeight: 2 },
        { id: 'bedroom', label: 'Bedroom', slug: 'bedroom', aliases: ['in bedroom'], seoWeight: 1 },
        { id: 'bathroom', label: 'Bathroom', slug: 'bathroom', aliases: ['in bathroom'], seoWeight: 1 },
        { id: 'hotel', label: 'Hotel', slug: 'hotel', aliases: ['hotel room'], seoWeight: 2 },
        { id: 'home_amateur', label: 'Home Amateur', slug: 'home-amateur', aliases: ['at home', 'homemade'], seoWeight: 2 },
        { id: 'webcam', label: 'Webcam', slug: 'webcam', aliases: ['web cam', 'cam'], seoWeight: 2 },
        { id: 'selfie_video', label: 'Selfie Video', slug: 'selfie-video', aliases: ['selfie', 'phone video'], seoWeight: 2 },
        { id: 'pov', label: 'POV', slug: 'pov', aliases: ['point of view'], seoWeight: 2 },
        { id: 'amateur', label: 'Amateur', slug: 'amateur', aliases: ['amateur content'], seoWeight: 3 },
        { id: 'raw', label: 'Raw', slug: 'raw', aliases: ['raw footage'], seoWeight: 1 },
        { id: 'homemade', label: 'Homemade', slug: 'homemade', aliases: ['home made'], seoWeight: 2 },
        { id: 'casting', label: 'Casting', slug: 'casting', aliases: ['casting session'], seoWeight: 2 },
        { id: 'audition', label: 'Audition', slug: 'audition', aliases: ['audition tape'], seoWeight: 1 },
        { id: 'behind_the_scenes', label: 'Behind the Scenes', slug: 'behind-the-scenes', aliases: ['bts', 'backstage'], seoWeight: 1 },
      ]
    },
    {
      id: 'sex_acts',
      label: 'Sex Acts',
      categories: [
        { id: 'oral', label: 'Oral', slug: 'oral', aliases: ['oral sex'], seoWeight: 3 },
        { id: 'blowjob', label: 'Blowjob', slug: 'blowjob', aliases: ['bj', 'head', 'sucking cock'], seoWeight: 3 },
        { id: 'deepthroat', label: 'Deepthroat', slug: 'deepthroat', aliases: ['deep throat', 'throat fuck'], seoWeight: 2 },
        { id: 'handjob', label: 'Handjob', slug: 'handjob', aliases: ['hj', 'hand job'], seoWeight: 2 },
        { id: 'footjob', label: 'Footjob', slug: 'footjob', aliases: ['foot job', 'feet'], seoWeight: 1 },
        { id: 'anal', label: 'Anal', slug: 'anal', aliases: ['anal sex'], seoWeight: 3 },
        { id: 'bareback', label: 'Bareback', slug: 'bareback', aliases: ['bareback sex', 'no condom'], seoWeight: 3 },
        { id: 'condom', label: 'Condom', slug: 'condom', aliases: ['with condom', 'protected'], seoWeight: 1 },
        { id: 'riding', label: 'Riding', slug: 'riding', aliases: ['cowboy', 'top riding'], seoWeight: 2 },
        { id: 'missionary', label: 'Missionary', slug: 'missionary', aliases: ['missionary position'], seoWeight: 1 },
        { id: 'doggy_style', label: 'Doggy Style', slug: 'doggy-style', aliases: ['doggy', 'from behind'], seoWeight: 2 },
        { id: 'face_sitting', label: 'Face Sitting', slug: 'face-sitting', aliases: ['facesitting', 'face fuck'], seoWeight: 1 },
        { id: 'rimming', label: 'Rimming', slug: 'rimming', aliases: ['rim job', 'ass licking'], seoWeight: 2 },
        { id: 'fingering', label: 'Fingering', slug: 'fingering', aliases: ['finger fuck'], seoWeight: 2 },
        { id: 'ass_play', label: 'Ass Play', slug: 'ass-play', aliases: ['anal play'], seoWeight: 2 },
        { id: 'nipple_play', label: 'Nipple Play', slug: 'nipple-play', aliases: ['nipple stimulation'], seoWeight: 1 },
        { id: 'body_worship', label: 'Body Worship', slug: 'body-worship', aliases: ['worship'], seoWeight: 1 },
        { id: 'kissing', label: 'Kissing', slug: 'kissing', aliases: ['making out'], seoWeight: 1 },
        { id: 'spit', label: 'Spit', slug: 'spit', aliases: ['spitting', 'saliva'], seoWeight: 1 },
        { id: 'facial', label: 'Facial', slug: 'facial', aliases: ['facial cumshot'], seoWeight: 2 },
        { id: 'creampie', label: 'Creampie', slug: 'creampie', aliases: ['creampie sex'], seoWeight: 3 },
        { id: 'multiple_cumshots', label: 'Multiple Cumshots', slug: 'multiple-cumshots', aliases: ['multiple loads'], seoWeight: 2 },
      ]
    },
    {
      id: 'fetish_kink',
      label: 'Fetish / Kink',
      categories: [
        { id: 'bdsm', label: 'BDSM', slug: 'bdsm', aliases: ['bdsm scene'], seoWeight: 2 },
        { id: 'domination', label: 'Domination', slug: 'domination', aliases: ['dom', 'dominant'], seoWeight: 2 },
        { id: 'submission', label: 'Submission', slug: 'submission', aliases: ['sub', 'submissive'], seoWeight: 2 },
        { id: 'slave', label: 'Slave', slug: 'slave', aliases: ['slavery'], seoWeight: 1 },
        { id: 'master', label: 'Master', slug: 'master', aliases: ['master guy'], seoWeight: 1 },
        { id: 'daddy_fetish', label: 'Daddy Fetish', slug: 'daddy-fetish', aliases: ['daddy kink'], seoWeight: 1 },
        { id: 'sir', label: 'Sir', slug: 'sir', aliases: ['sir dynamic'], seoWeight: 1 },
        { id: 'bondage', label: 'Bondage', slug: 'bondage', aliases: ['tied up', 'restraints'], seoWeight: 2 },
        { id: 'spanking', label: 'Spanking', slug: 'spanking', aliases: ['spank'], seoWeight: 1 },
        { id: 'discipline', label: 'Discipline', slug: 'discipline', aliases: ['disciplined'], seoWeight: 1 },
        { id: 'humiliation', label: 'Humiliation', slug: 'humiliation', aliases: ['humiliated'], seoWeight: 1 },
        { id: 'worship', label: 'Worship', slug: 'worship', aliases: ['worship scene'], seoWeight: 1 },
        { id: 'foot_fetish', label: 'Foot Fetish', slug: 'foot-fetish', aliases: ['foot worship'], seoWeight: 2 },
        { id: 'socks', label: 'Socks', slug: 'socks', aliases: ['sock fetish'], seoWeight: 1 },
        { id: 'underwear', label: 'Underwear', slug: 'underwear', aliases: ['underwear fetish'], seoWeight: 2 },
        { id: 'jockstrap', label: 'Jockstrap', slug: 'jockstrap', aliases: ['jock strap'], seoWeight: 2 },
        { id: 'leather', label: 'Leather', slug: 'leather', aliases: ['leather gear'], seoWeight: 2 },
        { id: 'latex', label: 'Latex', slug: 'latex', aliases: ['latex gear'], seoWeight: 1 },
        { id: 'gear', label: 'Gear', slug: 'gear', aliases: ['fetish gear'], seoWeight: 1 },
        { id: 'mask', label: 'Mask', slug: 'mask', aliases: ['masked'], seoWeight: 1 },
        { id: 'toy_play', label: 'Toy Play', slug: 'toy-play', aliases: ['sex toys'], seoWeight: 2 },
        { id: 'dildo', label: 'Dildo', slug: 'dildo', aliases: ['dildo play'], seoWeight: 2 },
        { id: 'fleshlight', label: 'Fleshlight', slug: 'fleshlight', aliases: ['masturbator'], seoWeight: 1 },
        { id: 'pump', label: 'Pump', slug: 'pump', aliases: ['cock pump', 'vacuum'], seoWeight: 1 },
        { id: 'sounding', label: 'Sounding', slug: 'sounding', aliases: ['urethral play'], seoWeight: 1 },
        { id: 'edge_play', label: 'Edge Play', slug: 'edge-play', aliases: ['edgeplay'], seoWeight: 1 },
        { id: 'nipple_clamps', label: 'Nipple Clamps', slug: 'nipple-clamps', aliases: ['clamps'], seoWeight: 1 },
        { id: 'cock_ring', label: 'Cock Ring', slug: 'cock-ring', aliases: ['cockring'], seoWeight: 1 },
      ]
    },
    {
      id: 'role_dynamic',
      label: 'Role / Dynamic',
      categories: [
        { id: 'top', label: 'Top', slug: 'top', aliases: ['top guy'], seoWeight: 2 },
        { id: 'bottom', label: 'Bottom', slug: 'bottom', aliases: ['bottom guy'], seoWeight: 2 },
        { id: 'versatile', label: 'Versatile', slug: 'versatile', aliases: ['vers'], seoWeight: 2 },
        { id: 'dom', label: 'Dom', slug: 'dom', aliases: ['dominant'], seoWeight: 2 },
        { id: 'sub', label: 'Sub', slug: 'sub', aliases: ['submissive'], seoWeight: 2 },
        { id: 'daddy_boy', label: 'Daddy / Boy', slug: 'daddy-boy', aliases: ['daddy boy dynamic'], seoWeight: 2 },
        { id: 'master_slave', label: 'Master / Slave', slug: 'master-slave', aliases: ['ms dynamic'], seoWeight: 1 },
        { id: 'older_younger', label: 'Older / Younger', slug: 'older-younger', aliases: ['age gap'], seoWeight: 2 },
        { id: 'trainer_student', label: 'Trainer / Student', slug: 'trainer-student', aliases: ['coach player'], seoWeight: 1 },
        { id: 'boss_worker', label: 'Boss / Worker', slug: 'boss-worker', aliases: ['boss employee'], seoWeight: 1 },
        { id: 'stranger', label: 'Stranger', slug: 'stranger', aliases: ['strangers'], seoWeight: 1 },
        { id: 'friends', label: 'Friends', slug: 'friends', aliases: ['friendship'], seoWeight: 1 },
        { id: 'roommates', label: 'Roommates', slug: 'roommates', aliases: ['roomie'], seoWeight: 2 },
      ]
    },
    {
      id: 'production_style',
      label: 'Production Style',
      categories: [
        { id: 'hd_video', label: 'HD Video', slug: 'hd-video', aliases: ['hd', 'high definition'], seoWeight: 2 },
        { id: '4k', label: '4K', slug: '4k', aliases: ['4k video', 'ultra hd'], seoWeight: 2 },
        { id: 'vertical_video', label: 'Vertical Video', slug: 'vertical-video', aliases: ['portrait video', 'phone format'], seoWeight: 1 },
        { id: 'smartphone', label: 'Smartphone', slug: 'smartphone', aliases: ['phone video', 'mobile'], seoWeight: 1 },
        { id: 'webcam_style', label: 'Webcam Style', slug: 'webcam-style', aliases: ['webcam look'], seoWeight: 1 },
        { id: 'studio_production', label: 'Studio Production', slug: 'studio-production', aliases: ['professional', 'studio quality'], seoWeight: 2 },
        { id: 'amateur_production', label: 'Amateur Production', slug: 'amateur-production', aliases: ['amateur quality'], seoWeight: 1 },
        { id: 'cinematic', label: 'Cinematic', slug: 'cinematic', aliases: ['cinematography'], seoWeight: 1 },
        { id: 'raw_footage', label: 'Raw Footage', slug: 'raw-footage', aliases: ['raw video'], seoWeight: 1 },
        { id: 'uncut', label: 'Uncut', slug: 'uncut', aliases: ['uncut version'], seoWeight: 1 },
        { id: 'short_clip', label: 'Short Clip', slug: 'short-clip', aliases: ['short video'], seoWeight: 1 },
        { id: 'full_scene', label: 'Full Scene', slug: 'full-scene', aliases: ['full length'], seoWeight: 2 },
        { id: 'fanclub_exclusive', label: 'Fanclub Exclusive', slug: 'fanclub-exclusive', aliases: ['exclusive'], seoWeight: 2 },
        { id: 'ppv', label: 'PPV', slug: 'ppv', aliases: ['pay per view'], seoWeight: 2 },
        { id: 'free_preview', label: 'Free Preview', slug: 'free-preview', aliases: ['preview', 'free video'], seoWeight: 1 },
      ]
    },
    {
      id: 'location',
      label: 'Location',
      categories: [
        { id: 'bedroom_loc', label: 'Bedroom', slug: 'bedroom-loc', aliases: ['in bedroom'], seoWeight: 1 },
        { id: 'bathroom_loc', label: 'Bathroom', slug: 'bathroom-loc', aliases: ['in bathroom'], seoWeight: 1 },
        { id: 'shower_loc', label: 'Shower', slug: 'shower-loc', aliases: ['in shower'], seoWeight: 2 },
        { id: 'hotel_room', label: 'Hotel Room', slug: 'hotel-room', aliases: ['hotel'], seoWeight: 2 },
        { id: 'living_room', label: 'Living Room', slug: 'living-room', aliases: ['living room'], seoWeight: 1 },
        { id: 'kitchen', label: 'Kitchen', slug: 'kitchen', aliases: ['in kitchen'], seoWeight: 1 },
        { id: 'balcony', label: 'Balcony', slug: 'balcony', aliases: ['on balcony'], seoWeight: 1 },
        { id: 'garden', label: 'Garden', slug: 'garden', aliases: ['in garden'], seoWeight: 1 },
        { id: 'forest', label: 'Forest', slug: 'forest', aliases: ['woods', 'in forest'], seoWeight: 1 },
        { id: 'beach', label: 'Beach', slug: 'beach', aliases: ['at beach'], seoWeight: 2 },
        { id: 'pool', label: 'Pool', slug: 'pool', aliases: ['swimming pool'], seoWeight: 1 },
        { id: 'gym', label: 'Gym', slug: 'gym', aliases: ['at gym'], seoWeight: 2 },
        { id: 'locker_room', label: 'Locker Room', slug: 'locker-room', aliases: ['lockers'], seoWeight: 2 },
        { id: 'car', label: 'Car', slug: 'car', aliases: ['in car', 'vehicle'], seoWeight: 1 },
        { id: 'office', label: 'Office', slug: 'office', aliases: ['at office'], seoWeight: 1 },
        { id: 'street', label: 'Street', slug: 'street', aliases: ['on street'], seoWeight: 1 },
        { id: 'outdoor_location', label: 'Outdoor Location', slug: 'outdoor-location', aliases: ['outdoors'], seoWeight: 1 },
        { id: 'public_place', label: 'Public Place', slug: 'public-place', aliases: ['public location'], seoWeight: 1 },
        { id: 'province', label: 'Province', slug: 'province', aliases: ['provincial'], seoWeight: 1 },
        { id: 'city', label: 'City', slug: 'city', aliases: ['urban'], seoWeight: 1 },
      ]
    },
    {
      id: 'clothing_outfit',
      label: 'Clothing / Outfit',
      categories: [
        { id: 'underwear_cloth', label: 'Underwear', slug: 'underwear-cloth', aliases: ['underwear scene'], seoWeight: 2 },
        { id: 'briefs', label: 'Briefs', slug: 'briefs', aliases: ['wearing briefs'], seoWeight: 1 },
        { id: 'boxers', label: 'Boxers', slug: 'boxers', aliases: ['wearing boxers'], seoWeight: 1 },
        { id: 'jockstrap_cloth', label: 'Jockstrap', slug: 'jockstrap-cloth', aliases: ['wearing jockstrap'], seoWeight: 2 },
        { id: 'swimwear', label: 'Swimwear', slug: 'swimwear', aliases: ['swimming trunks'], seoWeight: 1 },
        { id: 'shorts', label: 'Shorts', slug: 'shorts', aliases: ['wearing shorts'], seoWeight: 1 },
        { id: 'jeans', label: 'Jeans', slug: 'jeans', aliases: ['wearing jeans'], seoWeight: 1 },
        { id: 'sportswear', label: 'Sportswear', slug: 'sportswear', aliases: ['sports clothes'], seoWeight: 1 },
        { id: 'gym_clothes', label: 'Gym Clothes', slug: 'gym-clothes', aliases: ['workout clothes'], seoWeight: 1 },
        { id: 'uniform', label: 'Uniform', slug: 'uniform', aliases: ['wearing uniform'], seoWeight: 2 },
        { id: 'suit', label: 'Suit', slug: 'suit', aliases: ['wearing suit'], seoWeight: 1 },
        { id: 'leather_gear', label: 'Leather Gear', slug: 'leather-gear', aliases: ['leather outfit'], seoWeight: 2 },
        { id: 'harness', label: 'Harness', slug: 'harness', aliases: ['wearing harness'], seoWeight: 2 },
        { id: 'socks_cloth', label: 'Socks', slug: 'socks-cloth', aliases: ['wearing socks'], seoWeight: 1 },
        { id: 'barefoot', label: 'Barefoot', slug: 'barefoot', aliases: ['no shoes'], seoWeight: 1 },
        { id: 'shirtless', label: 'Shirtless', slug: 'shirtless', aliases: ['no shirt', 'topless'], seoWeight: 2 },
        { id: 'naked', label: 'Naked', slug: 'naked', aliases: ['nude', 'no clothes'], seoWeight: 3 },
      ]
    },
    {
      id: 'language_region',
      label: 'Language / Region',
      categories: [
        { id: 'english', label: 'English', slug: 'english', aliases: ['english language'], seoWeight: 1 },
        { id: 'filipino_language', label: 'Filipino Language', slug: 'filipino-language', aliases: ['filipino spoken'], seoWeight: 2 },
        { id: 'tagalog', label: 'Tagalog', slug: 'tagalog', aliases: ['tagalog language'], seoWeight: 2 },
        { id: 'thai_language', label: 'Thai Language', slug: 'thai-language', aliases: ['thai spoken'], seoWeight: 1 },
        { id: 'mandarin', label: 'Mandarin', slug: 'mandarin', aliases: ['mandarin chinese'], seoWeight: 1 },
        { id: 'hindi', label: 'Hindi', slug: 'hindi', aliases: ['hindi language'], seoWeight: 1 },
        { id: 'japanese_language', label: 'Japanese', slug: 'japanese-language', aliases: ['japanese spoken'], seoWeight: 1 },
        { id: 'korean_language', label: 'Korean', slug: 'korean-language', aliases: ['korean spoken'], seoWeight: 1 },
        { id: 'vietnamese_language', label: 'Vietnamese', slug: 'vietnamese-language', aliases: ['vietnamese spoken'], seoWeight: 1 },
        { id: 'spanish', label: 'Spanish', slug: 'spanish', aliases: ['spanish language'], seoWeight: 1 },
        { id: 'german', label: 'German', slug: 'german', aliases: ['german language'], seoWeight: 1 },
      ]
    },
    {
      id: 'access_platform',
      label: 'Access / Platform',
      categories: [
        { id: 'free', label: 'Free', slug: 'free', aliases: ['free video', 'free content'], seoWeight: 2 },
        { id: 'preview', label: 'Preview', slug: 'preview', aliases: ['preview video'], seoWeight: 1 },
        { id: 'ppv_access', label: 'PPV', slug: 'ppv-access', aliases: ['pay per view'], seoWeight: 2 },
        { id: 'fanclub_access', label: 'Fanclub', slug: 'fanclub-access', aliases: ['fan club'], seoWeight: 2 },
        { id: 'members_only', label: 'Members Only', slug: 'members-only', aliases: ['members'], seoWeight: 1 },
        { id: 'premium', label: 'Premium', slug: 'premium', aliases: ['premium content'], seoWeight: 2 },
        { id: 'exclusive', label: 'Exclusive', slug: 'exclusive', aliases: ['exclusive content'], seoWeight: 2 },
        { id: 'new_release', label: 'New Release', slug: 'new-release', aliases: ['new video', 'just released'], seoWeight: 2 },
        { id: 'featured', label: 'Featured', slug: 'featured', aliases: ['featured video'], seoWeight: 1 },
      ]
    },
    {
      id: 'seo_search_helpers',
      label: 'SEO / Search Helpers',
      categories: [
        { id: 'asian_twink', label: 'Asian Twink', slug: 'asian-twink', aliases: ['asian twink boy'], seoWeight: 3 },
        { id: 'filipino_twink', label: 'Filipino Twink', slug: 'filipino-twink', aliases: ['pinoy twink'], seoWeight: 3 },
        { id: 'amateur_twink', label: 'Amateur Twink', slug: 'amateur-twink', aliases: ['amateur twink boy'], seoWeight: 2 },
        { id: 'solo_twink', label: 'Solo Twink', slug: 'solo-twink', aliases: ['twink solo'], seoWeight: 2 },
        { id: 'outdoor_solo', label: 'Outdoor Solo', slug: 'outdoor-solo', aliases: ['outdoor solo guy'], seoWeight: 2 },
        { id: 'public_jerk_off', label: 'Public Jerk Off', slug: 'public-jerk-off', aliases: ['public jerking'], seoWeight: 2 },
        { id: 'hotel_solo', label: 'Hotel Solo', slug: 'hotel-solo', aliases: ['hotel solo guy'], seoWeight: 2 },
        { id: 'shower_solo', label: 'Shower Solo', slug: 'shower-solo', aliases: ['shower solo'], seoWeight: 2 },
        { id: 'webcam_solo', label: 'Webcam Solo', slug: 'webcam-solo', aliases: ['webcam solo'], seoWeight: 2 },
        { id: 'gay_amateur_seo', label: 'Gay Amateur', slug: 'gay-amateur-seo', aliases: ['gay amateur content'], seoWeight: 3 },
        { id: 'raw_amateur', label: 'Raw Amateur', slug: 'raw-amateur', aliases: ['raw amateur video'], seoWeight: 2 },
        { id: 'hardcore_solo', label: 'Hardcore Solo', slug: 'hardcore-solo', aliases: ['hardcore solo'], seoWeight: 2 },
      ]
    },
  ]
};

// Flatten all categories for easy lookup
export const getAllCategories = () => {
  return VIDEO_TAXONOMY.groups.flatMap(group => group.categories);
};

// Get category by ID
export const getCategoryById = (id) => {
  return getAllCategories().find(cat => cat.id === id);
};

// Get category by slug
export const getCategoryBySlug = (slug) => {
  return getAllCategories().find(cat => cat.slug === slug);
};

// Get category by label (case insensitive)
export const getCategoryByLabel = (label) => {
  const normalized = label.toLowerCase().trim();
  return getAllCategories().find(cat => 
    cat.label.toLowerCase() === normalized || 
    cat.aliases.some(alias => alias.toLowerCase() === normalized)
  );
};

// Validate categories against taxonomy
export const validateVideoCategories = (categories) => {
  if (!Array.isArray(categories)) {
    return { valid: false, errors: ['Categories must be an array'], normalized: [], removed: [] };
  }

  const allCategories = getAllCategories();
  const validCategoryIds = new Set(allCategories.map(cat => cat.id));
  const validCategoryLabels = new Set(allCategories.map(cat => cat.label.toLowerCase()));
  
  const normalized = [];
  const removed = [];

  categories.forEach(cat => {
    if (typeof cat !== 'string') {
      removed.push({ value: cat, reason: 'Invalid type' });
      return;
    }

    const trimmed = cat.trim();
    const lower = trimmed.toLowerCase();

    // Check if it matches an ID
    if (validCategoryIds.has(trimmed)) {
      normalized.push(trimmed);
      return;
    }

    // Check if it matches a label
    const matchingCat = allCategories.find(c => c.label.toLowerCase() === lower);
    if (matchingCat) {
      normalized.push(matchingCat.id);
      return;
    }

    // Not found in taxonomy
    removed.push({ value: trimmed, reason: 'Not in approved taxonomy' });
  });

  // Remove duplicates
  const unique = [...new Set(normalized)];
  
  // Limit to reasonable number (3-8 primary categories)
  if (unique.length > 8) {
    removed.push({ value: `(${unique.length - 8} additional categories)`, reason: 'Exceeded maximum of 8 categories' });
  }

  return {
    valid: removed.length === 0,
    errors: removed.map(r => `${r.value}: ${r.reason}`),
    normalized: unique.slice(0, 8),
    removed
  };
};

// Map legacy categories to new taxonomy
export const mapLegacyCategories = (legacyCategories) => {
  if (!Array.isArray(legacyCategories)) return [];

  const mapping = {
    'teen': 'teen_18',
    'hd videos': 'hd_video',
    'hd': 'hd_video',
    'masturbation': 'solo_masturbation',
    'filipino': 'filipino',
    'asian': 'asian',
    'twink': 'twink',
    'solo': 'solo',
    'amateur': 'amateur',
    'gay': 'gay',
    'anal': 'anal',
    'oral': 'oral',
    'blowjob': 'blowjob',
    'cumshot': 'cumshot',
    'outdoor': 'outdoor',
    'shower': 'shower',
    'webcam': 'webcam',
    'pov': 'pov',
    'bareback': 'bareback',
    'creampie': 'creampie',
  };

  return legacyCategories.map(cat => {
    const lower = cat.toLowerCase().trim();
    return mapping[lower] || cat;
  });
};

// Get all categories grouped by taxonomy group
export const getGroupedCategories = () => {
  return VIDEO_TAXONOMY.groups.map(group => ({
    id: group.id,
    label: group.label,
    categories: group.categories.map(cat => ({
      id: cat.id,
      label: cat.label,
      slug: cat.slug,
      aliases: cat.aliases,
      seoWeight: cat.seoWeight,
      isApproved: true
    }))
  }));
};

// Search categories by query
export const searchCategories = (query) => {
  if (!query || query.trim().length < 2) return [];
  
  const lowerQuery = query.toLowerCase().trim();
  const allCategories = getAllCategories();
  
  return allCategories.filter(cat => 
    cat.label.toLowerCase().includes(lowerQuery) ||
    cat.aliases.some(alias => alias.toLowerCase().includes(lowerQuery)) ||
    cat.slug.toLowerCase().includes(lowerQuery)
  );
};

// ============================================================================
// PARENT TAXONOMY GROUP LABELS - BLOCKED FROM USE AS CATEGORIES
// These are group headers only, not selectable categories
// ============================================================================

export const PARENT_GROUP_LABELS = [
  'age',
  'ethnicity',
  'body',
  'orientation',
  'number of people',
  'actions',
  'production',
  'apparel',
  'scenario',
  'fetish',
  'language',
  'location',
  'sex toys',
];

/**
 * Check if a value is a parent taxonomy group label (not a valid category)
 */
export const isParentGroupLabel = (value) => {
  if (!value || typeof value !== 'string') return false;
  const lower = value.toLowerCase().trim();
  return PARENT_GROUP_LABELS.includes(lower);
};

/**
 * Map generic parent group labels to specific child categories based on context
 * 
 * @param {string} parentLabel - The parent group label (e.g. "Fetish")
 * @param {string} contextText - Scene context from title/description/notes
 * @returns {string[]|null} Array of specific category IDs to use, or null if no mapping possible
 */
export const mapParentGroupToCategories = (parentLabel, contextText = '') => {
  if (!parentLabel || typeof parentLabel !== 'string') return null;
  
  const lower = parentLabel.toLowerCase().trim();
  const context = contextText.toLowerCase();
  
  // "Fetish" -> map to specific fetish categories based on evidence
  if (lower === 'fetish') {
    const mappings = [];
    
    // Check for BDSM evidence
    if (/(nipple\s*(clamp|play|torture)|clamp|pain\s*play|edging|orgasm\s*control)/i.test(context)) {
      mappings.push('bdsm');
    }
    
    // Check for bondage evidence
    if (/(bondage|restrain|tied\s*up|rope|cuff)/i.test(context)) {
      mappings.push('bondage');
    }
    
    // Check for foot fetish evidence
    if (/(foot\s*(fetish|worship)|feet)/i.test(context)) {
      mappings.push('foot_fetish');
    }
    
    // Check for spanking evidence
    if (/(spank|spanking)/i.test(context)) {
      mappings.push('spanking');
    }
    
    // Check for domination/submission evidence
    if (/(dominat|submiss|daddy\s*fetish|master|slave)/i.test(context)) {
      mappings.push('domination');
      mappings.push('submission');
    }
    
    // If no specific evidence, return null (should be removed entirely)
    return mappings.length > 0 ? mappings : null;
  }
  
  // "Age" -> map based on performer appearance
  if (lower === 'age') {
    if (/teen|young|18\+/i.test(context)) return ['teen_18'];
    if (/mature|daddy|older/i.test(context)) return ['mature', 'daddy'];
    if (/twink|boyish|slim/i.test(context)) return ['twink', 'boyish'];
    return null;
  }
  
  // "Body" -> map based on body type references
  if (lower === 'body') {
    if (/muscular|buff|muscle/i.test(context)) return ['muscular', 'muscular_body'];
    if (/slim|skinny|lean/i.test(context)) return ['slim', 'slim_body'];
    if (/fit|athletic/i.test(context)) return ['fit', 'athletic'];
    if (/hairy|furry/i.test(context)) return ['hairy', 'hairy_body'];
    return null;
  }
  
  // "Actions" -> too generic, should not be used
  if (lower === 'actions') {
    return null;
  }
  
  // "Scenario" -> map to location/setting if present
  if (lower === 'scenario') {
    if (/outdoor|jungle|forest|outside/i.test(context)) return ['outdoor', 'outdoor_location'];
    if (/shower|bathroom/i.test(context)) return ['shower', 'shower_loc'];
    if (/hotel/i.test(context)) return ['hotel', 'hotel_room'];
    if (/bedroom/i.test(context)) return ['bedroom', 'bedroom_loc'];
    return null;
  }
  
  // Default: no mapping for other parent groups
  return null;
};