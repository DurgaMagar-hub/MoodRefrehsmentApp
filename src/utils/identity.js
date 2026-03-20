const adjectives = [
    "Serene", "Peaceful", "Quiet", "Happy", "Calm", "Brave", "Kind", "Wise",
    "Gentle", "Bright", "Mellow", "Radiant", "Friendly", "Harmonious", "Vibrant"
];

const nouns = [
    "Panda", "Koala", "Sunflower", "Willow", "Ocean", "Moon", "Cloud", "Forest",
    "Fox", "Deer", "Sparrow", "Breeze", "River", "Mountain", "Starlight"
];

const colors = [
    "#FF7E5F", "#FEB47B", "#764BA2", "#667EEA", "#00CEC9", "#0984E3", "#6C5CE7",
    "#E84393", "#FD79A8", "#00B894", "#FDCB6E", "#E17055", "#D63031", "#B2BEC3"
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
