export class DataSourceModel {
  id: string;
  name: string;
  hospitalName: string;
  labName: string;
  instrument: string;
  unitOfInstrument: string;
  validationTests: ValidationTestModel[];
  createdAt: string | Date;
  updatedAt: string | Date;
  status: 'Draft' | 'Completed';
}

export class ValidationTestModel {
  code: string;
  name: string;
}
