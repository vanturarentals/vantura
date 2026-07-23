import OpsHandoverClient from "@/components/OpsHandoverClient";
import { opsConfig } from "@/lib/config";
import { isOpsAuthenticated } from "@/lib/ops-auth";

export const dynamic = "force-dynamic";

export default async function OpsHandoverPage() {
  const authenticated = await isOpsAuthenticated();

  return (
    <div className="min-h-screen bg-surface">
      <OpsHandoverClient
        authenticated={authenticated}
        pinConfigured={opsConfig.isConfigured}
      />
    </div>
  );
}
