"use client";

import { ConvexReactClient, ConvexProvider } from "convex/react";
import { ReactNode, useMemo } from "react";

export function AppConvexProvider({ children }: { children: ReactNode }) {
  const convex = useMemo(() => {
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    // #region agent log
    fetch('http://127.0.0.1:7322/ingest/51b55f45-c3d4-4b7e-87ce-267cceb9bc9c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'2615d5'},body:JSON.stringify({sessionId:'2615d5',runId:'pre-fix',hypothesisId:'H2',location:'components/convex-provider.tsx:10',message:'Convex provider init',data:{hasConvexUrl:Boolean(convexUrl)},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    if (!convexUrl) {
      // #region agent log
      fetch('http://127.0.0.1:7322/ingest/51b55f45-c3d4-4b7e-87ce-267cceb9bc9c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'2615d5'},body:JSON.stringify({sessionId:'2615d5',runId:'pre-fix',hypothesisId:'H2',location:'components/convex-provider.tsx:13',message:'Missing NEXT_PUBLIC_CONVEX_URL',data:{reason:'env_missing'},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      throw new Error("NEXT_PUBLIC_CONVEX_URL is required");
    }
    return new ConvexReactClient(convexUrl);
  }, []);

  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
