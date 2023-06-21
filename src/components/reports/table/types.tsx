export type ReportType = {
  Id: string;
  Name: string;
  Code?: string;
  Timestamp: Date | string;
  HospitalName: string;
  LabName: string;
  Status: 'Draft' | 'Success' | 'Failed';
};
