// Clé maître pour le calcul CMAC (16 octets)
export const MASTER_KEY_HEX = "00000000000000000000000000000003";

// Convertir la clé hexadécimale en tableau d'octets
export function getMasterKey(): number[] {
    const bytes = [];
    for (let i = 0; i < MASTER_KEY_HEX.length; i += 2) {
        bytes.push(parseInt(MASTER_KEY_HEX.substr(i, 2), 16));
    }
    return bytes;
}
