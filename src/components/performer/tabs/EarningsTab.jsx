import AdminEarningsTab from '@/components/admin/PerformerEarningsTab';

export default function EarningsTab({ performer }) {
  return (
    <AdminEarningsTab
      performerId={performer.id}
      performerName={performer.display_name}
    />
  );
}