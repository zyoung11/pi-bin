// The JS-lane named-group shapes (no non-null assertions exist here):
// the node suite's test/common/crypto.js version-parsing helper verbatim
// in miniature — .match(regexp).groups destructured through the nullable
// checker spelling — plus the nested { groups: { ... } } pattern.
const versions = "3.0.14+quic";
const regexp = /(?<m>\d+)\.(?<n>\d+)\.(?<p>\d+)/;
const { m, n, p } = versions.match(regexp).groups;
console.log(m, n, p);
console.log(`${m}.${n}.${p}`);

// Nested destructure straight off the exec result.
const re = /(?<year>\d{4})-(?<day>\d{2})/;
const { groups: { year } } = re.exec("1984-09");
console.log(year);

// Direct chain reads through the possibly-null spelling.
console.log("k=v".match(/(?<key>\w+)=(?<val>\w+)/).groups.key);
console.log("k=v".match(/(?<key>\w+)=(?<val>\w+)/).groups.val);

// A stored match result read later.
const hit = "port:8080".match(/(?<name>\w+):(?<port>\d+)/);
if (hit) {
  console.log(hit.groups.name, hit.groups.port);
}

// The Dict<string> receiver shape (process.versions.* is
// `string | undefined` to the checker): match claims the nullable string
// through the checked narrow — crypto.js's process.versions.openssl read.
const entry = Math.random() < 2 ? "3.0.14+quic" : undefined;
const semver = entry.match(/(?<maj>\d+)\.(?<min>\d+)\.(?<pat>\d+)/);
console.log(semver.groups.maj, semver.groups.min, semver.groups.pat);
