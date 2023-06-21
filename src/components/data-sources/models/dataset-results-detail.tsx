import { MarkerInfo } from './dataset-records-detail';

export class ResultDetail {
  id: string;
  marker: MarkerInfo;
  [key: string]: any;
}

export class DataInputReducerAction {
  type: 'PUSH' | 'UPDATE' | 'SET' | 'PUT-ARRAY';
  dataSetId?: string;
  testFamily?: string;
  pushPayload?: ResultDetail[];
  setPayload?: ResultDetail[];
  resultId?: string;
  putArray?: number[];
  columnId?: string;
  value?: string | number | null;
  isArray?: boolean;
  groupName?: string;
  groupDisplayName?: string;
}

export class DataSetResultLinkDetail {
  dataSetId: string;
  dataSetName: string;
  resultIDs: string[];
}

export class DataSetResultLinkAction {
  type: 'PUSH';
  dataSetId?: string;
  pushPayload?: DataSetResultLinkDetail;
}
