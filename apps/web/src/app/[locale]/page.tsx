import { setRequestLocale } from "next-intl/server";
import { HeroJourney } from "@/components/journey/hero";
import { BoardingPasses } from "@/components/journey/boarding-passes";
import { PhoneStory } from "@/components/journey/phone-story";
import { FlightSearch } from "@/components/journey/flight-search";
import { FidelField } from "@/components/journey/fidel-field";
import { BigStats, PassportFinale, ScrollProgress } from "@/components/journey/finale";

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    // Full-bleed cinematic landing: break out of the layout's max-width container.
    <div className="landing relative -my-8 mx-[calc(50%-50vw)] bg-[#050b16]">
      <ScrollProgress />
      <HeroJourney />
      <BoardingPasses />
      <PhoneStory />
      <FlightSearch />
      <FidelField />
      <BigStats />
      <PassportFinale />
    </div>
  );
}
