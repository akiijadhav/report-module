export class DataSetFieldsDetail {
  dataSetId: string;
  fields: MarkerRecordFieldDetail[];
}

export class MarkerRecordFieldDetail {
  name: string;
  displayName: string;
  type: 'Primitive' | 'Entity';
  dataType: 'text' | 'number' | 'Class' | '';
  properties: FieldAttributeDetail[];
  sequenceNo?: number;
}

export class FieldAttributeDetail {
  name: string;
  displayName: string;
  dataType: 'text' | 'number' | 'Class';
  dependentAttributes: string[] | null;
}
