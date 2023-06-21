export interface rowInterface {
  Id: string | number;
  Email: string;
  Name: string;
  Role: string;
  Status: 'Active' | 'Inactive' | 'Blocked' | 'Created';
  Contact?: string | number;
  AccessKey: string;
  ProfilePhoto?: string;
}
