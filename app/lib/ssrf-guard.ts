/**
 * SSRF guard — used by `/api/media-proxy`, `/api/text-proxy`, and any
 * other server-side endpoint that fetches a user-supplied URL.
 *
 * Goals:
 *   - Block schemes other than http/https (no file://, gopher://, etc.)
 *   - Block fetches to localhost, link-local, loopback, private RFC1918,
 *     and cloud-metadata IPs (169.254.169.254 etc.)
 *   - Allow operators to extend an allowlist via env when they DO need
 *     to reach an internal service (e.g. a ComfyUI on a LAN).
 *
 * Env:
 *   PROXY_ALLOWED_HOSTS=comma,separated,hostnames  (default: empty = public-only)
 *   PROXY_ALLOWED_HOSTS=*                          (allow any public host; still blocks private IPs)
 *
 * For endpoints that *should* be able to talk to ComfyUI on the same
 * host, set PROXY_ALLOWED_HOSTS=localhost,127.0.0.1,<comfyui-host>.
 */

import { LookupAddress } from "node:dns";

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "ip6-localhost",
  "ip6-loopback",
  "metadata.google.internal",
]);

const PRIVATE_IPV4_RANGES: Array<[RegExp, number]> = [
  // 10.0.0.0/8
  [/^10\./, 8],
  // 172.16.0.0/12
  [/^172\.(1[6-9]|2[0-9]|3[01])\./, 12],
  // 192.168.0.0/16
  [/^192\.168\./, 16],
  // 127.0.0.0/8
  [/^127\./, 8],
  // 169.254.0.0/16 — link-local AND cloud metadata
  [/^169\.254\./, 16],
  // 0.0.0.0/8
  [/^0\./, 8],
  // 100.64.0.0/10 — CGNAT
  [/^100\.(6[4-9]|[7-9][0-9]|1[0-1][0-9]|12[0-7])\./, 10],
  // 224.0.0.0/4 — multicast
  [/^2(2[4-9]|[3-5][0-9])\./, 4],
  // 240.0.0.0/4 — reserved
  [/^24[0-9]\.|^25[0-5]\./, 4],
];

const PRIVATE_IPV6_RANGES: Array<RegExp> = [
  // ::1/128 loopback
  /^::1$/,
  // fc00::/7 unique local
  /^f[cd]/,
  // fe80::/10 link-local
  /^fe[89ab][0-9a-f]:/,
  // ::ffff:0:0/96 IPv4-mapped (caught by IPv4 rules above after normalization)
  // 2001:db8::/32 documentation
  /^2001:db8:/,
];

function isPrivateIPv4(ip: string): boolean {
  for (const [re] of PRIVATE_IPV4_RANGES) {
    if (re.test(ip)) return true;
  }
  return false;
}

function isPrivateIPv6(ip: string): boolean {
  // Strip zone id
  const clean = ip.split("%")[0].toLowerCase();
  for (const re of PRIVATE_IPV6_RANGES) {
    if (re.test(clean)) return true;
  }
  return false;
}

function ipIsPrivate(ip: string): boolean {
  // Normalize IPv4-mapped IPv6 ::ffff:a.b.c.d -> a.b.c.d
  const mapped = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  if (mapped) return isPrivateIPv4(mapped[1]);
  if (ip.includes(":")) return isPrivateIPv6(ip);
  return isPrivateIPv4(ip);
}

export interface ProxyGuardOptions {
  /** What the caller is fetching (used for error messages). */
  purpose?: string;
  /** Override the env-derived allowlist. */
  allowedHosts?: string[];
}

export class ProxyGuardError extends Error {
  public readonly code: "scheme" | "host" | "private" | "denied";
  constructor(code: ProxyGuardError["code"], message: string) {
    super(message);
    this.code = code;
    this.name = "ProxyGuardError";
  }
}

function parseAllowedHosts(): { allowAnyPublic: boolean; hosts: Set<string> } {
  const raw = (process.env.PROXY_ALLOWED_HOSTS || "").trim();
  if (raw === "*") return { allowAnyPublic: true, hosts: new Set() };
  const list = raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return { allowAnyPublic: false, hosts: new Set(list) };
}

export interface ValidatedTarget {
  url: URL;
  hostname: string;
  ip: string;
}

/**
 * Validate a user-supplied URL against the proxy guard.
 * Throws ProxyGuardError on rejection. Returns the parsed URL + resolved
 * IP on success (caller MUST use the IP, not the hostname, in the actual
 * fetch — or rely on Node's DNS resolution. This is best-effort: a
 * TOCTOU attacker could still rebind the hostname between resolution and
 * fetch. For high-stakes endpoints, pin the IP in the URL yourself.)
 */
export async function validateProxyUrl(
  rawUrl: string,
  options: ProxyGuardOptions = {},
): Promise<ValidatedTarget> {
  const purpose = options.purpose ? `${options.purpose}: ` : "";
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new ProxyGuardError("scheme", `${purpose}URL is not parseable`);
  }

  // Scheme check (must be http or https, not file/data/blob/gopher/...)
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new ProxyGuardError(
      "scheme",
      `${purpose}Disallowed scheme: ${parsed.protocol} (only http/https are permitted)`,
    );
  }

  const hostname = parsed.hostname.toLowerCase();
  if (!hostname) {
    throw new ProxyGuardError("host", "URL is missing a hostname");
  }

  // Allowlist check first (if the operator has one). This lets operators
  // explicitly permit loopback/private services in single-host setups
  // (PROXY_ALLOWED_HOSTS=localhost,127.0.0.1) where the BLOCKED_HOSTNAMES
  // and private-IP rules would otherwise reject the call.
  const { allowAnyPublic, hosts } = parseAllowedHosts();
  if (hosts.has(hostname)) {
    return { url: parsed, hostname, ip: "" };
  }

  // Explicit blocklist (only enforced when the hostname is NOT in the
  // operator's allowlist).
  if (BLOCKED_HOSTNAMES.has(hostname)) {
    throw new ProxyGuardError(
      "host",
      `Blocked hostname: ${hostname}`,
    );
  }

  // If the operator configured a host allowlist, enforce it strictly.
  // Use PROXY_ALLOWED_HOSTS=* for the previous "any public host" behavior
  // with private/link-local blocking still applied below.
  if (!allowAnyPublic && hosts.size > 0) {
    throw new ProxyGuardError(
      "denied",
      `Hostname ${hostname} is not in PROXY_ALLOWED_HOSTS allowlist`,
    );
  }

  // DNS-resolve the hostname and reject if it lands on a private IP.
  // This catches DNS-rebinding attacks only if the resolver and the
  // fetch use the same pinned IP — we expose the IP so the caller can
  // pin it. Default callers can ignore `ip` and trust the validation
  // for the common case (a single public IP per hostname).
  const dns = await import("node:dns/promises");
  let resolved: LookupAddress[];
  try {
    resolved = await dns.lookup(hostname, { all: true, verbatim: true });
  } catch {
    throw new ProxyGuardError("host", `Cannot resolve hostname: ${hostname}`);
  }
  if (resolved.length === 0) {
    throw new ProxyGuardError("host", `No DNS records for ${hostname}`);
  }

  for (const record of resolved) {
    if (ipIsPrivate(record.address)) {
      throw new ProxyGuardError(
        "private",
        `Hostname ${hostname} resolves to private/loopback address ${record.address}`,
      );
    }
  }

  return { url: parsed, hostname, ip: resolved[0].address };
}

/**
 * Like validateProxyUrl but for the ViewComfy Cloud endpoint, which
 * the operator always knows in advance (it's a config value). For
 * this case we require an explicit allowlist — no "public IP only"
 * fallback — because the endpoint should be a known URL.
 */
export function validateViewComfyEndpoint(rawUrl: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new ProxyGuardError("scheme", "viewcomfyEndpoint is not a valid URL");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new ProxyGuardError(
      "scheme",
      `viewcomfyEndpoint scheme not allowed: ${parsed.protocol}`,
    );
  }
  const { allowAnyPublic, hosts } = parseAllowedHosts();
  if (allowAnyPublic) return parsed;
  if (hosts.has(parsed.hostname.toLowerCase())) return parsed;
  throw new ProxyGuardError(
    "denied",
    `viewcomfyEndpoint host ${parsed.hostname} is not in PROXY_ALLOWED_HOSTS allowlist`,
  );
}
