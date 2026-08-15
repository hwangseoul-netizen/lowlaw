import crypto from 'crypto';
const PRIV = process.env.SEAL_PRIVATE_KEY || `-----BEGIN PRIVATE KEY-----
MC4CAQAwBQYDK2VwBCIEINADYVO+blvp+4WIHlbt+cvCM8ShEYK28A9bL2GygLxX
-----END PRIVATE KEY-----`;
const PUB = process.env.SEAL_PUBLIC_KEY || `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAjkwj9LZw47h7R3cENeLAtHSx0uO+evUSD8BxyMrPons=
-----END PUBLIC KEY-----`;
const SCHEMA = 'lowlaw.seal.v1';
const enc = b => Buffer.from(b).toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const dec = s => Buffer.from(String(s).replace(/-/g,'+').replace(/_/g,'/'),'base64');
const canon = p => JSON.stringify(p, Object.keys(p).sort());
export default function handler(req, res) {
res.setHeader('Access-Control-Allow-Origin','*');
res.setHeader('Access-Control-Allow-Headers','content-type');
if (req.method === 'OPTIONS') return res.status(204).end();
if (req.method !== 'POST') return res.status(405).json({error:'POST only'});
const b = req.body || {};
if (b.action === 'verify') {
let r;
try { r = JSON.parse(dec(b.token).toString('utf8')); }
catch { return res.status(400).json({verified:false, means:'That receipt could not be read.'}); }
const p = r && r.payload, s = r && r.signature;
if (!p || !s) return res.status(400).json({verified:false, means:'That receipt is incomplete.'});
let ok = false;
try { ok = crypto.verify(null, Buffer.from(canon(p)), PUB, dec(s)); } catch { ok = false; }
return res.status(200).json({
verified: ok,
payload: ok ? p : null,
content_match: b.sha256 ? String(b.sha256).toLowerCase() === p.sha256 : null,
means: ok
? 'This receipt was issued by LOWLAW and has not been altered since it was signed. It says nothing about whether the content is true.'
: 'This receipt does not carry a valid LOWLAW signature.'
});
}
const sha = b.sha256;
if (!sha || !/^[a-f0-9]{64}$/.test(sha)) return res.status(400).json({error:'sha256 must be 64 lowercase hex characters'});
const payload = {
schema: SCHEMA,
sha256: sha,
name: typeof b.name === 'string' ? b.name.slice(0,200) : null,
bytes: Number.isFinite(b.bytes) ? b.bytes : null,
kind: typeof b.kind === 'string' ? b.kind.slice(0,40) : 'file',
sealed_at: new Date().toISOString(),
modified_by_lowlaw: false
};
const sig = crypto.sign(null, Buffer.from(canon(payload)), PRIV);
const token = enc(Buffer.from(JSON.stringify({payload, signature: enc(sig), alg:'Ed25519'})));
const id = sha.slice(0,4).toUpperCase() + '-' + sha.slice(4,8).toUpperCase();
return res.status(200).json({id, receipt:{payload}, token});
}
