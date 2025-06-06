import type { AppProps } from "next/app";
import Navbar from "@/components/Navbar";
import "../app/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Navbar />
      <Component {...pageProps} />
    </>
  );
}
