import ProductionCompatibilityTab from "./ProductionCompatibilityTab";
import GuestProductionCompatibilityCheck from "./GuestProductionCompatibilityCheck";

export default function ProductionTab({ performer }) {
  const performerId = performer?.id;

  if (!performerId) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No performer selected</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Production Compatibility Profile</h2>
        <ProductionCompatibilityTab performerId={performerId} />
      </div>

      <div className="border-t pt-6">
        <GuestProductionCompatibilityCheck performer={performer} />
      </div>
    </div>
  );
}