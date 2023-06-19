export class DataSourceDetail {
  id: string;
  name: string;
  hospitalName: string;
  labName: string;
  instrumentName: string;
  unitOfInstrument: string;
  validationTests: ValidationTestDetail[];
  dataSets: DatasetDetail[];
  testDataFiles: DataSourceFileDetail[];
}

export class ValidationTestDetail {
  id?: string;
  code: string;
  name: string;
  description?: string;
}

export class DatasetDetail {
  id: string;
  name: string;
  testDataFileId?: string;
  modules?: ModuleGroupDetail[];
  validationTestFamily?: string;
  markerRecords?: markerRecordsDetails[];
}

export class markerRecordsDetails {
  id: string;
  marker_id: string;
  marker_code: string;
  marker_label: string;
  selected: boolean;
}

export class DataSourceFileDetail {
  id: string;
  name: string;
}
export class ModuleGroupDetail {
  name: string;
  number: number;
}
