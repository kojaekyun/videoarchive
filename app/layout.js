export const metadata = {
  title: "Video Archive Dashboard",
  description: "Google Sheets Test",
};

import "./globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>
        {children}
      </body>
    </html>
  );
}
