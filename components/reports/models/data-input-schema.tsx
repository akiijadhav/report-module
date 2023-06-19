export class DataInputTableSchemeDto {
  fields: DataInputFieldDto[];
  fieldGroups: DataInputFieldGroupDto[];
  datasets: DataInputFieldDatasetDto[];
}

export class DataInputFieldDto {
  name: string;
  displayName: string;
  groupName: string;
  groupDisplayName: string;
  readonly: boolean;
  dataType: 'string' | 'array' | 'number';
  size: number;
  datasetName: string;
  sequenceNo: number;
}

export class DataInputFieldGroupDto {
  name: string;
  groupDisplayName: string;
  datasetName: string;
}

export class DataInputFieldDatasetDto {
  name: string;
  displayName: string;
}
