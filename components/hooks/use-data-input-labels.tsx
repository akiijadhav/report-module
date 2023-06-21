import React, { useCallback, useMemo } from 'react';
import { DataSetNames } from '../data-sources/enums/dataset-names';

function useDataInputLabels() {
  const accuracyCalibrationDisplayData = useMemo(
    () => ({
      s1: [
        'ISE: internal standard liquid electromotive force',
        'ISE: LOW electromotive force',
        'ISE: HIGH liquid electromotive force',
        'ISE: Calibrator liquid electromotive force',
      ],
      s2: [
        'ISE: Slope value',
        'ISE:IS concentration',
        'ISE: Calibrator assumed concentration',
        'ISE: comparison value',
      ],
      s3: ['1-1', '1-2', '2-1', '2-2'],
      s4: ['1-1', '1-2', '2-1', '2-2'],
      s5: ['1-1', '1-2', '2-1', '2-2'],
      s6: ['1-1', '1-2', '2-1', '2-2'],
    }),
    [],
  );

  const getLabels = useCallback(
    function (dataSetName: string, groupName: string, arraySize: number) {
      if (dataSetName === DataSetNames.Correlation) {
        return Array(arraySize || 400)
          .fill(null)
          .map((_, index) => groupName?.at(-1)?.toUpperCase() + (index + 1));
      }
      if (
        dataSetName === DataSetNames.Linearity5 ||
        dataSetName === DataSetNames.Linearity10
      ) {
        return Array(arraySize || 11)
          .fill(null)
          .map((_, index) => `${index}/${arraySize - 1}`);
      }
      if (dataSetName === DataSetNames.Accuracy) {
        return groupName.split('-')?.at(1) === 'cal'
          ? accuracyCalibrationDisplayData[groupName.split('-')?.at(0)]
          : Array(arraySize)
              .fill(null)
              .map((_, index) => `${index + 1}`);
      }
      if (dataSetName === DataSetNames.Repeatability) {
        return Array(arraySize || 30)
          .fill(null)
          .map((_, index) => `${index + 1}`);
      }
      if (dataSetName === DataSetNames.IndoorReproducibility) {
        const labels: string[] = [];
        for (let index = 0; index < arraySize; index++) {
          let dayNumber = 1;
          let toDisplay = `${dayNumber}Day 1 time`;
          if (index > 0) {
            const beforePrevious = labels.at(-2)?.split('D')[0];
            const previous = labels.at(-1)?.split('D')[0];

            if (previous === beforePrevious) {
              dayNumber = Number(previous) + 1;
              toDisplay = `${dayNumber}Day 1 time`;
            } else {
              dayNumber = Number(previous);
              toDisplay = `${dayNumber}Day 2 times`;
            }
          }
          labels.push(toDisplay);
        }
        return labels;
      }
      if (
        dataSetName === DataSetNames.CorrelationQualitative ||
        dataSetName === DataSetNames.XResidual
      ) {
        const isReExam = groupName?.split('-')?.length === 2;
        let labelLetter = isReExam
          ? groupName?.split('-')?.at(0)?.at(-1)
          : groupName?.at(-1);
        labelLetter = labelLetter?.toUpperCase();
        return Array(arraySize || 400)
          .fill(null)
          .map((_, index) => {
            return labelLetter + (index + 1);
          });
      }

      return Array(arraySize)
        .fill(null)
        .map((_, index) => String(index + 1));
    },
    [DataSetNames],
  );

  return getLabels;
}

export default useDataInputLabels;
