import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Admin access required' }, { status: 403 });
        }

        const bucketName = Deno.env.get("R2_BUCKET_NAME");
        
        return Response.json({ 
            bucket_name: bucketName,
            message: "R2 Bucket Name retrieved successfully"
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});