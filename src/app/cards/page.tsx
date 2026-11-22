import { libraryCards } from "@/lib/cards";
import { CardLibrary } from "./CardLibrary";

export const revalidate = 120;
export const metadata = { title: "Card library · COSME" };

export default async function CardsPage() {
  const cards = await libraryCards();
  return (
    <div className="wrap stack-lg" style={{ paddingBottom: 32 }}>
      <div className="stack">
        <h1>Card library</h1>
        <p className="lead">Every card in the game has its own number. Cards never show who made them.</p>
      </div>
      <CardLibrary cards={cards} />
    </div>
  );
}
