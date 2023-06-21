export type DataInputModel = any;

export class DataInputSubmitModel {
  acn: string;
  markerLabel: string;
  unitOfMarker: string;
  correlation: {
    x: number[];
    y: number[];
  };
  correlationReexamination: {
    x: number[];
    y: number[];
  };
}
