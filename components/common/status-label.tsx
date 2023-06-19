interface statusType {
  status: 'Draft' | 'Success' | 'Completed' | 'Failed';
  className: string;
}
const reportStatuses: statusType[] = [
  {
    status: 'Draft',
    className: 'draft-status-label',
  },
  {
    status: 'Success',
    className: 'success-status-label',
  },
  {
    status: 'Completed',
    className: 'success-status-label',
  },
  {
    status: 'Failed',
    className: 'failed-status-label',
  },
];

export default function RocStatusLabel({
  Status,
}: {
  Status: statusType['status'];
}) {
  const currentStatus = reportStatuses.find((x) => x.status === Status);
  return <div className={currentStatus.className}>{currentStatus.status}</div>;
}
