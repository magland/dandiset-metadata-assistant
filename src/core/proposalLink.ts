/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Proposal link utilities for sharing metadata changes.
 * 
 * A proposal link contains:
 * - The dandiset ID (in the URL path/query)
 * - An MD5 hash of the original metadata (for verification)
 * - A jsondiffpatch delta (the proposed changes)
 */

import type { Delta } from 'jsondiffpatch';
import { computeDelta, applyDelta } from './metadataDiff';
import type { DandisetMetadata } from '../types/dandiset';

export interface ProposalData {
  /** MD5 hash of the canonical original metadata JSON */
  h: string;
  /** jsondiffpatch delta representing the changes */
  d: Delta;
}

export type ProposalValidationResult = {
  success: true;
  modifiedMetadata: DandisetMetadata;
} | {
  success: false;
  error: string;
};

/**
 * Convert a string to canonical JSON (sorted keys).
 */
function toCanonicalJson(obj: any): string {
  return JSON.stringify(obj, Object.keys(obj).sort());
}

/**
 * Compute MD5 hash of the canonical JSON representation of metadata.
 */
export async function computeMetadataHash(metadata: any): Promise<string> {
  const canonical = toCanonicalJson(metadata);
  return md5(canonical);
}

/**
 * Simple MD5 implementation for browser environments.
 * Based on the MD5 algorithm specification.
 */
function md5(string: string): string {
  function rotateLeft(value: number, shift: number): number {
    return (value << shift) | (value >>> (32 - shift));
  }

  function addUnsigned(x: number, y: number): number {
    const lsw = (x & 0xffff) + (y & 0xffff);
    const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
    return (msw << 16) | (lsw & 0xffff);
  }

  function f(x: number, y: number, z: number): number {
    return (x & y) | (~x & z);
  }
  function g(x: number, y: number, z: number): number {
    return (x & z) | (y & ~z);
  }
  function h(x: number, y: number, z: number): number {
    return x ^ y ^ z;
  }
  function i(x: number, y: number, z: number): number {
    return y ^ (x | ~z);
  }

  function ff(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
    a = addUnsigned(a, addUnsigned(addUnsigned(f(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  function gg(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
    a = addUnsigned(a, addUnsigned(addUnsigned(g(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  function hh(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
    a = addUnsigned(a, addUnsigned(addUnsigned(h(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  function ii(a: number, b: number, c: number, d: number, x: number, s: number, ac: number): number {
    a = addUnsigned(a, addUnsigned(addUnsigned(i(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }

  function convertToWordArray(str: string): number[] {
    const lWordCount: number[] = [];
    const lMessageLength = str.length;
    const lNumberOfWords_temp1 = lMessageLength + 8;
    const lNumberOfWords_temp2 = (lNumberOfWords_temp1 - (lNumberOfWords_temp1 % 64)) / 64;
    const lNumberOfWords = (lNumberOfWords_temp2 + 1) * 16;

    for (let i = 0; i < lNumberOfWords; i++) {
      lWordCount[i] = 0;
    }

    let lBytePosition = 0;
    let lByteCount = 0;
    while (lByteCount < lMessageLength) {
      const lWordIndex = (lByteCount - (lByteCount % 4)) / 4;
      lBytePosition = (lByteCount % 4) * 8;
      lWordCount[lWordIndex] = lWordCount[lWordIndex] | (str.charCodeAt(lByteCount) << lBytePosition);
      lByteCount++;
    }
    const lWordIndex = (lByteCount - (lByteCount % 4)) / 4;
    lBytePosition = (lByteCount % 4) * 8;
    lWordCount[lWordIndex] = lWordCount[lWordIndex] | (0x80 << lBytePosition);
    lWordCount[lNumberOfWords - 2] = lMessageLength << 3;
    lWordCount[lNumberOfWords - 1] = lMessageLength >>> 29;
    return lWordCount;
  }

  function wordToHex(value: number): string {
    let hex = '';
    for (let i = 0; i <= 3; i++) {
      const byte = (value >>> (i * 8)) & 255;
      hex += ('0' + byte.toString(16)).slice(-2);
    }
    return hex;
  }

  // UTF-8 encode the string
  const utf8String = unescape(encodeURIComponent(string));

  const x = convertToWordArray(utf8String);
  let a = 0x67452301;
  let b = 0xefcdab89;
  let c = 0x98badcfe;
  let d = 0x10325476;

  const S11 = 7, S12 = 12, S13 = 17, S14 = 22;
  const S21 = 5, S22 = 9, S23 = 14, S24 = 20;
  const S31 = 4, S32 = 11, S33 = 16, S34 = 23;
  const S41 = 6, S42 = 10, S43 = 15, S44 = 21;

  for (let k = 0; k < x.length; k += 16) {
    const AA = a, BB = b, CC = c, DD = d;

    a = ff(a, b, c, d, x[k + 0], S11, 0xd76aa478);
    d = ff(d, a, b, c, x[k + 1], S12, 0xe8c7b756);
    c = ff(c, d, a, b, x[k + 2], S13, 0x242070db);
    b = ff(b, c, d, a, x[k + 3], S14, 0xc1bdceee);
    a = ff(a, b, c, d, x[k + 4], S11, 0xf57c0faf);
    d = ff(d, a, b, c, x[k + 5], S12, 0x4787c62a);
    c = ff(c, d, a, b, x[k + 6], S13, 0xa8304613);
    b = ff(b, c, d, a, x[k + 7], S14, 0xfd469501);
    a = ff(a, b, c, d, x[k + 8], S11, 0x698098d8);
    d = ff(d, a, b, c, x[k + 9], S12, 0x8b44f7af);
    c = ff(c, d, a, b, x[k + 10], S13, 0xffff5bb1);
    b = ff(b, c, d, a, x[k + 11], S14, 0x895cd7be);
    a = ff(a, b, c, d, x[k + 12], S11, 0x6b901122);
    d = ff(d, a, b, c, x[k + 13], S12, 0xfd987193);
    c = ff(c, d, a, b, x[k + 14], S13, 0xa679438e);
    b = ff(b, c, d, a, x[k + 15], S14, 0x49b40821);

    a = gg(a, b, c, d, x[k + 1], S21, 0xf61e2562);
    d = gg(d, a, b, c, x[k + 6], S22, 0xc040b340);
    c = gg(c, d, a, b, x[k + 11], S23, 0x265e5a51);
    b = gg(b, c, d, a, x[k + 0], S24, 0xe9b6c7aa);
    a = gg(a, b, c, d, x[k + 5], S21, 0xd62f105d);
    d = gg(d, a, b, c, x[k + 10], S22, 0x02441453);
    c = gg(c, d, a, b, x[k + 15], S23, 0xd8a1e681);
    b = gg(b, c, d, a, x[k + 4], S24, 0xe7d3fbc8);
    a = gg(a, b, c, d, x[k + 9], S21, 0x21e1cde6);
    d = gg(d, a, b, c, x[k + 14], S22, 0xc33707d6);
    c = gg(c, d, a, b, x[k + 3], S23, 0xf4d50d87);
    b = gg(b, c, d, a, x[k + 8], S24, 0x455a14ed);
    a = gg(a, b, c, d, x[k + 13], S21, 0xa9e3e905);
    d = gg(d, a, b, c, x[k + 2], S22, 0xfcefa3f8);
    c = gg(c, d, a, b, x[k + 7], S23, 0x676f02d9);
    b = gg(b, c, d, a, x[k + 12], S24, 0x8d2a4c8a);

    a = hh(a, b, c, d, x[k + 5], S31, 0xfffa3942);
    d = hh(d, a, b, c, x[k + 8], S32, 0x8771f681);
    c = hh(c, d, a, b, x[k + 11], S33, 0x6d9d6122);
    b = hh(b, c, d, a, x[k + 14], S34, 0xfde5380c);
    a = hh(a, b, c, d, x[k + 1], S31, 0xa4beea44);
    d = hh(d, a, b, c, x[k + 4], S32, 0x4bdecfa9);
    c = hh(c, d, a, b, x[k + 7], S33, 0xf6bb4b60);
    b = hh(b, c, d, a, x[k + 10], S34, 0xbebfbc70);
    a = hh(a, b, c, d, x[k + 13], S31, 0x289b7ec6);
    d = hh(d, a, b, c, x[k + 0], S32, 0xeaa127fa);
    c = hh(c, d, a, b, x[k + 3], S33, 0xd4ef3085);
    b = hh(b, c, d, a, x[k + 6], S34, 0x04881d05);
    a = hh(a, b, c, d, x[k + 9], S31, 0xd9d4d039);
    d = hh(d, a, b, c, x[k + 12], S32, 0xe6db99e5);
    c = hh(c, d, a, b, x[k + 15], S33, 0x1fa27cf8);
    b = hh(b, c, d, a, x[k + 2], S34, 0xc4ac5665);

    a = ii(a, b, c, d, x[k + 0], S41, 0xf4292244);
    d = ii(d, a, b, c, x[k + 7], S42, 0x432aff97);
    c = ii(c, d, a, b, x[k + 14], S43, 0xab9423a7);
    b = ii(b, c, d, a, x[k + 5], S44, 0xfc93a039);
    a = ii(a, b, c, d, x[k + 12], S41, 0x655b59c3);
    d = ii(d, a, b, c, x[k + 3], S42, 0x8f0ccc92);
    c = ii(c, d, a, b, x[k + 10], S43, 0xffeff47d);
    b = ii(b, c, d, a, x[k + 1], S44, 0x85845dd1);
    a = ii(a, b, c, d, x[k + 8], S41, 0x6fa87e4f);
    d = ii(d, a, b, c, x[k + 15], S42, 0xfe2ce6e0);
    c = ii(c, d, a, b, x[k + 6], S43, 0xa3014314);
    b = ii(b, c, d, a, x[k + 13], S44, 0x4e0811a1);
    a = ii(a, b, c, d, x[k + 4], S41, 0xf7537e82);
    d = ii(d, a, b, c, x[k + 11], S42, 0xbd3af235);
    c = ii(c, d, a, b, x[k + 2], S43, 0x2ad7d2bb);
    b = ii(b, c, d, a, x[k + 9], S44, 0xeb86d391);

    a = addUnsigned(a, AA);
    b = addUnsigned(b, BB);
    c = addUnsigned(c, CC);
    d = addUnsigned(d, DD);
  }

  return (wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d)).toLowerCase();
}

/**
 * Create a proposal link URL for sharing metadata changes.
 * 
 * @param dandisetId - The dandiset ID
 * @param originalMetadata - The original (unmodified) metadata
 * @param modifiedMetadata - The metadata with proposed changes
 * @returns The full URL with proposal encoded, or null if no changes
 */
export async function createProposalLink(
  dandisetId: string,
  originalMetadata: DandisetMetadata,
  modifiedMetadata: DandisetMetadata
): Promise<string | null> {
  // Compute the delta
  const delta = computeDelta(originalMetadata, modifiedMetadata);
  
  if (!delta) {
    // No changes to share
    return null;
  }
  
  // Compute hash of original metadata
  const hash = await computeMetadataHash(originalMetadata);
  
  // Create proposal data
  const proposalData: ProposalData = {
    h: hash,
    d: delta
  };
  
  // Encode as base64
  const jsonStr = JSON.stringify(proposalData);
  const base64 = btoa(encodeURIComponent(jsonStr).replace(/%([0-9A-F]{2})/g, (_, p1) => 
    String.fromCharCode(parseInt(p1, 16))
  ));
  
  // Build URL
  const url = new URL(window.location.href);
  url.searchParams.set('dandiset', dandisetId);
  url.searchParams.set('proposal', base64);
  url.searchParams.set('review', '1');
  // Remove any other params that shouldn't be shared
  url.searchParams.delete('version');
  
  return url.toString();
}

/**
 * Parse proposal data from URL query parameters.
 *
 * @returns The proposal data if present and valid, null otherwise
 */
export function parseProposalFromUrl(): ProposalData | null {
  const params = new URLSearchParams(window.location.search);
  const proposalParam = params.get('proposal');
  
  console.log('[Proposal Parse] URL search:', window.location.search);
  console.log('[Proposal Parse] proposal param:', proposalParam ? `${proposalParam.substring(0, 50)}...` : 'null');
  
  if (!proposalParam) {
    console.log('[Proposal Parse] No proposal param found');
    return null;
  }
  
  try {
    // Decode from base64
    console.log('[Proposal Parse] Attempting to decode base64...');
    const decoded = atob(proposalParam);
    console.log('[Proposal Parse] Base64 decoded, length:', decoded.length);
    
    const jsonStr = decodeURIComponent(
      decoded
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    console.log('[Proposal Parse] JSON string:', jsonStr.substring(0, 100) + '...');
    
    const data = JSON.parse(jsonStr) as ProposalData;
    
    console.log('[Proposal Parse] Parsed data:', { hash: data.h, hasDelta: !!data.d });
    
    // Validate structure
    if (!data.h || typeof data.h !== 'string' || !data.d) {
      console.error('[Proposal Parse] Invalid proposal data structure:', data);
      return null;
    }
    
    console.log('[Proposal Parse] Successfully parsed proposal');
    return data;
  } catch (error) {
    console.error('[Proposal Parse] Failed to parse proposal from URL:', error);
    return null;
  }
}

/**
 * Validate a proposal against current metadata and apply it if valid.
 * 
 * @param proposal - The proposal data from the URL
 * @param currentMetadata - The current metadata from the server
 * @returns Result indicating success with modified metadata, or failure with error
 */
export async function validateAndApplyProposal(
  proposal: ProposalData,
  currentMetadata: DandisetMetadata
): Promise<ProposalValidationResult> {
  // Compute hash of current metadata
  const currentHash = await computeMetadataHash(currentMetadata);
  
  // Check if hashes match
  if (currentHash !== proposal.h) {
    return {
      success: false,
      error: 'The metadata has changed since this proposal was created. The proposed changes can no longer be applied safely.'
    };
  }
  
  try {
    // Clone the metadata and apply the delta
    const cloned = JSON.parse(JSON.stringify(currentMetadata)) as DandisetMetadata;
    const modified = applyDelta(cloned, proposal.d);
    
    return {
      success: true,
      modifiedMetadata: modified
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to apply proposed changes: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Clear proposal-related parameters from the URL without reloading.
 */
export function clearProposalFromUrl(): void {
  const url = new URL(window.location.href);
  url.searchParams.delete('proposal');
  window.history.replaceState({}, '', url.toString());
}
