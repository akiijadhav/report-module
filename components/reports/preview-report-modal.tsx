import { Dialog } from '@headlessui/react';
import React, { Dispatch, SetStateAction, useState, Fragment } from 'react';
import { ReportType } from './table/types';
import crossIcon from '../../public/icons/cross-icon.svg';
import Image from 'next/image';
import { Document, Page, pdfjs } from 'react-pdf';
import BubbleLoader from '../loading/bubble-loader';
import DisplayPdfError from './common/display-pdf-error';
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

const notoSansFont = 'noto-sans';

export default function PreviewReportModal(props: {
  showPreviewReportModal: {
    show: boolean;
    fileUrl: string;
  };
  setShowPreviewReportModal: Dispatch<
    SetStateAction<{
      show: boolean;
      fileUrl: string;
    }>
  >;
  reportData: ReportType;
}) {
  const { showPreviewReportModal, setShowPreviewReportModal, reportData } =
    props;

  const [numPages, setNumPages] = useState(null);
  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
  }

  return (
    <Dialog
      open={showPreviewReportModal.show}
      onClose={() => setShowPreviewReportModal({ show: false, fileUrl: '' })}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-gray-600/40" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel
          className={`${notoSansFont} min-w-[70vw] max-w-[85vw] bg-white rounded-lg shadow-md`}
        >
          <div className="custom-modal-header">
            <Dialog.Title>{reportData.Name}</Dialog.Title>
            <div
              className="close-icon-wrapper"
              onClick={() =>
                setShowPreviewReportModal({ show: false, fileUrl: '' })
              }
            >
              <Image src={crossIcon} alt="Close view report modal" />
            </div>
          </div>
          <div className="custom-modal-content h-[80vh] overflow-y-auto">
            <Document
              file={showPreviewReportModal.fileUrl}
              className={`w-full h-full flex ${
                numPages ? 'flex-col items-center' : 'justify-center'
              }`}
              loading={BubbleLoader}
              error={() => <DisplayPdfError isPage={false} />}
              onLoadSuccess={onDocumentLoadSuccess}
            >
              {numPages
                ? [...Array(numPages)].map((_, i) => (
                    <Fragment key={'Page' + i}>
                      <Page
                        scale={1.5}
                        pageNumber={i + 1}
                        loading={''}
                        error={() => <DisplayPdfError isPage={true} />}
                        className="border border-gray-300"
                      />
                      <br />
                    </Fragment>
                  ))
                : null}
            </Document>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
