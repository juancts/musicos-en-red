import Script from "next/script";

const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
const apiHost = process.env.NEXT_PUBLIC_PLAUSIBLE_API_HOST ?? "https://plausible.io";

export default function PlausibleAnalytics() {
  if (!domain) {
    return null;
  }

  return (
    <Script
      defer
      data-domain={domain}
      src={`${apiHost}/js/script.js`}
      strategy="afterInteractive"
    />
  );
}
