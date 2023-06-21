import React, { useEffect } from 'react';

export default function useFixedHeader(
  tablePageIndex: number,
  element: HTMLElement | null,
) {
  if (typeof window === 'undefined') return;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const tableWrapper = document.querySelector(
      '.custom-input-table-container',
    );
    const table: HTMLElement = document.querySelector('.vertical-table');
    if (!table) return;
    const tableBody: HTMLElement = table.querySelector('tbody');
    const firstRowEls = tableBody.querySelectorAll('.first-row');
    const secondRowEls = tableBody.querySelectorAll('.second-row');
    const thirdRowEls = tableBody.querySelectorAll('.third-row');
    const fourthRowEls = tableBody.querySelectorAll('.fourth-row');

    if (firstRowEls[0]) {
      firstRowEls.forEach((el) => el.classList.remove('row-translator'));
      secondRowEls.forEach((el) => el.classList.remove('row-translator'));
      thirdRowEls.forEach((el) => el.classList.remove('row-translator'));
      fourthRowEls.forEach((el) => el.classList.remove('row-translator'));

      const translate = () => {
        if (tableWrapper && firstRowEls[0]) {
          const scroll = table.scrollTop;
          if (scroll) {
            table.style.setProperty('--top-offset', String(scroll) + 'px');
            firstRowEls.forEach((el) => el.classList.add('row-translator'));
            secondRowEls.forEach((el) => el.classList.add('row-translator'));
            thirdRowEls.forEach((el) => el.classList.add('row-translator'));
            fourthRowEls.forEach((el) => el.classList.add('row-translator'));
          } else {
            firstRowEls.forEach((el) => el.classList.remove('row-translator'));
            secondRowEls.forEach((el) => el.classList.remove('row-translator'));
            thirdRowEls.forEach((el) => el.classList.remove('row-translator'));
            fourthRowEls.forEach((el) => el.classList.remove('row-translator'));
          }
        }
      };

      table.addEventListener('scroll', translate);

      return () => {
        table.removeEventListener('scroll', translate);
        firstRowEls.forEach((el) => el.classList.remove('row-translator'));
        secondRowEls.forEach((el) => el.classList.remove('row-translator'));
        thirdRowEls.forEach((el) => el.classList.remove('row-translator'));
        fourthRowEls.forEach((el) => el.classList.remove('row-translator'));
      };
    }

    return () => {
      firstRowEls.forEach((el) => el.classList.remove('row-translator'));
      secondRowEls.forEach((el) => el.classList.remove('row-translator'));
      thirdRowEls.forEach((el) => el.classList.remove('row-translator'));
      fourthRowEls.forEach((el) => el.classList.remove('row-translator'));
    };
  }, [tablePageIndex, element]);
}
