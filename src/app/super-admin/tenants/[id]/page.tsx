import TenantDetailsView from "./tenant-details-view";

export const metadata = {
  title: "Church Management | Church OS Admin",
  description: "Granular control over church configuration, users, and AI strategy."
};

// Required for static export with dynamic routes
export async function generateStaticParams() {
  // We don't pre-render specific tenants at build time; 
  // they resolve dynamically on the client by ID.
  return [];
}

export default function TenantDetailsPage() {
  return <TenantDetailsView />;
}
