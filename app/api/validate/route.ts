import { NextResponse } from 'next/server'
import CryptoJS from 'crypto-js'
import { getMasterKey } from '@/app/config/keys'

// Convertir une chaîne hexadécimale en tableau d'octets
function hexToBytes(hex: string): number[] {
  const bytes = []
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.substr(i, 2), 16))
  }
  return bytes
}

// Convertir un tableau d'octets en WordArray
function bytesToWordArray(bytes: number[]): CryptoJS.lib.WordArray {
  const words = []
  for (let i = 0; i < bytes.length; i += 4) {
    words.push(
      (bytes[i] << 24) |
      ((bytes[i + 1] || 0) << 16) |
      ((bytes[i + 2] || 0) << 8) |
      (bytes[i + 3] || 0)
    )
  }
  return CryptoJS.lib.WordArray.create(words, bytes.length)
}

// Convertir WordArray en tableau d'octets
function wordArrayToBytes(wordArray: CryptoJS.lib.WordArray): number[] {
  const words = wordArray.words;
  const sigBytes = wordArray.sigBytes;
  const bytes = [];

  for (let i = 0; i < sigBytes; i++) {
    bytes.push((words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff);
  }

  return bytes;
}

// Convertir un tableau d'octets en chaîne hexadécimale
function bytesToHex(bytes: number[]): string {
  return bytes.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join('');
}

interface CmacResult {
  fullCmac: number[]
  sv2: string
  cmacHex: string
  steps: string[]
}

// Générer les sous-clés CMAC
function generateSubkeys(key: number[]): { K1: number[], K2: number[] } {
  // Chiffrer un bloc de zéros avec AES-ECB
  const zeroBlock = new Array(16).fill(0);
  const cipher = CryptoJS.AES.encrypt(
    bytesToWordArray(zeroBlock),
    bytesToWordArray(key),
    { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.NoPadding }
  );
  
  const L = wordArrayToBytes(cipher.ciphertext);
  
  // Décalage à gauche d'un bit et XOR avec 0x87 si nécessaire
  function leftShift(data: number[]): number[] {
    const result = new Array(16).fill(0);
    let carry = 0;
    
    for (let i = 15; i >= 0; i--) {
      const newCarry = (data[i] & 0x80) !== 0;
      result[i] = ((data[i] << 1) | carry) & 0xff;
      carry = newCarry ? 1 : 0;
    }
    
    if (data[0] & 0x80) {
      result[15] ^= 0x87;
    }
    
    return result;
  }
  
  // Générer K1 et K2
  const K1 = leftShift(L);
  const K2 = leftShift(K1);
  
  return { K1, K2 };
}

// Calculer le CMAC complet
function calculateFullCmac(uid: string, ctr: string): CmacResult {
  const steps: string[] = [];
  
  // 1. Construire SV2
  const formattedCtr = ctr.substring(4) + "0000";
  const sv2 = "3CC300010080" + uid + formattedCtr;
  steps.push(`1. Construction SV2: ${sv2}`);
  
  // 2. Obtenir la clé maître
  const masterKey = getMasterKey();
  steps.push(`2. Clé maître: ${bytesToHex(masterKey)}`);
  
  // 3. Générer les sous-clés
  const { K1, K2 } = generateSubkeys(masterKey);
  steps.push(`3. Sous-clé K1: ${bytesToHex(K1)}`);
  steps.push(`3. Sous-clé K2: ${bytesToHex(K2)}`);
  
  // 4. Vecteur d'initialisation
  const X = new Array(16).fill(0);
  steps.push(`4. Vecteur d'initialisation X: ${bytesToHex(X)}`);
  
  // 5. Traiter le bloc de message
  const message = hexToBytes(sv2);
  steps.push(`5. Traitement du bloc 1: ${bytesToHex(message)}`);
  
  // 6. XOR avec K1
  const M = message.slice(0, 16);
  const lastBlock = M.map((b, i) => b ^ K1[i]);
  steps.push(`6. Traitement du dernier bloc (XOR avec K1): ${bytesToHex(lastBlock)}`);
  
  // 7. XOR avec le vecteur d'initialisation et chiffrement AES
  const Y = lastBlock.map((b, i) => b ^ X[i]);
  
  const cipher = CryptoJS.AES.encrypt(
    bytesToWordArray(Y),
    bytesToWordArray(masterKey),
    { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.NoPadding }
  );
  
  const fullCmac = wordArrayToBytes(cipher.ciphertext);
  const cmacHex = bytesToHex(fullCmac);
  steps.push(`7. CMAC final: ${cmacHex}`);
  
  return {
    fullCmac,
    sv2,
    cmacHex,
    steps
  };
}

interface SdmmacResult {
  sdmmac: string
  steps: string[]
}

// Calculer le SDMMAC
function calculateSdmmac(fullCmac: number[]): SdmmacResult {
  const steps: string[] = [];
  
  // 1. Utiliser le CMAC complet comme clé
  steps.push(`1. Utilisation du CMAC comme clé: ${bytesToHex(fullCmac)}`);
  
  // 2. Préparer le message vide
  steps.push(`2. Préparation du message vide`);
  
  // 3. Générer les sous-clés
  const { K1, K2 } = generateSubkeys(fullCmac);
  
  // 4. Remplir le message vide et XOR avec K2
  const paddedMessage = [0x80, ...new Array(15).fill(0)];
  const M = paddedMessage.map((b, i) => b ^ K2[i]);
  
  // 5. Vecteur d'initialisation
  const X = new Array(16).fill(0);
  
  // 6. XOR avec le vecteur d'initialisation
  const Y = M.map((b, i) => b ^ X[i]);
  
  // 7. Chiffrement AES
  const cipher = CryptoJS.AES.encrypt(
    bytesToWordArray(Y),
    bytesToWordArray(fullCmac),
    { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.NoPadding }
  );
  
  const result = wordArrayToBytes(cipher.ciphertext);
  steps.push(`3. Résultat CMAC du message vide: ${bytesToHex(result)}`);
  
  // 8. Prendre un octet sur deux
  const sdmmacBytes = result.filter((_, i) => i % 2 === 1).slice(0, 8);
  const sdmmac = bytesToHex(sdmmacBytes);
  steps.push(`4. SDMMAC extrait: ${sdmmac}`);
  
  return {
    sdmmac,
    steps
  };
}

export async function POST(request: Request) {
  try {
    // Récupérer l'URL du corps de la requête
    const data = await request.json();
    const url = data.url;

    console.log('=== Début de la validation URL ===');
    console.log('URL reçue:', url);

    if (!url) {
      console.log('Erreur: URL vide');
      return NextResponse.json(
        { success: false, message: 'L\'URL ne peut pas être vide' },
        { status: 400 }
      );
    }

    // Analyser les paramètres URL
    const urlObj = new URL(url);
    const uid = urlObj.searchParams.get('uid');
    const ctr = urlObj.searchParams.get('ctr');
    const providedCmac = urlObj.searchParams.get('cmac');

    console.log('\nParamètres URL analysés:');
    console.log('- UID:', uid);
    console.log('- CTR:', ctr);
    console.log('- CMAC fourni:', providedCmac);

    if (!uid || !ctr || !providedCmac) {
      console.log('Erreur: Paramètres manquants');
      return NextResponse.json(
        { success: false, message: 'Paramètres manquants (uid, ctr, cmac)' },
        { status: 400 }
      );
    }

    // Calculer CMAC
    console.log('\n=== Étapes de calcul CMAC ===');
    const cmacResult = calculateFullCmac(uid, ctr);
    cmacResult.steps.forEach(step => console.log(step));

    // Calculer SDMMAC
    console.log('\n=== Étapes de calcul SDMMAC ===');
    const sdmmacResult = calculateSdmmac(cmacResult.fullCmac);
    sdmmacResult.steps.forEach(step => console.log(step));

    // Comparer le SDMMAC calculé avec le CMAC fourni
    const isValid = sdmmacResult.sdmmac === providedCmac;
    
    console.log('\n=== Résultat de la validation ===');
    console.log('SDMMAC calculé:', sdmmacResult.sdmmac);
    console.log('CMAC fourni:', providedCmac);
    console.log('Correspond:', isValid);
    console.log('=== Fin de la validation URL ===');

    // Retourner la réponse selon le résultat de la validation
    if (!isValid) {
      return NextResponse.json({
        success: false,
        valid: false,
        message: 'Validation CMAC échouée',
        calculatedSdmmac: sdmmacResult.sdmmac,
        providedCmac,
        details: {
          sv2: cmacResult.sv2,
          fullCmac: cmacResult.cmacHex,
          steps: {
            cmacCalculation: cmacResult.steps,
            sdmmacCalculation: sdmmacResult.steps
          }
        }
      }, { status: 200 });
    }

    return NextResponse.json({
      success: true,
      valid: true,
      message: 'Validation CMAC réussie',
      calculatedSdmmac: sdmmacResult.sdmmac,
      providedCmac,
      details: {
        sv2: cmacResult.sv2,
        fullCmac: cmacResult.cmacHex,
        steps: {
          cmacCalculation: cmacResult.steps,
          sdmmacCalculation: sdmmacResult.steps
        }
      }
    });

  } catch (error) {
    console.error('Erreur:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}
