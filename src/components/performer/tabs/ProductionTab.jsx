import ProductionCompatibilityTab from "./ProductionCompatibilityTab";

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
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Production Compatibility Profile</h2>
      <ProductionCompatibilityTab performerId={performerId} />
    </div>
  );
}