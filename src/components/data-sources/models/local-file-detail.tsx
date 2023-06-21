export class LocalFileDetail {
  id?: string;
  name: string;
  datasets?: string[];
  error: boolean | string;
  uploaded: boolean;
  isUploading: boolean;
  toUpload?: boolean;
  file?: File;
  localId?: string;
  toDelete?: boolean;
  isDeleting?: boolean;
  invalidACNCodes?: string[];
}
