const adjectives = [
    "Serene", "Peaceful", "Quiet", "Happy", "Calm", "Brave", "Kind", "Wise",
    "Gentle", "Bright", "Mellow", "Radiant", "Friendly", "Harmonious", "Vibrant"
];

const nouns = [
    "Panda", "Koala", "Sunflower", "Willow", "Ocean", "Moon", "Cloud", "Forest",
    "Fox", "Deer", "Sparrow", "Breeze", "River", "Mountain", "Starlight"
];

const colors = [
    "#a855f7", "#c084fc", "#e879f9", "#f0abfc", "#fda4af", "#d4a574", "#e9c46a",
    "#fcd34d", "#818cf8", "#c4b5fd", "#fbcfe8", "#fce7f3", "#ddd6fe"
];

export function generateIdentity() {
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const color = colors[Math.floor(Math.random() * colors.length)];

    return {
        name: `${adj} ${noun}`,
        color: color,
        avatar: adj.charAt(0) + noun.charAt(0)
    };
}
