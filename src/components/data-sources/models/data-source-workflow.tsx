export class DataSourcetWorkflowStep {
  stepNo: number;
  name: string;
  workflowState:
    | 'ValidationTestSelection'
    | 'DataSourceMappping'
    | 'ReviewMarkers'
    | 'ConditionalInput'
    | 'DataInput';
  isFinished: boolean;
  active: boolean;
}
