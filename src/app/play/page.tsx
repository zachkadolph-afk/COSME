import { playableCards } from "@/lib/cards";
import { Battle } from "./Battle";

export const metadata = { title: "Play online · COSME" };
export const revalidate = 300;

export default async function PlayPage() {
  const cards = await playableCards();
  return <Battle pool={cards} />;
}
