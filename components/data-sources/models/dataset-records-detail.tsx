export class DataSetRecordsDetail {
  id: string;
  marker: MarkerInfo;
  [key: string]: any;
}

export class MarkerInfo {
  acn: string;
  unit: string;
  label: string;
  category: string;
}

export class DataReducerAction {
  type: 'PUSH' | 'UPDATE';
  pushPayload?: DataSetRecordsDetail[];
  markerRecordId?: string;
  columnId?: string;
  value?: string | number | null;
  groupName?: string;
}

export class DataSetMarkerLinkDetail {
  dataSetId: string;
  dataSetName?: string;
  recordIDs: string[];
}

export class DataSetMarkerLinkAction {
  type: 'PUSH';
  dataSetId?: string;
  pushPayload?: DataSetMarkerLinkDetail;
}
