export class DataSetGroupsDetail {
  dataSetId: string;
  dataSetName?: string;
  groups: DataInputGroupDetail[];
}

export class DataInputGroupDetail {
  id: number;
  name: string;
  displayName: string;
  selected: boolean;
}

export class DataSetGroupsAction {
  type: 'SET' | 'PUSH' | 'REPLACE';
  setPayload?: DataSetGroupsDetail[];
  pushPayload?: DataSetGroupsDetail;
  replacePayload?: DataSetGroupsDetail;
}

export class SelectedGroupDetail {
  recordID: string;
  groupName: string;
  groupDisplayName: string;
}
