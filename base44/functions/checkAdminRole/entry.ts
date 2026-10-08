import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get current user
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log("CHECK_ADMIN_ROLE_USER", user);
    console.log("CHECK_ADMIN_ROLE_EMAIL", user.email);
    console.log("CHECK_ADMIN_ROLE_ROLE", user.role);

    // Check if user has admin role
    const isAdmin = user.role === "admin";

    return Response.json({ 
      email: user.email,
      role: user.role,
      isAdmin: isAdmin,
      full_name: user.full_name
    });
  } catch (error) {
    console.error("CHECK_ADMIN_ROLE_ERROR", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});