// scripts/update.js  (CommonJS 版)
const { webcrypto: crypto } = require('crypto');
const { writeFileSync }     = require('fs');
const { join }              = require('path');

const OUTPUT_FILE = join(__dirname, '..', 'Fan');

const PRIVATE_KEY_PEM = `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCUHMdMJFSzOnuO
OIRY3UZcWTXfCexZ15UOXjZB8fvgLxyvTN5gTh+Wo6SNb48ojuIw/p3fltMom3ZW
eyeKD5QB/sL+LgWHs10GrCE73TYwsmhdXUCyZhZX7VK8meqsFBBf7SDTPcJ6lfup
XsFstxQWV9nq2FQAQLSzUVU46KGjADKV7cEwamQ+C+0ix74EfDYvaZohfUtHEMie
MB5xYePJnxPS1qqP4Ftsgco5/hZfscsf9lR4+LSDAj+krNRo2j6Kto030Kxrwymi
7KbfVvlXujYsoh+LlhEXEAxHYUTbllKvcKRWvEiMNkW64+lFMclVIkHs0KjRPrOY
0nfy0iVJAgMBAAECggEAQdrP5HOM84nv0OshMW/lbn89/Dcpz0KTJGnQXx7seqAH
9YvMnm5uDikhq79sHED3oog7guRJbBc/lTE6AeFuUjrH0YN98vnVxXc4aakwhJN2
4vhpIUlR6vN7I5+eH7fmFfjV7QbbV20jkgmvIBsBA/Q40Pox01Dx538k0OJiqBnr
h+jdL99lURPYkG3/mfT3R2pG+vIP2PYydW0pi87f6AK4pxFZnAF82MuGcCM+Byr0
ga8/pSV4wmkU+kezK4P6RfbSi4tuUszvaBWcczAgqEN3yltYwN0v/JSk2oHcBSx4
phJV/RGGGg/IRHt4d0zi3PRfTrx2YI7AEgc1TCVSxwKBgQDMTdr6j64IMtWM45TG
QMcwtZLDutdCpvkVBGtpzdj3DWP2ZYAWQoO1ko1T2IOKkNWIXO3PEmX2fnTvyERk
XPQeiLf085TNnfnzKvCG8DrQwHZqdb2Wt1M2FJkYvxd14CALK2l6yHUEAyNveUoD
VcmtOapYvCndo9d7JpmoiCzelwKBgQC5lwKqyhwLEvbKegMMSZKrL5AsdKbp/r/r
Vovgw2wBhtmj7Gr8bnkS9nAmI3mETCFolxmbDHPK2Yt6D/+LtIcOdalI6Ox93nHx
IV2kPQff5czWa78IiiGPeJYrp/ZBZK33egWJWPAsQsZAms0GXAQ9vSomUUBi8rUT
Lkc03c13HwKBgQCsSqv0yd5WA6ib3ADHADH7HeTbM2H9T5qW4tdCrtnd3mkCja5r
F0TDhwewQdMMs/+fs97I1hcuvI4Y+KbUjJ9CcMHRzOkcTbFQJFIbOdQf3279cLWl
uIxv+wbxG5XJTm03fjDB3vLvo0Xq6DpGfb5KW2sQ0f3scBN0Q6Upv003mQKBgFPk
oG8Fx6F15BtpBiGyzFsXuAtwe9dAsg6246opjJQwGgfQohgT9CUPQ2jqFk8oft2h
mBCPk3Q53KPDwZesdnSh2XE84VKQkF8Y3xSUBhA+99ZhhExe7IbHUtLPLTEoSr+Y
6BHLI15OnQGtOErMo5oo/XmutvVDk3jlLYkHTo6vAoGBAKaT2qIDOStdCrwRbvD1
SF/pcEytM0rQhiJYmBXKeayUsICTxnSdixb42BSRDTL14F6Jzv2GcGRh80Jx1DVL
6Dmv27MEXx3OnCiHmTCHi3CxqKXhOvJGQCbtLLjluP6pAvQCZ7s3KB6/zS4v/fIv
zygLJrETnjWa1iAMPLnIB9lB
-----END PRIVATE KEY-----`;

const CONFIG_URLS = [
  'https://gitlab.com/zhifan999/fq/-/raw/main/config.json',
  'https://www.githubip.xyz/config.json',
];

const FLAG_MAP = {
  US:'🇺🇸', HK:'🇭🇰', JP:'🇯🇵', KR:'🇰🇷',
  TW:'🇹🇼', SG:'🇸🇬', DE:'🇩🇪', FR:'🇫🇷',
  GB:'🇬🇧', AU:'🇦🇺', CA:'🇨🇦', NL:'🇳🇱',
};

function pemToBuffer(pem) {
  return Buffer.from(pem.replace(/-----[^-]+-----/g, '').replace(/\s/g, ''), 'base64');
}
function b64ToBuffer(b64) {
  return Buffer.from(b64, 'base64');
}

// ── 拉取并解密远程配置 ──────────────────────────────────────
async function fetchAndDecrypt() {
  let envelope = null;
  for (const url of CONFIG_URLS) {
    try {
      console.log(`⏳ 正在从 ${url} 拉取配置…`);
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (res.ok) { envelope = await res.json(); console.log('✅ 拉取成功'); break; }
    } catch (e) { console.warn(`⚠️  ${url} 失败: ${e.message}`); }
  }
  if (!envelope) throw new Error('❌ 所有配置源均失败');

  const privateKey = await crypto.subtle.importKey(
    'pkcs8', pemToBuffer(PRIVATE_KEY_PEM),
    { name: 'RSA-OAEP', hash: 'SHA-1' }, false, ['decrypt']
  );
  const aesKeyBuf = await crypto.subtle.decrypt(
    { name: 'RSA-OAEP' }, privateKey, b64ToBuffer(envelope.key)
  );
  const aesKey = await crypto.subtle.importKey(
    'raw', aesKeyBuf, { name: 'AES-CBC' }, false, ['decrypt']
  );
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-CBC', iv: b64ToBuffer(envelope.iv) },
    aesKey, b64ToBuffer(envelope.data)
  );
  return JSON.parse(new TextDecoder().decode(decrypted));
}

// ── 转换单个节点为订阅 URI ──────────────────────────────────
// 格式：https://BASE64(server:port)#emoji节点名
// Base64 末尾 = 去掉（= 在 URL hostname 中非法）
function nodeToURI(node) {
  const b64host = Buffer.from(`${node.server}:${node.port}`)
    .toString('base64')
    .replace(/=+$/, '');
  const emoji = FLAG_MAP[node.flag] || '🌐';
  const label = encodeURIComponent(`${emoji} ${node.name}`);
  return `https://${b64host}#${label}`;
}

// ── 主流程 ──────────────────────────────────────────────────
async function main() {
  try {
    const config = await fetchAndDecrypt();

    // ① 输出原始节点信息（解密后的 JSON）
    console.log('\n════════════════════════════════════════');
    console.log('📋 原始节点信息（解密后）:');
    console.log('════════════════════════════════════════');
    console.log(JSON.stringify(config, null, 2));

    // ② 转换并输出每行 URI 预览
    const uris = config.nodes.map(nodeToURI);
    console.log('\n════════════════════════════════════════');
    console.log(`🔄 转换后订阅格式（共 ${uris.length} 条）:`);
    console.log('════════════════════════════════════════');
    uris.forEach((uri, i) => {
      console.log(`第${String(i + 1).padStart(2)}行: ${uri}`);
    });

    // ③ 写入 Fan 文件（明文，每行一个 URI）
    writeFileSync(OUTPUT_FILE, uris.join('\n'), 'utf-8');
    console.log(`\n💾 已写入 Fan 文件: ${OUTPUT_FILE}`);
    console.log('🎉 完成！');

  } catch (e) {
    console.error(`❌ 失败: ${e.message}`);
    process.exit(1);
  }
}

main();
