'use client';

import { Suspense } from "react";
import SpendAndTransferView from './components/SpendAndTransferView';
import Loading from './loading';

export default function SpendAndTransferPage() {
  return (
    <>
      <Suspense fallback={<Loading />}>
        <SpendAndTransferView />
      </Suspense>
    </>
  );
}
