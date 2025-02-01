// Clé maître pour le calcul CMAC (16 octets)
export const MASTER_KEY_HEX = "256BC10767BF9B68DA7E6F04FD448652";// 00000000000000000000000000000003

// Convertir la clé hexadécimale en tableau d'octets
export function getMasterKey(): number[] {
    const bytes = [];
    for (let i = 0; i < MASTER_KEY_HEX.length; i += 2) {
        bytes.push(parseInt(MASTER_KEY_HEX.substr(i, 2), 16));
    }
    return bytes;
}
