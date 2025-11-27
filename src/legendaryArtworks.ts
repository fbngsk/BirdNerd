// Legendary Card Artwork URLs
// Add custom artwork paths here for each legendary bird
// Upload images to /public/ folder and reference them here

export const LEGENDARY_ARTWORKS: Record<string, string> = {
    'uhu': '/legendary-cards/uhu.jpeg',
    'raubwuerger': '/legendary-cards/raubwuerger.jpeg',
    'seeadler': '/legendary-cards/seeadler.jpeg',
    'grosstrappe': '/legendary-cards/grosstrappe.jpeg',
    'auerhuhn': '/legendary-cards/auerhuhn.jpeg',
    'schwarzstorch': '/legendary-cards/schwarzstorch.jpeg',
    'schreiadler': '/legendary-cards/schreiadler.jpeg',
    'kornweihe': '/legendary-cards/kornweihe.jpeg',
    'sumpfohreule': '/legendary-cards/sumpfohreule.jpeg',
    'goldregenpfeifer': '/legendary-cards/goldregenpfeifer.jpeg',
};

// Helper function to get artwork URL for a bird
export const getLegendaryArtwork = (birdId: string): string | null => {
    return LEGENDARY_ARTWORKS[birdId] || null;
};
