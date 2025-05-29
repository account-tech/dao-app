'use client';

import { Suspense } from "react";
import WithdrawAndTransferToVaultView from './components/WithdrawAndTransferToVaultView';
import Loading from './loading';

export default function WithdrawAndTransferPage() {
  return (
    <>
      <Suspense fallback={<Loading />}>
        <WithdrawAndTransferToVaultView />
      </Suspense>
    </>
  );
}
