export class ConditionInputDataModel {
  acn: string;
  markerLabel: string;
  unitOfMarker: string;
  reagent: ReagentDataModel;
  formation: FormationDataModel;
  dilutedSolution: DilutedSolutionDataModel;
  calbrationResults: CalbrationResultsDataModel;
  controlIm: ControlImDataModel;
  controlCc: ControlCcDataModel;
  linearity5?: LinearityConditionalInputDataModel;
  linearity10?: LinearityConditionalInputDataModel;
}

export class ReagentDataModel {
  unifiedProductCode: string;
  reagentName: string;
  lotNo: string;
  expiryDate: Date | string;
}
export class FormationDataModel {
  unifiedProductCode: string;
  calibrator: string;
  lotNo: string;
  expiryDate: Date | string;
}
export class DilutedSolutionDataModel {
  unifiedProductCode: string;
  dilutedSolution: string;
  lotNo: string;
  expiryDate: Date | string;
}
export class CalbrationResultsDataModel {
  s1SampleName: string;
  displayValue1: string;
  s2SampleName: string;
  displayValue2: string;
  s3SampleName: string;
  displayValue3: string;
  s4SampleName: string;
  displayValue4: string;
  s5SampleName: string;
  displayValue5: string;
  s6SampleName: string;
  displayValue6: string;
}
export class ControlImDataModel {
  unifiedProductCode: string;
  controlName: string;
  controlAbbreviation: string;
  lotNo: string;
  expiryDate: Date | string;
  vialName1: string;
  vialLot1: string;
  vialName2: string;
  vialLot2: string;
  vialName3: string;
  vialLot3: string;
}
export class ControlCcDataModel {
  unifiedProduct1: string;
  controlName1: string;
  controlAbbreviation1: string;
  lotNo1: string;
  expiryDate1: Date | string;
  unifiedProduct2: string;
  controlName2: string;
  controlAbbreviation2: string;
  lotNo2: string;
  expiryDate2: Date | string;
  unifiedProduct3: string;
  controlName3: string;
  controlAbbreviation3: string;
  lotNo3: string;
  expiryDate3: Date | string;
}

export class LinearityConditionalInputSample {
  name: string;
  dilutedSolution: string;
  description: string;
}

export class LinearityConditionalInputDataModel {
  s1: LinearityConditionalInputSample;
  s2: LinearityConditionalInputSample;
  s3: LinearityConditionalInputSample;
  s4: LinearityConditionalInputSample;
}
