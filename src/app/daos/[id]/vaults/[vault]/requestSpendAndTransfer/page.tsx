'use client';

import { Suspense } from "react";
import SpendAndTransferView from './components/SpendAndTransferView';
import Loading from './loading';

export default function WithdrawAndTransferPage() {
  return (
    <>
      <Suspense fallback={<Loading />}>
        <SpendAndTransferView />
      </Suspense>
    </>
  );
}
