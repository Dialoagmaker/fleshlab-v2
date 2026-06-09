import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, AlertTriangle, CheckCircle, User } from "lucide-react";

export default function LinkUserDialog({ isOpen, onClose, selectedApp, onLink }) {
  const [searchEmail, setSearchEmail] = useState("");
  const [foundUser, setFoundUser] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);

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
    setConfirming(false);
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

  const handleConfirmLink = () => {
    setConfirming(true);
  };

  const handleCancelConfirm = () => {
    setConfirming(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Link User Account</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Search for an existing Base44 user by email. This will link the user account to the performer profile, enabling dashboard access.
          </p>
          
          <div className="flex gap-2">
            <Input
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              placeholder="user@example.com"
              disabled={confirming}
            />
            <Button onClick={() => handleSearch(searchEmail)} disabled={loading || confirming}>
              <Search className="w-4 h-4 mr-2" />
              {loading ? "Searching..." : "Search"}
            </Button>
          </div>

          {error && (
            <div className="text-sm text-red-500 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> {error}
            </div>
          )}

          {foundUser && !confirming && (
            <div className="bg-secondary p-4 rounded-lg space-y-3">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">{foundUser.full_name}</p>
                  <p className="text-sm text-muted-foreground">{foundUser.email}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Role: {foundUser.role || 'user'}
                  </p>
                </div>
              </div>
              
              {selectedApp?.performer_id && (
                <div className="text-xs text-muted-foreground bg-background p-2 rounded">
                  <p><strong>Performer:</strong> {selectedApp.applicant_name}</p>
                  <p><strong>Application:</strong> {selectedApp.id}</p>
                </div>
              )}
            </div>
          )}

          {foundUser && confirming && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                <p className="font-semibold">Confirm User Link</p>
              </div>
              <p className="text-sm">
                You are about to link <strong>{foundUser.full_name}</strong> ({foundUser.email}) to performer <strong>{selectedApp?.applicant_name}</strong>.
              </p>
              <p className="text-xs text-muted-foreground">
                This action can be reversed by an admin, but will affect the performer's dashboard access.
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          {!confirming ? (
            <>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={handleConfirmLink} disabled={!foundUser}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Link User
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleCancelConfirm}>Cancel</Button>
              <Button onClick={() => onLink(foundUser.id)} variant="default">
                Confirm Link
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}