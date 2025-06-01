'use client';

import { Suspense } from "react";
import SpendAndAirdropView from './components/SpendAndAirdropView';
import Loading from './loading';

export default function WithdrawAndTransferPage() {
  return (
    <>
      <Suspense fallback={<Loading />}>
        <SpendAndAirdropView />
      </Suspense>
    </>
  );
}
