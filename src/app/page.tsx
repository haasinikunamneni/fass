import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/sections/Hero";
import GemstoneExhibit from "@/components/sections/GemstoneExhibit";

export default function Home() {
  return (
    <>
      <Navbar />
      <main id="main">
        <Hero />
        <GemstoneExhibit />
      </main>
    </>
  );
}
