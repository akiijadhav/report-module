export class ReportWorkflowStep {
  stepNo: number;
  name: string;
  workflowState:
    | 'ReportConfigurationAdded'
    | 'ValidationTestSelected'
    | 'MarkerSelected'
    | 'DataSourceForGraphAdded'
    | 'ReportGenerated';
  isFinished: boolean;
  active: boolean;
}
