import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import PersonalProfileSection from "./PersonalProfileSection";
import PayoutMethodSection from "./PayoutMethodSection";
import PayoutRequestsSection from "./PayoutRequestsSection";
import IdentityVerificationTab from "./IdentityVerificationTab";

export default function ProfileAndPayoutTab({ performer, performerToken }) {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await base44.functions.invoke("getPerformerProfilePrivate", {});
      if (res.data.success) {
        setProfileData(res.data);
      }
    } catch (error) {
      console.error("Failed to load profile:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Personal Profile</TabsTrigger>
          <TabsTrigger value="identity">Identity Verification</TabsTrigger>
          <TabsTrigger value="payout-method">Payout Method</TabsTrigger>
          <TabsTrigger value="payout-requests">Payout Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <PersonalProfileSection 
            profile={profileData?.profile}
            performer={profileData?.performer}
            onProfileUpdated={loadProfile}
            performerId={performer?.performer?.id}
            performerToken={performerToken}
          />
        </TabsContent>

        <TabsContent value="identity" className="mt-6">
          <IdentityVerificationTab />
        </TabsContent>

        <TabsContent value="payout-method" className="mt-6">
          <PayoutMethodSection 
            profile={profileData?.profile}
            onPayoutUpdated={loadProfile}
            performerId={performer?.performer?.id}
            performerToken={performerToken}
          />
        </TabsContent>

        <TabsContent value="payout-requests" className="mt-6">
          <PayoutRequestsSection 
            onPayoutCreated={loadProfile}
            performerId={performer?.performer?.id}
            performerToken={performerToken}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}