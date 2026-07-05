const knownBaseDomains = ['slate.optavel.com', 'slated.optavel.com', 'oatstack.com'];
const reservedSubdomains = ['www'];

function getSubdomainAndBase(host) {
  for (const base of knownBaseDomains) {
    if (host === base) {
      return { currentSubdomain: null, baseDomain: base, isCustomDomain: false };
    }
    if (host.endsWith(`.${base}`)) {
      const currentSubdomain = host.replace(`.${base}`, '');
      if (reservedSubdomains.includes(currentSubdomain)) {
        return { currentSubdomain: null, baseDomain: base, isCustomDomain: false };
      }
      return { currentSubdomain, baseDomain: base, isCustomDomain: false };
    }
  }
  return { currentSubdomain: host, baseDomain: host, isCustomDomain: true };
}

console.log(getSubdomainAndBase('optal.slate.optavel.com'));
