export class ReportDetail {
  id: string;
  name: string;
  status: string;
  workflowStatus: string;
  validationTests: string[];
  module: string[];
  moduleNumber: string;
  unitOfInstrument: string;
  instrument: string;
  inputFile: {
    name: string;
  };
  conditionalInputData: any;
  testDataInput: any;
}
