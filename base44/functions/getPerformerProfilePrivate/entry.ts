import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Performer-side: Get own private profile
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get authenticated user
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find performer linked to this user
    const performers = await base44.asServiceRole.entities.Performer.filter({
      user_id: user.id
    });

    if (!performers || performers.length === 0) {
      return Response.json({ error: 'No performer profile linked to your account' }, { status: 404 });
    }

    const performer = performers[0];

    // Get private profile
    const profiles = await base44.asServiceRole.entities.PerformerProfilePrivate.filter({
      performer_id: performer.id
    });

    const profile = profiles && profiles.length > 0 ? profiles[0] : null;

    // Mask sensitive payout data
    let maskedPayoutDetails = null;
    if (profile?.payout_details_encrypted) {
      try {
        const details = JSON.parse(profile.payout_details_encrypted);
        maskedPayoutDetails = maskPayoutDetails(profile.payout_method, details);
      } catch (e) {
        maskedPayoutDetails = null;
      }
    }

    return Response.json({
      success: true,
      performer: {
        id: performer.id,
        display_name: performer.display_name,
        slug: performer.slug,
        bio: performer.bio,
        nationality: performer.nationality,
        date_of_birth: performer.date_of_birth,
        profile_image_url: performer.profile_image_url,
        status: performer.status,
        verified: performer.verified
      },
      profile: profile ? {
        ...profile,
        payout_details_encrypted: undefined, // Don't expose encrypted data
        payout_details_masked: maskedPayoutDetails
      } : null
    });
  } catch (error) {
    console.error('getPerformerProfilePrivate error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function maskPayoutDetails(method, details) {
  if (!details) return null;
  
  switch (method) {
    case 'paypal':
      return {
        ...details,
        paypal_email: maskEmail(details.paypal_email)
      };
    case 'gcash':
      return {
        ...details,
        mobile_number: maskPhone(details.mobile_number)
      };
    case 'paymaya':
      return {
        ...details,
        mobile_number: maskPhone(details.mobile_number)
      };
    case 'bank_transfer':
      return {
        ...details,
        account_number: maskAccount(details.account_number)
      };
    case 'wise':
      return {
        ...details,
        email: maskEmail(details.email)
      };
    default:
      return details;
  }
}

function maskEmail(email) {
  if (!email) return '';
  const [username, domain] = email.split('@');
  if (username.length <= 2) return `**@${domain}`;
  return `${username.substring(0, 2)}***@${domain}`;
}

function maskPhone(phone) {
  if (!phone) return '';
  if (phone.length <= 4) return '****';
  return `****${phone.substring(phone.length - 4)}`;
}

function maskAccount(account) {
  if (!account) return '';
  if (account.length <= 4) return '****';
  return `****${account.substring(account.length - 4)}`;
}