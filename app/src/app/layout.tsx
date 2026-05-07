export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { D } from "@/lib/design-tokens";
import ThemeRegistry from "@/components/ThemeRegistry";

export const metadata: Metadata = {
  title: "JMC HRD",
  description: "Sistem pengelolaan data pegawai JMC",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <link rel="icon" type="image/png" href="/images/logo.png" />
        <style>{`
          .MuiDataGrid-root {
            border: 1px solid ${D.hairline} !important;
            border-radius: 18px !important;
            background-color: ${D.canvas} !important;
            font-size: 13px !important;
          }
          .MuiDataGrid-columnHeaders {
            background-color: ${D.canvasParchment} !important;
            border-bottom: 1px solid ${D.hairline} !important;
            font-size: 11px !important;
            font-weight: 600 !important;
            color: ${D.inkMuted48} !important;
            letter-spacing: 0.04em !important;
            text-transform: uppercase !important;
          }
          .MuiDataGrid-row:hover { background-color: ${D.canvasParchment} !important; }
          .MuiDataGrid-cell { border-color: ${D.hairline} !important; }
          .MuiDataGrid-footerContainer {
            border-top: 1px solid ${D.hairline} !important;
            background-color: ${D.canvasParchment} !important;
          }
          .MuiDataGrid-virtualScroller { background-color: ${D.canvas} !important; }
        `}</style>
      </head>
      <body>
        <ThemeRegistry>
          {children}
        </ThemeRegistry>
      </body>
    </html>
  );
}
