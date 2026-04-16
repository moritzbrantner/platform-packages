export type LanguageTag = string;

export type TextNormalizer = (value: string) => string;

export function normalizeLanguageTag(value: string | null | undefined): LanguageTag | undefined {
  const trimmed = value?.trim();

  if (!trimmed) {
    return undefined;
  }

  const candidate = trimmed.replace(/_/gu, "-");

  if (!/^[A-Za-z0-9-]+$/u.test(candidate)) {
    return undefined;
  }

  return candidate
    .split("-")
    .map((part, index) => {
      if (index === 0) {
        return part.toLowerCase();
      }

      if (part.length === 4 && /^[A-Za-z]+$/u.test(part)) {
        return `${part.slice(0, 1).toUpperCase()}${part.slice(1).toLowerCase()}`;
      }

      if ((part.length === 2 && /^[A-Za-z]+$/u.test(part)) || /^\d{3}$/u.test(part)) {
        return part.toUpperCase();
      }

      return part.toLowerCase();
    })
    .join("-");
}

export function normalizeText(value: string): string {
  return value.replace(/\r\n?/gu, "\n").normalize("NFC");
}

export function normalizeToken(value: string): string {
  return normalizeText(value)
    .toLocaleLowerCase()
    .normalize("NFKD")
    .replace(/\p{M}/gu, "");
}
