export class ReportWorkflowStep {
  stepNo: number;
  name: string;
  workflowState:
    | 'ValidationTestSelected'
    | 'IntrumentDataSelected'
    | 'ConditionalInputAdded'
    | 'DataInputAdded'
    | 'OutputSettingAdded'
    | 'ReportGenerated';
  isFinished: boolean;
  active: boolean;
}
