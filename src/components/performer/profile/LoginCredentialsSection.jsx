import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { 
  Shield, 
  AlertTriangle, 
  Eye, 
  EyeOff, 
  KeyRound,
  RefreshCcw
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function LoginCredentialsSection({ performer }) {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [temporaryPassword, setTemporaryPassword] = useState(null);

  // Fetch login info
  const { data: loginData, isLoading, refetch } = useQuery({
    queryKey: ['performer-login-info', performer.id],
    queryFn: async () => {
      const res = await base44.functions.invoke("performerPasswordService", {
        action: 'get_performer_login_info',
        performer_id: performer.id
      });
      return res.data;
    }
  });

  const loginInfo = loginData?.login_info || {};
  const hasLogin = !!loginInfo.username;

  // Create login mutation
  const createLogin = useMutation({
    mutationFn: async (data) => {
      const res = await base44.functions.invoke("performerPasswordService", {
        action: 'create_login',
        performer_id: performer.id,
        ...data
      });
      return res.data;
    },
    onSuccess: (data) => {
      if (data.success) {
        setTemporaryPassword(data.temporary_password);
        queryClient.invalidateQueries(['performer-login-info']);
        toast.success("Login credentials created");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create login");
    }
  });

  // Reset password mutation
  const resetPassword = useMutation({
    mutationFn: async (data) => {
      const res = await base44.functions.invoke("performerPasswordService", {
        action: 'reset_password',
        performer_id: performer.id,
        ...data
      });
      return res.data;
    },
    onSuccess: (data) => {
      if (data.success) {
        setTemporaryPassword(data.temporary_password);
        queryClient.invalidateQueries(['performer-login-info']);
        toast.success("Password reset successfully");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to reset password");
    }
  });

  // Toggle login mutation
  const toggleLogin = useMutation({
    mutationFn: async (enable) => {
      const res = await base44.functions.invoke("performerPasswordService", {
        action: enable ? 'enable_login' : 'disable_login',
        performer_id: performer.id
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['performer-login-info']);
      toast.success(`Login ${loginInfo.login_enabled ? 'disabled' : 'enabled'}`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update login status");
    }
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Login Credentials</h3>
        </div>
        {hasLogin && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowResetModal(true)}
          >
            <RefreshCcw className="w-4 h-4 mr-2" />
            Reset Password
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          Loading login information...
        </div>
      ) : loginInfo ? (
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          {hasLogin ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Username</p>
                  <p className="text-sm font-mono text-foreground">{loginInfo.username}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Password</p>
                  <p className="text-sm font-mono text-foreground">••••••••••••</p>
                  <p className="text-xs text-muted-foreground mt-1">Never displayed for security</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Login Enabled</p>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded ${
                      loginInfo.login_enabled 
                        ? "bg-green-500/20 text-green-400" 
                        : "bg-red-500/20 text-red-400"
                    }`}>
                      {loginInfo.login_enabled ? "Enabled" : "Disabled"}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleLogin.mutate(!loginInfo.login_enabled)}
                      className="h-6 text-xs"
                    >
                      {loginInfo.login_enabled ? "Disable" : "Enable"}
                    </Button>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Must Change Password</p>
                  <span className={`text-xs px-2 py-1 rounded ${
                    loginInfo.must_change_password 
                      ? "bg-yellow-500/20 text-yellow-400" 
                      : "bg-green-500/20 text-green-400"
                  }`}>
                    {loginInfo.must_change_password ? "Yes (Next Login)" : "No"}
                  </span>
                </div>
              </div>

              {loginInfo.last_login_at && (
                <div className="pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-1">Last Login</p>
                  <p className="text-sm text-foreground">
                    {new Date(loginInfo.last_login_at).toLocaleString()}
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5" />
                <p className="text-xs text-yellow-200">
                  This performer has no login credentials. Create a username and temporary password to enable dashboard access.
                </p>
              </div>
            </div>
          )}

          {!hasLogin && (
            <Button onClick={() => setShowCreateModal(true)} className="w-full">
              Create Login Credentials
            </Button>
          )}
        </div>
      ) : null}

      {/* Create Login Modal */}
      {showCreateModal && (
        <CreateLoginModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={(data) => createLogin.mutate(data)}
          isLoading={createLogin.isPending}
          temporaryPassword={temporaryPassword}
          onPasswordShown={() => {
            setTemporaryPassword(null);
            setShowCreateModal(false);
          }}
        />
      )}

      {/* Reset Password Modal */}
      {showResetModal && (
        <ResetPasswordModal
          onClose={() => setShowResetModal(false)}
          onSubmit={(data) => resetPassword.mutate(data)}
          isLoading={resetPassword.isPending}
          temporaryPassword={temporaryPassword}
          onPasswordShown={() => {
            setTemporaryPassword(null);
            setShowResetModal(false);
          }}
        />
      )}
    </div>
  );
}

function CreateLoginModal({ onClose, onSubmit, isLoading, temporaryPassword, onPasswordShown }) {
  const [formData, setFormData] = useState({
    username: "",
    initial_password: "",
    confirm_password: "",
    enable_login: true
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.initial_password !== formData.confirm_password) {
      toast.error("Passwords do not match");
      return;
    }
    if (formData.initial_password.length < 10) {
      toast.error("Password must be at least 10 characters");
      return;
    }
    onSubmit(formData);
  };

  // Show temporary password only once
  if (temporaryPassword) {
    return (
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-500" />
            Login Created Successfully
          </DialogTitle>
          <DialogDescription>
            Temporary password shown below. Copy it now - it will never be displayed again.
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 my-4">
          <p className="text-xs text-yellow-200 mb-2 font-semibold">
            ⚠️ IMPORTANT: Copy this password now
          </p>
          <div className="bg-background rounded p-3 font-mono text-lg text-center tracking-wider">
            {temporaryPassword}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            After you close this modal, the password will only show as •••••••• for security.
            The performer must change this password on first login.
          </p>
        </div>

        <DialogFooter>
          <Button onClick={onPasswordShown} variant="default">
            I've Copied the Password
          </Button>
        </DialogFooter>
      </DialogContent>
    );
  }

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Create Performer Login</DialogTitle>
        <DialogDescription>
          Create secure login credentials. Password will be hashed and never stored in plaintext.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Username</label>
          <Input
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            placeholder="Enter username"
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Temporary Password</label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              value={formData.initial_password}
              onChange={(e) => setFormData({ ...formData, initial_password: e.target.value })}
              placeholder="Min 10 characters"
              required
              minLength={10}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Minimum 10 characters. Performer will be required to change on first login.
          </p>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Confirm Password</label>
          <Input
            type="password"
            value={formData.confirm_password}
            onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
            placeholder="Confirm password"
            required
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Creating..." : "Create Login"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function ResetPasswordModal({ onClose, onSubmit, isLoading, temporaryPassword, onPasswordShown }) {
  const [formData, setFormData] = useState({
    initial_password: "",
    confirm_password: ""
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.initial_password !== formData.confirm_password) {
      toast.error("Passwords do not match");
      return;
    }
    if (formData.initial_password.length < 10) {
      toast.error("Password must be at least 10 characters");
      return;
    }
    onSubmit(formData);
  };

  // Show temporary password only once
  if (temporaryPassword) {
    return (
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-500" />
            Password Reset Successfully
          </DialogTitle>
          <DialogDescription>
            Temporary password shown below. Copy it now - it will never be displayed again.
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 my-4">
          <p className="text-xs text-yellow-200 mb-2 font-semibold">
            ⚠️ IMPORTANT: Copy this password now
          </p>
          <div className="bg-background rounded p-3 font-mono text-lg text-center tracking-wider">
            {temporaryPassword}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            After you close this modal, the password will only show as •••••••• for security.
            The performer must change this password on next login.
          </p>
        </div>

        <DialogFooter>
          <Button onClick={onPasswordShown} variant="default">
            I've Copied the Password
          </Button>
        </DialogFooter>
      </DialogContent>
    );
  }

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Reset Performer Password</DialogTitle>
        <DialogDescription>
          Set a new temporary password. The old password will be invalidated immediately.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">New Temporary Password</label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              value={formData.initial_password}
              onChange={(e) => setFormData({ ...formData, initial_password: e.target.value })}
              placeholder="Min 10 characters"
              required
              minLength={10}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Minimum 10 characters. Performer will be required to change on next login.
          </p>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Confirm Password</label>
          <Input
            type="password"
            value={formData.confirm_password}
            onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
            placeholder="Confirm password"
            required
          />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Resetting..." : "Reset Password"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}