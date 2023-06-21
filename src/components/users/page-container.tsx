import { ReactElement } from 'react';
import PageContent from './page-content';

export default function PageContainer({
  children,
}: {
  children: ReactElement | ReactElement[];
}) {
  return (
    <>
      <PageContent>{children}</PageContent>
    </>
  );
}
