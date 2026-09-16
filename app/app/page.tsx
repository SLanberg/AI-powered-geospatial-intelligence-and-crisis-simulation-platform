import { incidentsService } from "@/backend/services/incidents.service";
import { NeuralCityDashboard } from "@/frontend/components/dashboard/NeuralCityDashboard";
import { Incident } from "@/shared";

export const dynamic = "force-dynamic";

/**
 * Server Component Page Entrypoint
 * Preloads incident state and renders the decomposed client dashboard
 */
export default async function Page() {
  let initialIncidents: Incident[] = [];

  try {
    initialIncidents = await incidentsService.getIncidents();
  } catch (err) {
    console.warn("Failed to preload incidents on server:", err);
  }

  return <NeuralCityDashboard initialIncidents={initialIncidents} />;
}
