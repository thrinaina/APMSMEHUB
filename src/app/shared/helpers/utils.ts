import { UrlMatchResult, UrlSegment } from '@angular/router';

// Web Address Matcher Util
export function webAddressMatcher(url: UrlSegment[]): UrlMatchResult | null {
  if (url.length === 1) {
    const path = url[0].path;

    // Reserved modules / routes accessed via '${baseUrl}/'
    const reserved = ['auth', 'dashboard', 'profile', 'admin', 'profileview', 'productprofile'];
    if (reserved.includes(path)) return null;

    return {
      consumed: url,
      posParams: { webAddress: new UrlSegment(path, {}) }
    };
  }
  return null;
}

// Symbol Matcher With Path Util
export function atSymbolMatcherPath(pathName: string) {
  return (url: UrlSegment[]): UrlMatchResult | null => {
    if (url.length === 2 && url[0].path === pathName) {
      return {
        consumed: url,
        posParams: {
          webAddress: new UrlSegment(url[1].path, {})
        }
      };
    }
    return null;
  };
}