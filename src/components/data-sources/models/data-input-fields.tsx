export class DataInputFieldsDetail {
  dataSetId: string;
  fields: ResultFieldDetail[];
}

export class ResultFieldDetail {
  name: string;
  displayName: string;
  groupName: string;
  groupDisplayName: string;
  dataType: 'string' | 'array' | 'number' | '';
  size?: number;
  dataSetName?: string;
  disableDataMapping?: boolean;
  sequenceNo?: number;
  firstLevel?: boolean;
}
