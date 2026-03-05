export const metadata = {
  title: "My Ad Archive",
  description: "Google Sheets Test",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>
        {children}
      </body>
    </html>
  );
}
