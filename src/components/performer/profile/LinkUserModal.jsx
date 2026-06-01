import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, User, Unlink } from "lucide-react";
import { toast } from "sonner";

export default function LinkUserModal({ performerId, currentUserId, onClose, onSuccess }) {
  const [searchEmail, setSearchEmail] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);

  // Search for users by email
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['user-search', searchEmail],
    queryFn: async () => {
      if (!searchEmail || searchEmail.length < 2) return [];
      const users = await base44.asServiceRole.entities.User.filter({});
      return users.filter(u => 
        u.email?.toLowerCase().includes(searchEmail.toLowerCase()) ||
        u.full_name?.toLowerCase().includes(searchEmail.toLowerCase())
      ).slice(0, 10);
    },
    enabled: searchEmail.length >= 2
  });

  // Link user to performer
  const linkUser = useMutation({
    mutationFn: async ({ performer_id, user_id }) => {
      const res = await base44.functions.invoke("performerAdminService", {
        action: "link_user",
        performer_id,
        user_id,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success("User linked to performer successfully");
      onSuccess();
      onClose();
    },
    onError: (error) => {
      toast.error(`Failed to link user: ${error.message}`);
    },
  });

  // Unlink user from performer
  const unlinkUser = useMutation({
    mutationFn: async ({ performer_id }) => {
      const res = await base44.functions.invoke("performerAdminService", {
        action: "unlink_user",
        performer_id,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success("User unlinked from performer");
      onSuccess();
      onClose();
    },
    onError: (error) => {
      toast.error(`Failed to unlink user: ${error.message}`);
    },
  });

  const handleLink = () => {
    if (!selectedUser) return;
    linkUser.mutate({ performer_id: performerId, user_id: selectedUser.id });
  };

  const handleUnlink = () => {
    if (!currentUserId) return;
    unlinkUser.mutate({ performer_id: performerId });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {currentUserId ? "Linked User Account" : "Link User Account"}
          </DialogTitle>
          <DialogDescription>
            {currentUserId 
              ? "This performer profile is linked to a user account. You can unlink it if needed."
              : "Link this performer profile to a user account for dashboard access."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {currentUserId ? (
            // Show current linked user
            <div className="space-y-3">
              <div className="bg-muted rounded-lg p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">User ID: {currentUserId}</p>
                  <p className="text-xs text-muted-foreground">This user can access the performer dashboard</p>
                </div>
              </div>
              
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                <p className="text-xs text-yellow-200">
                  ⚠️ Unlinking will prevent this user from accessing the performer dashboard. 
                  The performer profile will remain intact.
                </p>
              </div>

              <Button
                variant="destructive"
                onClick={handleUnlink}
                disabled={unlinkUser.isPending}
                className="w-full gap-2"
              >
                <Unlink className="w-4 h-4" />
                {unlinkUser.isPending ? "Unlinking..." : "Unlink User"}
              </Button>
            </div>
          ) : (
            // Search and link new user
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="search-user">Search User by Email or Name</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="search-user"
                    className="pl-9"
                    placeholder="user@example.com"
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                  />
                </div>
              </div>

              {isSearching && (
                <p className="text-xs text-muted-foreground text-center">Searching...</p>
              )}

              {searchResults && searchResults.length > 0 && (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  <Label className="text-xs">Select User:</Label>
                  {searchResults.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => setSelectedUser(user)}
                      className={`w-full p-3 rounded-lg border text-left transition-all ${
                        selectedUser?.id === user.id
                          ? "border-primary bg-primary/10"
                          : "border-border hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm text-foreground">{user.full_name || "Unnamed User"}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {searchEmail && searchResults && searchResults.length === 0 && !isSearching && (
                <p className="text-xs text-muted-foreground text-center">No users found matching "{searchEmail}"</p>
              )}

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                <p className="text-xs text-blue-200">
                  ℹ️ Linking a user account allows them to access the performer dashboard and manage their profile.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {!currentUserId && (
            <Button
              onClick={handleLink}
              disabled={!selectedUser || linkUser.isPending}
              className="gap-2"
            >
              {linkUser.isPending ? "Linking..." : "Link User"}
            </Button>
          )}
          <Button variant="outline" onClick={onClose} disabled={linkUser.isPending || unlinkUser.isPending}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}