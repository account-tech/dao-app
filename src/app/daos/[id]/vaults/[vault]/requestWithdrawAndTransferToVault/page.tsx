'use client';

import { Suspense } from "react";
import WithdrawAndTransferToVaultView from './components/WithdrawAndTransferToVaultView';
import Loading from './loading';

export default function WithdrawAndTransferToVaultPage() {
  return (
    <>
      <Suspense fallback={<Loading />}>
        <WithdrawAndTransferToVaultView />
      </Suspense>
    </>
  );
}
