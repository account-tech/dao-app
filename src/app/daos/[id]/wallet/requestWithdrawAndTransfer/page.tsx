'use client';

import { Suspense } from "react";
import WithdrawAndTransferView from './components/WithdrawAndTransferView';
import Loading from './loading';

export default function WithdrawAndTransferPage() {
  return (
    <>
      <Suspense fallback={<Loading />}>
        <WithdrawAndTransferView />
      </Suspense>
    </>
  );
}
