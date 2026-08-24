import { useState } from "react";
import DashboardHeader from "../components/DashboardHeader";
import CreateOrganizationModal from "../components/organization/CreateOrganizationModal";

export const DashboardPage = () => {
  const [isCreateOrgOpen, setIsCreateOrgOpen] = useState(false);

  return (
    <div style={{ padding: "16px 24px" }}>
      <DashboardHeader onSelectOrganization={() => setIsCreateOrgOpen(true)} />

      <CreateOrganizationModal
        isOpen={isCreateOrgOpen}
        onClose={() => setIsCreateOrgOpen(false)}
      />
    </div>
  );
};

export default DashboardPage;
