/**
 * Decides which forwarded client-address header, if any, this request is
 * allowed to believe.
 *
 * The rate limiter keys on a client address, so this is a security boundary and
 * not a convenience. Better Auth trusts a single-value `x-forwarded-for`
 * header, which means a directly reachable client can present one of its own
 * and receive a fresh bucket per request. A deployment therefore only believes
 * forwarded headers when the immediate TCP peer is a proxy the operator has
 * declared; every other request is keyed on its own socket address.
 */

/** Parses `10.0.0.0/8` or `203.0.113.7` into a normalised matcher, or `null`. */
type AddressMatcher = (ip: string) => boolean;

const ipv4ToBytes = (ip: string): number[] | null => {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;
  const bytes: number[] = [];
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const value = Number(part);
    if (value > 255) return null;
    bytes.push(value);
  }
  return bytes;
};

/** Expands an IPv6 literal to its eight 16-bit groups, or `null`. */
const ipv6ToGroups = (ip: string): number[] | null => {
  const [head = '', tail = '', ...extra] = ip.split('::');
  if (extra.length > 0) return null;

  const parse = (segment: string): number[] | null => {
    if (segment.length === 0) return [];
    const groups: number[] = [];
    for (const part of segment.split(':')) {
      if (part.includes('.')) {
        // A trailing IPv4-mapped form such as ::ffff:203.0.113.7.
        const bytes = ipv4ToBytes(part);
        if (!bytes) return null;
        groups.push((bytes[0]! << 8) | bytes[1]!, (bytes[2]! << 8) | bytes[3]!);
        continue;
      }
      if (!/^[0-9a-fA-F]{1,4}$/.test(part)) return null;
      groups.push(Number.parseInt(part, 16));
    }
    return groups;
  };

  const left = parse(head);
  const right = parse(tail);
  if (!left || !right) return null;
  if (ip.includes('::')) {
    const fill = 8 - left.length - right.length;
    if (fill < 0) return null;
    return [...left, ...Array<number>(fill).fill(0), ...right];
  }
  return left.length === 8 ? left : null;
};

const toBits = (ip: string): { bits: number[]; width: number } | null => {
  const v4 = ipv4ToBytes(ip);
  if (v4) return { bits: v4, width: 32 };
  const groups = ipv6ToGroups(ip);
  if (!groups) return null;
  return { bits: groups.flatMap((group) => [(group >> 8) & 0xff, group & 0xff]), width: 128 };
};

export const parseCidr = (entry: string): AddressMatcher | null => {
  const [address, prefix] = entry.split('/');
  if (!address) return null;

  const target = toBits(address);
  if (!target) return null;

  const maxPrefix = target.width;
  const length = prefix === undefined ? maxPrefix : Number(prefix);
  if (!Number.isInteger(length) || length < 0 || length > maxPrefix) return null;

  // One entry per compared byte: the address bits that are significant, and the
  // mask selecting them. A partial byte must be compared masked, or every
  // address in the range past its first host would be rejected.
  const significant: number[] = [];
  const masks: number[] = [];
  for (let bit = 0; bit < length; bit += 8) {
    const group = target.bits[bit / 8]!;
    const remaining = Math.min(8, length - bit);
    // Keep the top `remaining` bits. Shifting a byte-sized mask left would carry
    // it out of the byte, so shift the wider sentinel down instead.
    const mask = remaining === 8 ? 0xff : (0xff00 >> remaining) & 0xff;
    significant.push(group & mask);
    masks.push(mask);
  }

  return (ip: string): boolean => {
    const candidate = toBits(ip);
    if (!candidate || candidate.width !== target.width) return false;
    for (let index = 0; index < significant.length; index += 1) {
      if ((candidate.bits[index]! & masks[index]!) !== significant[index]) return false;
    }
    return true;
  };
};

export const parseCidrList = (entries: readonly string[]): AddressMatcher[] =>
  entries.map(parseCidr).filter((matcher): matcher is AddressMatcher => matcher !== null);

/** True when this peer is a proxy the operator declared. */
export const isTrustedProxy = (
  peerAddress: string | undefined,
  trusted: AddressMatcher[],
): boolean => {
  if (!peerAddress || trusted.length === 0) return false;
  // `::ffff:203.0.113.7` and `203.0.113.7` are the same client.
  const unwrapped = peerAddress.startsWith('::ffff:') ? peerAddress.slice(7) : peerAddress;
  return trusted.some((matcher) => matcher(unwrapped));
};
