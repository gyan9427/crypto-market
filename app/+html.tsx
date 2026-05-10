import type { PropsWithChildren } from 'react';
import { ScrollViewStyleReset } from 'expo-router/html';

/** Chromium / Safari default focus-visible rings render as bold outlines around RN Web `<input>` */
const RN_WEB_INPUT_FOCUS_RING_RESET = `
  input:focus,
  input:focus-visible,
  input:active,
  textarea:focus,
  textarea:focus-visible,
  textarea:active {
    outline: none !important;
    outline-width: 0 !important;
    box-shadow: none !important;
  }
`;

/** Root HTML for web builds only (Expo Router +html convention). */
export default function HtmlRoot({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: RN_WEB_INPUT_FOCUS_RING_RESET }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
