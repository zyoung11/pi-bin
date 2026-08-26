// The composed `new crypto.X509Certificate(data).fingerprint` read (the
// windows-ca idiom): the SHA-1 of the DER, uppercase colon-separated —
// PEM input decodes its armor, garbage throws Node's exact PEM error. A
// fixed self-signed certificate keeps the output byte-stable.
import * as crypto from "node:crypto";
import * as fs from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

// A fixed self-signed certificate (100-year validity — only its bytes
// matter here).
const PEM = `-----BEGIN CERTIFICATE-----
MIIDEzCCAfugAwIBAgIUMsBCFtPck8TATMJzfikgW963q3AwDQYJKoZIhvcNAQEL
BQAwGDEWMBQGA1UEAwwNdHNuYXRpdmUtdGVzdDAgFw0yNjA3MTcxNzUyMTFaGA8y
MTI2MDYyMzE3NTIxMVowGDEWMBQGA1UEAwwNdHNuYXRpdmUtdGVzdDCCASIwDQYJ
KoZIhvcNAQEBBQADggEPADCCAQoCggEBALRspe2XjtKvNU7Ws5JfqzmTCPmWtfw0
1Uha271hNp/30VstOxWLbpqPrXDvIwJMN4o8CRp92Y1hcmS36m9QS5qfXJFw+n+S
SWGpFdMNvp6hro0OoNBA+anuKWoTsMyHSwe8ND0fyobQbgAXJ0+snmuK0E2ii+CM
IoUqYbK57nHeyHfISLupgrRoNGXjDHv4v+RSr3MJDag6BLA+/yVjkBOBOT6kaE4K
oyNXYYsfFxGnB/4pDSanV/UsfJ4wHXkVn18ndZHIzTsZMUkV4BecF8UaMrP+u8NI
c5wce0uWLFFEneK4q15iVvk9TaY0g1Uj69ryRT3L58W7RYYuHu7cVB0CAwEAAaNT
MFEwHQYDVR0OBBYEFLT2GqaTmxDhntPxMWaUZvA3s9V5MB8GA1UdIwQYMBaAFLT2
GqaTmxDhntPxMWaUZvA3s9V5MA8GA1UdEwEB/wQFMAMBAf8wDQYJKoZIhvcNAQEL
BQADggEBAFcTLVJIyhbIKHfOnGM5T+Kzu5IoDlqzr+Rdx/0IKFLVDqEA9ihEme07
K/d246pOW5LBceVDY2eMikDpIOjYPEoe9C+Ftv5zrCaDw1wtXrq8a7/eS5B+3TzL
k8c1SVVDPIbmViAZNRmnkwCPBsIF9xIfMFhxz4BTJrm/Lt2Hv1GcRBQx/yRK89sj
JiGnsTna//4mPGRGYw+dRCq4tbyr8HbBKdJmbzOCb4CPKfwAMKUpd4e0Ao7jh/BU
EML7B3BEzv5Jw/BT7B39wAfDyhq32PnRnZefF+7pAmpkklHbckBtZtWn02zwQazv
5z62tszZee2i4BouJiyFnb30F6Pebs4=
-----END CERTIFICATE-----
`;

const dir = fs.mkdtempSync(join(tmpdir(), "scr-x509-"));
const certPath = join(dir, "cert.pem");
fs.writeFileSync(certPath, PEM);

const cert = fs.readFileSync(certPath);
// The windows-ca shape: the certificate BOUND to a local first.
const certificate = new crypto.X509Certificate(cert);
const fingerprint = certificate.fingerprint;
console.log("fingerprint:", fingerprint);
console.log("lower:", fingerprint.replace(/:/g, "").toLowerCase());

// The PEM-string form (readFileSync with an encoding).
const viaString = new crypto.X509Certificate(fs.readFileSync(certPath, "utf-8"));
console.log("string form agrees:", viaString.fingerprint === fingerprint);

// Garbage input: Node's exact PEM error, catchable.
fs.writeFileSync(certPath, "not a certificate");
try {
  const bad = new crypto.X509Certificate(fs.readFileSync(certPath)).fingerprint;
  console.log("no throw:", bad);
} catch (e) {
  if (e instanceof Error) console.log("throws:", e.message);
}
fs.rmSync(dir, { recursive: true, force: true });
