import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get current user - must be admin to set admin role
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For security, only allow setting admin role for specific email
    // In production, this should only be callable by existing admins
    const targetEmail = "ericroennau7@gmail.com";
    
    if (user.email !== targetEmail) {
      return Response.json({ 
        error: 'Only the specified email can be set as admin',
        currentEmail: user.email 
      }, { status: 403 });
    }

    // Update user role to admin
    await base44.entities.User.update(user.id, { role: "admin" });

    console.log("SET_ADMIN_ROLE_SUCCESS", { email: user.email, newRole: "admin" });

    return Response.json({ 
      success: true,
      email: user.email,
      role: "admin",
      message: "Admin role set successfully"
    });
  } catch (error) {
    console.error("SET_ADMIN_ROLE_ERROR", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});