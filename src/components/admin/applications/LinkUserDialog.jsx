import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, AlertTriangle } from "lucide-react";

export default function LinkUserDialog({ isOpen, onClose, selectedApp, onLink }) {
  const [searchEmail, setSearchEmail] = useState("");
  const [foundUser, setFoundUser] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && selectedApp?.email) {
      setSearchEmail(selectedApp.email);
      handleSearch(selectedApp.email);
    }
  }, [isOpen, selectedApp]);

  const handleSearch = async (email) => {
    if (!email) return;
    setLoading(true);
    setError(null);
    setFoundUser(null);
    try {
      const res = await base44.entities.User.filter({ email });
      if (res.length > 0) {
        setFoundUser(res[0]);
      } else {
        setError("No user found with this email.");
      }
    } catch (e) {
      setError("Failed to search for user.");
    }
    setLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Link User Account</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Search for a user by email to link to this performer profile.</p>
          <div className="flex gap-2">
            <Input
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              placeholder="user@example.com"
            />
            <Button onClick={() => handleSearch(searchEmail)} disabled={loading}>
              <Search className="w-4 h-4 mr-2" />
              {loading ? "Searching..." : "Search"}
            </Button>
          </div>

          {error && (
            <div className="text-sm text-red-500 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> {error}
            </div>
          )}

          {foundUser && (
            <div className="bg-secondary p-3 rounded-lg text-sm">
              <p className="font-semibold">{foundUser.full_name}</p>
              <p className="text-muted-foreground">{foundUser.email}</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onLink(foundUser.id)} disabled={!foundUser}>
            Link to {foundUser?.full_name || 'User'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}