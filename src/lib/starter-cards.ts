import type { CardType } from "./game";

export type StarterCard = {
  number: number;
  name: string;
  type: CardType;
  move: string;
  description: string;
  total?: number;
  weaknesses?: CardType[]; // only for special cards that break the type chart
  rarity?: "common" | "rare" | "shiny";
  art?: string;
};

// The 36 starter cards Zach and Wyatt designed. Names and moves are theirs to change.
const CARDS: StarterCard[] = [
  { number: 1, name: "Captain Storm", type: "Lightning", move: "Cloud Rider", description: "Surfs a thundercloud and throws lightning bolts from above.", rarity: "shiny" },
  { number: 2, name: "Blaze Knight", type: "Fire", move: "Fire Comet", description: "Spins in a circle and throws a giant fireball." },
  { number: 3, name: "Frostbyte", type: "Ice", move: "Blizzard Wall", description: "The ice king. Freezes lightning in midair.", rarity: "rare" },
  { number: 4, name: "Volt Viper", type: "Lightning", move: "Chain Zap", description: "One bolt bounces from enemy to enemy." },
  { number: 5, name: "Spark Pup", type: "Lightning", move: "Static Pounce", description: "A lightning puppy with sparky fur." },
  { number: 6, name: "Ember Fox", type: "Fire", move: "Flame Dash", description: "Leaves a trail of fire behind its tail." },
  { number: 7, name: "Magma Mole", type: "Fire", move: "Lava Tunnel", description: "Tunnels straight through lava." },
  { number: 8, name: "Glacier Yeti", type: "Ice", move: "Snowball Avalanche", description: "Throws snowballs the size of cars." },
  { number: 9, name: "Tide Turtle", type: "Water", move: "Shell Wave", description: "Rides a giant wave on its shell." },
  { number: 10, name: "Captain Splash", type: "Water", move: "Geyser Blast", description: "Shoots water straight up from the ground." },
  { number: 11, name: "Bubble Ray", type: "Water", move: "Bubble Trap", description: "Traps enemies in giant bubbles." },
  { number: 12, name: "Thornback", type: "Plant", move: "Vine Whip", description: "Covered in spiky thorns." },
  { number: 13, name: "Mossy Golem", type: "Plant", move: "Root Stomp", description: "A walking pile of moss and stone." },
  { number: 14, name: "Petal Sprite", type: "Plant", move: "Pollen Storm", description: "A tiny flower fairy with a big sneeze." },
  { number: 15, name: "Gust Hawk", type: "Wind", move: "Dive Bomb", description: "Dives so fast it makes a sonic boom." },
  { number: 16, name: "Cyclone Kid", type: "Wind", move: "Tornado Spin", description: "Spins into a tornado." },
  { number: 17, name: "Iron Rhino", type: "Metal", move: "Steel Charge", description: "A rhino with armor plates." },
  { number: 18, name: "Gear Bot", type: "Metal", move: "Bolt Barrage", description: "Fires a storm of bolts." },
  { number: 19, name: "Rumble Bear", type: "Fist", move: "Ground Pound", description: "Shakes the ground with one punch." },
  { number: 20, name: "Knuckle Kong", type: "Fist", move: "Mega Punch", description: "The biggest punch in the game." },
  { number: 21, name: "Horsepower", type: "Lightning", move: "Gallop Bolt", description: "A lightning horse that is scared of fire.", total: 990, weaknesses: ["Plant", "Fire"], rarity: "rare" },
  { number: 22, name: "Comet Cat", type: "Lightning", move: "Meteor Pounce", description: "Pounces from space like a falling star." },
  { number: 23, name: "Firefly Queen", type: "Fire", move: "Glow Swarm", description: "Commands a swarm of glowing fireflies." },
  { number: 24, name: "Frost Fang", type: "Ice", move: "Icicle Howl", description: "An ice wolf whose howl freezes the air." },
  { number: 25, name: "Puddle Penguin", type: "Water", move: "Splash Slide", description: "Belly-slides across any puddle." },
  { number: 26, name: "Sunflower Samurai", type: "Plant", move: "Petal Slash", description: "A sword-fighting sunflower." },
  { number: 27, name: "Zoom Zebra", type: "Wind", move: "Stripe Streak", description: "So fast its stripes blur together." },
  { number: 28, name: "Chrome Croc", type: "Metal", move: "Steel Jaw", description: "A crocodile with shiny metal teeth." },
  { number: 29, name: "Boxing Bunny", type: "Fist", move: "Hop Hook", description: "Hops in and lands a hook punch." },
  { number: 30, name: "Lightning Lion", type: "Lightning", move: "Tail Roll", description: "Swings his tail and lightning rolls along the ground." },
  { number: 31, name: "Dolphin Dude", type: "Water", move: "Deep Dive Dash", description: "An 8-year-old who swims underwater for ages. Won't eat his veggies." },
  { number: 32, name: "Push Up Polly", type: "Fist", move: "One-Handed Push-Ups", description: "A 2-year-old who just does push-ups." },
  { number: 33, name: "Clock Otis", type: "Metal", move: "Wrong Time", description: "A sneaky clock that tells everyone the wrong time.", weaknesses: ["Water", "Lightning"], rarity: "rare" },
  { number: 34, name: "Football Fred", type: "Fist", move: "Rocket Throw", description: "Throws so hard the catcher goes flying." },
  { number: 35, name: "Wyatt Kid", type: "Lightning", move: "Thunder Sprint", description: "Runs so fast lightning trails behind him." },
  { number: 36, name: "Dad Zach", type: "Metal", move: "Dad Joke Shield", description: "Blocks attacks with jokes so bad everyone groans." },
  { number: 37, name: "Sviata Whirlwind", type: "Wind", move: "Tall Tale Teleport", description: "So full of hot air from her stories, she blows herself anywhere in a blink.", art: "" }, // picture coming soon
];

/** Picture file for a card: public/cards/NN-name.jpg */
export const artPath = (c: { number: number; name: string }) =>
  `/cards/${String(c.number).padStart(2, "0")}-${c.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}.jpg`;

export const STARTER_CARDS: StarterCard[] = CARDS.map((c) => ({ ...c, art: c.art ?? artPath(c) }));
