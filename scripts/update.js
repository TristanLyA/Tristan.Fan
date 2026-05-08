// scripts/update.js  (CommonJS 版)
const { webcrypto: crypto } = require('crypto');
const { writeFileSync } = require('fs');
const { join } = require('path');

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
  US: '🇺🇸', HK: '🇭🇰', JP: '🇯🇵', KR: '🇰🇷',
  TW: '🇹🇼', SG: '🇸🇬', DE: '🇩🇪', FR: '🇫🇷',
  GB: '🇬🇧', AU: '🇦🇺', CA: '🇨🇦', NL: '🇳🇱',
};

function pemToBuffer(pem) {
  const b64 = pem.replace(/-----[^-]+-----/g, '').replace(/\s/g, '');
  return Buffer.from(b64, 'base64');
}
function b64ToBuffer(b64) {
  return Buffer.from(b64, 'base64');
}

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

function generateClashYAML(config) {
  const { nodes, version, updated } = config;
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

  const proxyLines = nodes.map(n => {
    const emoji = FLAG_MAP[n.flag] || '🌐';
    return `  - name: "${emoji} ${n.name}"\n    type: http\n    server: ${n.server}\n    port: ${n.port}\n    tls: true`;
  }).join('\n\n');

  const nameList = nodes.map(n => `      - "${FLAG_MAP[n.flag] || '🌐'} ${n.name}"`).join('\n');

  return `# Fan 自动订阅 | 节点数: ${nodes.length}
# 配置版本: v${version} | 远程更新时间: ${updated}
# 本地同步时间: ${now} UTC
# ⚠️ 此文件由 GitHub Actions 自动生成，请勿手动编辑

mixed-port: 7890
allow-lan: false
mode: rule
log-level: info
external-controller: 127.0.0.1:9090

proxies:
${proxyLines}

proxy-groups:
  - name: "🚀 节点选择"
    type: select
    proxies:
      - "♻️ 自动选择"
      - "🎯 直连"
${nameList}

  - name: "♻️ 自动选择"
    type: url-test
    proxies:
${nameList}
    url: "http://www.gstatic.com/generate_204"
    interval: 300
    tolerance: 50

  - name: "🎯 直连"
    type: select
    proxies:
      - DIRECT

rules:
    - 'IP-CIDR,1.1.1.1/32,OvO,no-resolve'
    - 'IP-CIDR,8.8.8.8/32,OvO,no-resolve'
    - 'DOMAIN-SUFFIX,services.googleapis.cn,OvO'
    - 'DOMAIN-SUFFIX,xn--ngstr-lra8j.com,OvO'
    - 'DOMAIN,safebrowsing.urlsec.qq.com,DIRECT'
    - 'DOMAIN,safebrowsing.googleapis.com,DIRECT'
    - 'DOMAIN,developer.apple.com,OvO'
    - 'DOMAIN-SUFFIX,digicert.com,OvO'
    - 'DOMAIN,ocsp.apple.com,OvO'
    - 'DOMAIN,ocsp.comodoca.com,OvO'
    - 'DOMAIN,ocsp.usertrust.com,OvO'
    - 'DOMAIN,ocsp.sectigo.com,OvO'
    - 'DOMAIN,ocsp.verisign.net,OvO'
    - 'DOMAIN-SUFFIX,apple-dns.net,OvO'
    - 'DOMAIN,testflight.apple.com,OvO'
    - 'DOMAIN,sandbox.itunes.apple.com,OvO'
    - 'DOMAIN,itunes.apple.com,OvO'
    - 'DOMAIN-SUFFIX,apps.apple.com,OvO'
    - 'DOMAIN-SUFFIX,blobstore.apple.com,OvO'
    - 'DOMAIN,cvws.icloud-content.com,OvO'
    - 'DOMAIN-SUFFIX,mzstatic.com,DIRECT'
    - 'DOMAIN-SUFFIX,itunes.apple.com,DIRECT'
    - 'DOMAIN-SUFFIX,icloud.com,DIRECT'
    - 'DOMAIN-SUFFIX,icloud-content.com,DIRECT'
    - 'DOMAIN-SUFFIX,me.com,DIRECT'
    - 'DOMAIN-SUFFIX,aaplimg.com,DIRECT'
    - 'DOMAIN-SUFFIX,cdn20.com,DIRECT'
    - 'DOMAIN-SUFFIX,cdn-apple.com,DIRECT'
    - 'DOMAIN-SUFFIX,akadns.net,DIRECT'
    - 'DOMAIN-SUFFIX,akamaiedge.net,DIRECT'
    - 'DOMAIN-SUFFIX,edgekey.net,DIRECT'
    - 'DOMAIN-SUFFIX,mwcloudcdn.com,DIRECT'
    - 'DOMAIN-SUFFIX,mwcname.com,DIRECT'
    - 'DOMAIN-SUFFIX,apple.com,DIRECT'
    - 'DOMAIN-SUFFIX,apple-cloudkit.com,DIRECT'
    - 'DOMAIN-SUFFIX,apple-mapkit.com,DIRECT'
    - 'DOMAIN,cn.bing.com,DIRECT'
    - 'DOMAIN-SUFFIX,126.com,DIRECT'
    - 'DOMAIN-SUFFIX,126.net,DIRECT'
    - 'DOMAIN-SUFFIX,127.net,DIRECT'
    - 'DOMAIN-SUFFIX,163.com,DIRECT'
    - 'DOMAIN-SUFFIX,360buyimg.com,DIRECT'
    - 'DOMAIN-SUFFIX,36kr.com,DIRECT'
    - 'DOMAIN-SUFFIX,acfun.tv,DIRECT'
    - 'DOMAIN-SUFFIX,air-matters.com,DIRECT'
    - 'DOMAIN-SUFFIX,aixifan.com,DIRECT'
    - 'DOMAIN-KEYWORD,alicdn,DIRECT'
    - 'DOMAIN-KEYWORD,alipay,DIRECT'
    - 'DOMAIN-KEYWORD,taobao,DIRECT'
    - 'DOMAIN-SUFFIX,amap.com,DIRECT'
    - 'DOMAIN-SUFFIX,autonavi.com,DIRECT'
    - 'DOMAIN-KEYWORD,baidu,DIRECT'
    - 'DOMAIN-SUFFIX,bdimg.com,DIRECT'
    - 'DOMAIN-SUFFIX,bdstatic.com,DIRECT'
    - 'DOMAIN-SUFFIX,bilibili.com,DIRECT'
    - 'DOMAIN-SUFFIX,bilivideo.com,DIRECT'
    - 'DOMAIN-SUFFIX,caiyunapp.com,DIRECT'
    - 'DOMAIN-SUFFIX,clouddn.com,DIRECT'
    - 'DOMAIN-SUFFIX,cnbeta.com,DIRECT'
    - 'DOMAIN-SUFFIX,cnbetacdn.com,DIRECT'
    - 'DOMAIN-SUFFIX,cootekservice.com,DIRECT'
    - 'DOMAIN-SUFFIX,csdn.net,DIRECT'
    - 'DOMAIN-SUFFIX,ctrip.com,DIRECT'
    - 'DOMAIN-SUFFIX,dgtle.com,DIRECT'
    - 'DOMAIN-SUFFIX,dianping.com,DIRECT'
    - 'DOMAIN-SUFFIX,douban.com,DIRECT'
    - 'DOMAIN-SUFFIX,doubanio.com,DIRECT'
    - 'DOMAIN-SUFFIX,duokan.com,DIRECT'
    - 'DOMAIN-SUFFIX,easou.com,DIRECT'
    - 'DOMAIN-SUFFIX,ele.me,DIRECT'
    - 'DOMAIN-SUFFIX,feng.com,DIRECT'
    - 'DOMAIN-SUFFIX,fir.im,DIRECT'
    - 'DOMAIN-SUFFIX,frdic.com,DIRECT'
    - 'DOMAIN-SUFFIX,g-cores.com,DIRECT'
    - 'DOMAIN-SUFFIX,godic.net,DIRECT'
    - 'DOMAIN-SUFFIX,gtimg.com,DIRECT'
    - 'DOMAIN,cdn.hockeyapp.net,DIRECT'
    - 'DOMAIN-SUFFIX,hongxiu.com,DIRECT'
    - 'DOMAIN-SUFFIX,hxcdn.net,DIRECT'
    - 'DOMAIN-SUFFIX,iciba.com,DIRECT'
    - 'DOMAIN-SUFFIX,ifeng.com,DIRECT'
    - 'DOMAIN-SUFFIX,ifengimg.com,DIRECT'
    - 'DOMAIN-SUFFIX,ipip.net,DIRECT'
    - 'DOMAIN-SUFFIX,iqiyi.com,DIRECT'
    - 'DOMAIN-SUFFIX,jd.com,DIRECT'
    - 'DOMAIN-SUFFIX,jianshu.com,DIRECT'
    - 'DOMAIN-SUFFIX,knewone.com,DIRECT'
    - 'DOMAIN-SUFFIX,le.com,DIRECT'
    - 'DOMAIN-SUFFIX,lecloud.com,DIRECT'
    - 'DOMAIN-SUFFIX,lemicp.com,DIRECT'
    - 'DOMAIN-SUFFIX,licdn.com,DIRECT'
    - 'DOMAIN-SUFFIX,luoo.net,DIRECT'
    - 'DOMAIN-SUFFIX,meituan.com,DIRECT'
    - 'DOMAIN-SUFFIX,meituan.net,DIRECT'
    - 'DOMAIN-SUFFIX,mi.com,DIRECT'
    - 'DOMAIN-SUFFIX,miaopai.com,DIRECT'
    - 'DOMAIN-SUFFIX,microsoft.com,DIRECT'
    - 'DOMAIN-SUFFIX,microsoftonline.com,DIRECT'
    - 'DOMAIN-SUFFIX,miui.com,DIRECT'
    - 'DOMAIN-SUFFIX,miwifi.com,DIRECT'
    - 'DOMAIN-SUFFIX,mob.com,DIRECT'
    - 'DOMAIN-SUFFIX,netease.com,DIRECT'
    - 'DOMAIN-SUFFIX,office.com,DIRECT'
    - 'DOMAIN-SUFFIX,office365.com,DIRECT'
    - 'DOMAIN-KEYWORD,officecdn,DIRECT'
    - 'DOMAIN-SUFFIX,oschina.net,DIRECT'
    - 'DOMAIN-SUFFIX,ppsimg.com,DIRECT'
    - 'DOMAIN-SUFFIX,pstatp.com,DIRECT'
    - 'DOMAIN-SUFFIX,qcloud.com,DIRECT'
    - 'DOMAIN-SUFFIX,qdaily.com,DIRECT'
    - 'DOMAIN-SUFFIX,qdmm.com,DIRECT'
    - 'DOMAIN-SUFFIX,qhimg.com,DIRECT'
    - 'DOMAIN-SUFFIX,qhres.com,DIRECT'
    - 'DOMAIN-SUFFIX,qidian.com,DIRECT'
    - 'DOMAIN-SUFFIX,qihucdn.com,DIRECT'
    - 'DOMAIN-SUFFIX,qiniu.com,DIRECT'
    - 'DOMAIN-SUFFIX,qiniucdn.com,DIRECT'
    - 'DOMAIN-SUFFIX,qiyipic.com,DIRECT'
    - 'DOMAIN-SUFFIX,qq.com,DIRECT'
    - 'DOMAIN-SUFFIX,qqurl.com,DIRECT'
    - 'DOMAIN-SUFFIX,rarbg.to,DIRECT'
    - 'DOMAIN-SUFFIX,ruguoapp.com,DIRECT'
    - 'DOMAIN-SUFFIX,segmentfault.com,DIRECT'
    - 'DOMAIN-SUFFIX,sinaapp.com,DIRECT'
    - 'DOMAIN-SUFFIX,smzdm.com,DIRECT'
    - 'DOMAIN-SUFFIX,snapdrop.net,DIRECT'
    - 'DOMAIN-SUFFIX,sogou.com,DIRECT'
    - 'DOMAIN-SUFFIX,sogoucdn.com,DIRECT'
    - 'DOMAIN-SUFFIX,sohu.com,DIRECT'
    - 'DOMAIN-SUFFIX,soku.com,DIRECT'
    - 'DOMAIN-SUFFIX,speedtest.net,DIRECT'
    - 'DOMAIN-SUFFIX,sspai.com,DIRECT'
    - 'DOMAIN-SUFFIX,suning.com,DIRECT'
    - 'DOMAIN-SUFFIX,taobao.com,DIRECT'
    - 'DOMAIN-SUFFIX,tencent.com,DIRECT'
    - 'DOMAIN-SUFFIX,tenpay.com,DIRECT'
    - 'DOMAIN-SUFFIX,tianyancha.com,DIRECT'
    - 'DOMAIN-SUFFIX,tmall.com,DIRECT'
    - 'DOMAIN-SUFFIX,tudou.com,DIRECT'
    - 'DOMAIN-SUFFIX,umetrip.com,DIRECT'
    - 'DOMAIN-SUFFIX,upaiyun.com,DIRECT'
    - 'DOMAIN-SUFFIX,upyun.com,DIRECT'
    - 'DOMAIN-SUFFIX,veryzhun.com,DIRECT'
    - 'DOMAIN-SUFFIX,weather.com,DIRECT'
    - 'DOMAIN-SUFFIX,weibo.com,DIRECT'
    - 'DOMAIN-SUFFIX,xiami.com,DIRECT'
    - 'DOMAIN-SUFFIX,xiami.net,DIRECT'
    - 'DOMAIN-SUFFIX,xiaomicp.com,DIRECT'
    - 'DOMAIN-SUFFIX,ximalaya.com,DIRECT'
    - 'DOMAIN-SUFFIX,xmcdn.com,DIRECT'
    - 'DOMAIN-SUFFIX,xunlei.com,DIRECT'
    - 'DOMAIN-SUFFIX,yhd.com,DIRECT'
    - 'DOMAIN-SUFFIX,yihaodianimg.com,DIRECT'
    - 'DOMAIN-SUFFIX,yinxiang.com,DIRECT'
    - 'DOMAIN-SUFFIX,ykimg.com,DIRECT'
    - 'DOMAIN-SUFFIX,youdao.com,DIRECT'
    - 'DOMAIN-SUFFIX,youku.com,DIRECT'
    - 'DOMAIN-SUFFIX,zealer.com,DIRECT'
    - 'DOMAIN-SUFFIX,zhihu.com,DIRECT'
    - 'DOMAIN-SUFFIX,zhimg.com,DIRECT'
    - 'DOMAIN-SUFFIX,zimuzu.tv,DIRECT'
    - 'DOMAIN-SUFFIX,zoho.com,DIRECT'
    - 'DOMAIN-KEYWORD,amazon,OvO'
    - 'DOMAIN-KEYWORD,google,OvO'
    - 'DOMAIN-KEYWORD,gmail,OvO'
    - 'DOMAIN-KEYWORD,youtube,OvO'
    - 'DOMAIN-KEYWORD,facebook,OvO'
    - 'DOMAIN-SUFFIX,fb.me,OvO'
    - 'DOMAIN-SUFFIX,fbcdn.net,OvO'
    - 'DOMAIN-KEYWORD,twitter,OvO'
    - 'DOMAIN-KEYWORD,instagram,OvO'
    - 'DOMAIN-KEYWORD,dropbox,OvO'
    - 'DOMAIN-SUFFIX,twimg.com,OvO'
    - 'DOMAIN-KEYWORD,blogspot,OvO'
    - 'DOMAIN-SUFFIX,youtu.be,OvO'
    - 'DOMAIN-KEYWORD,whatsapp,OvO'
    - 'DOMAIN-KEYWORD,admarvel,REJECT'
    - 'DOMAIN-KEYWORD,admaster,REJECT'
    - 'DOMAIN-KEYWORD,adsage,REJECT'
    - 'DOMAIN-KEYWORD,adsmogo,REJECT'
    - 'DOMAIN-KEYWORD,adsrvmedia,REJECT'
    - 'DOMAIN-KEYWORD,adwords,REJECT'
    - 'DOMAIN-KEYWORD,adservice,REJECT'
    - 'DOMAIN-SUFFIX,appsflyer.com,REJECT'
    - 'DOMAIN-KEYWORD,domob,REJECT'
    - 'DOMAIN-SUFFIX,doubleclick.net,REJECT'
    - 'DOMAIN-KEYWORD,duomeng,REJECT'
    - 'DOMAIN-KEYWORD,dwtrack,REJECT'
    - 'DOMAIN-KEYWORD,guanggao,REJECT'
    - 'DOMAIN-KEYWORD,lianmeng,REJECT'
    - 'DOMAIN-SUFFIX,mmstat.com,REJECT'
    - 'DOMAIN-KEYWORD,mopub,REJECT'
    - 'DOMAIN-KEYWORD,omgmta,REJECT'
    - 'DOMAIN-KEYWORD,openx,REJECT'
    - 'DOMAIN-KEYWORD,partnerad,REJECT'
    - 'DOMAIN-KEYWORD,pingfore,REJECT'
    - 'DOMAIN-KEYWORD,supersonicads,REJECT'
    - 'DOMAIN-KEYWORD,uedas,REJECT'
    - 'DOMAIN-KEYWORD,umeng,REJECT'
    - 'DOMAIN-KEYWORD,usage,REJECT'
    - 'DOMAIN-SUFFIX,vungle.com,REJECT'
    - 'DOMAIN-KEYWORD,wlmonitor,REJECT'
    - 'DOMAIN-KEYWORD,zjtoolbar,REJECT'
    - 'DOMAIN-SUFFIX,9to5mac.com,OvO'
    - 'DOMAIN-SUFFIX,abpchina.org,OvO'
    - 'DOMAIN-SUFFIX,adblockplus.org,OvO'
    - 'DOMAIN-SUFFIX,adobe.com,OvO'
    - 'DOMAIN-SUFFIX,akamaized.net,OvO'
    - 'DOMAIN-SUFFIX,alfredapp.com,OvO'
    - 'DOMAIN-SUFFIX,amplitude.com,OvO'
    - 'DOMAIN-SUFFIX,ampproject.org,OvO'
    - 'DOMAIN-SUFFIX,android.com,OvO'
    - 'DOMAIN-SUFFIX,angularjs.org,OvO'
    - 'DOMAIN-SUFFIX,aolcdn.com,OvO'
    - 'DOMAIN-SUFFIX,apkpure.com,OvO'
    - 'DOMAIN-SUFFIX,appledaily.com,OvO'
    - 'DOMAIN-SUFFIX,appshopper.com,OvO'
    - 'DOMAIN-SUFFIX,appspot.com,OvO'
    - 'DOMAIN-SUFFIX,arcgis.com,OvO'
    - 'DOMAIN-SUFFIX,archive.org,OvO'
    - 'DOMAIN-SUFFIX,armorgames.com,OvO'
    - 'DOMAIN-SUFFIX,aspnetcdn.com,OvO'
    - 'DOMAIN-SUFFIX,att.com,OvO'
    - 'DOMAIN-SUFFIX,awsstatic.com,OvO'
    - 'DOMAIN-SUFFIX,azureedge.net,OvO'
    - 'DOMAIN-SUFFIX,azurewebsites.net,OvO'
    - 'DOMAIN-SUFFIX,bing.com,OvO'
    - 'DOMAIN-SUFFIX,bintray.com,OvO'
    - 'DOMAIN-SUFFIX,bit.com,OvO'
    - 'DOMAIN-SUFFIX,bit.ly,OvO'
    - 'DOMAIN-SUFFIX,bitbucket.org,OvO'
    - 'DOMAIN-SUFFIX,bjango.com,OvO'
    - 'DOMAIN-SUFFIX,bkrtx.com,OvO'
    - 'DOMAIN-SUFFIX,blog.com,OvO'
    - 'DOMAIN-SUFFIX,blogcdn.com,OvO'
    - 'DOMAIN-SUFFIX,blogger.com,OvO'
    - 'DOMAIN-SUFFIX,blogsmithmedia.com,OvO'
    - 'DOMAIN-SUFFIX,blogspot.com,OvO'
    - 'DOMAIN-SUFFIX,blogspot.hk,OvO'
    - 'DOMAIN-SUFFIX,bloomberg.com,OvO'
    - 'DOMAIN-SUFFIX,box.com,OvO'
    - 'DOMAIN-SUFFIX,box.net,OvO'
    - 'DOMAIN-SUFFIX,cachefly.net,OvO'
    - 'DOMAIN-SUFFIX,chromium.org,OvO'
    - 'DOMAIN-SUFFIX,cl.ly,OvO'
    - 'DOMAIN-SUFFIX,cloudflare.com,OvO'
    - 'DOMAIN-SUFFIX,cloudfront.net,OvO'
    - 'DOMAIN-SUFFIX,cloudmagic.com,OvO'
    - 'DOMAIN-SUFFIX,cmail19.com,OvO'
    - 'DOMAIN-SUFFIX,cnet.com,OvO'
    - 'DOMAIN-SUFFIX,cocoapods.org,OvO'
    - 'DOMAIN-SUFFIX,comodoca.com,OvO'
    - 'DOMAIN-SUFFIX,crashlytics.com,OvO'
    - 'DOMAIN-SUFFIX,culturedcode.com,OvO'
    - 'DOMAIN-SUFFIX,d.pr,OvO'
    - 'DOMAIN-SUFFIX,danilo.to,OvO'
    - 'DOMAIN-SUFFIX,dayone.me,OvO'
    - 'DOMAIN-SUFFIX,db.tt,OvO'
    - 'DOMAIN-SUFFIX,deskconnect.com,OvO'
    - 'DOMAIN-SUFFIX,disq.us,OvO'
    - 'DOMAIN-SUFFIX,disqus.com,OvO'
    - 'DOMAIN-SUFFIX,disquscdn.com,OvO'
    - 'DOMAIN-SUFFIX,dnsimple.com,OvO'
    - 'DOMAIN-SUFFIX,docker.com,OvO'
    - 'DOMAIN-SUFFIX,dribbble.com,OvO'
    - 'DOMAIN-SUFFIX,droplr.com,OvO'
    - 'DOMAIN-SUFFIX,duckduckgo.com,OvO'
    - 'DOMAIN-SUFFIX,dueapp.com,OvO'
    - 'DOMAIN-SUFFIX,dytt8.net,OvO'
    - 'DOMAIN-SUFFIX,edgecastcdn.net,OvO'
    - 'DOMAIN-SUFFIX,edgekey.net,OvO'
    - 'DOMAIN-SUFFIX,edgesuite.net,OvO'
    - 'DOMAIN-SUFFIX,engadget.com,OvO'
    - 'DOMAIN-SUFFIX,entrust.net,OvO'
    - 'DOMAIN-SUFFIX,eurekavpt.com,OvO'
    - 'DOMAIN-SUFFIX,evernote.com,OvO'
    - 'DOMAIN-SUFFIX,fabric.io,OvO'
    - 'DOMAIN-SUFFIX,fast.com,OvO'
    - 'DOMAIN-SUFFIX,fastly.net,OvO'
    - 'DOMAIN-SUFFIX,fc2.com,OvO'
    - 'DOMAIN-SUFFIX,feedburner.com,OvO'
    - 'DOMAIN-SUFFIX,feedly.com,OvO'
    - 'DOMAIN-SUFFIX,feedsportal.com,OvO'
    - 'DOMAIN-SUFFIX,fiftythree.com,OvO'
    - 'DOMAIN-SUFFIX,firebaseio.com,OvO'
    - 'DOMAIN-SUFFIX,flexibits.com,OvO'
    - 'DOMAIN-SUFFIX,flickr.com,OvO'
    - 'DOMAIN-SUFFIX,flipboard.com,OvO'
    - 'DOMAIN-SUFFIX,g.co,OvO'
    - 'DOMAIN-SUFFIX,gabia.net,OvO'
    - 'DOMAIN-SUFFIX,geni.us,OvO'
    - 'DOMAIN-SUFFIX,gfx.ms,OvO'
    - 'DOMAIN-SUFFIX,ggpht.com,OvO'
    - 'DOMAIN-SUFFIX,ghostnoteapp.com,OvO'
    - 'DOMAIN-SUFFIX,git.io,OvO'
    - 'DOMAIN-KEYWORD,github,OvO'
    - 'DOMAIN-SUFFIX,globalsign.com,OvO'
    - 'DOMAIN-SUFFIX,gmodules.com,OvO'
    - 'DOMAIN-SUFFIX,godaddy.com,OvO'
    - 'DOMAIN-SUFFIX,golang.org,OvO'
    - 'DOMAIN-SUFFIX,gongm.in,OvO'
    - 'DOMAIN-SUFFIX,goo.gl,OvO'
    - 'DOMAIN-SUFFIX,goodreaders.com,OvO'
    - 'DOMAIN-SUFFIX,goodreads.com,OvO'
    - 'DOMAIN-SUFFIX,gravatar.com,OvO'
    - 'DOMAIN-SUFFIX,gstatic.com,OvO'
    - 'DOMAIN-SUFFIX,gvt0.com,OvO'
    - 'DOMAIN-SUFFIX,hockeyapp.net,OvO'
    - 'DOMAIN-SUFFIX,hotmail.com,OvO'
    - 'DOMAIN-SUFFIX,icons8.com,OvO'
    - 'DOMAIN-SUFFIX,ifixit.com,OvO'
    - 'DOMAIN-SUFFIX,ift.tt,OvO'
    - 'DOMAIN-SUFFIX,ifttt.com,OvO'
    - 'DOMAIN-SUFFIX,iherb.com,OvO'
    - 'DOMAIN-SUFFIX,imageshack.us,OvO'
    - 'DOMAIN-SUFFIX,img.ly,OvO'
    - 'DOMAIN-SUFFIX,imgur.com,OvO'
    - 'DOMAIN-SUFFIX,imore.com,OvO'
    - 'DOMAIN-SUFFIX,instapaper.com,OvO'
    - 'DOMAIN-SUFFIX,ipn.li,OvO'
    - 'DOMAIN-SUFFIX,is.gd,OvO'
    - 'DOMAIN-SUFFIX,issuu.com,OvO'
    - 'DOMAIN-SUFFIX,itgonglun.com,OvO'
    - 'DOMAIN-SUFFIX,itun.es,OvO'
    - 'DOMAIN-SUFFIX,ixquick.com,OvO'
    - 'DOMAIN-SUFFIX,j.mp,OvO'
    - 'DOMAIN-SUFFIX,js.revsci.net,OvO'
    - 'DOMAIN-SUFFIX,jshint.com,OvO'
    - 'DOMAIN-SUFFIX,jtvnw.net,OvO'
    - 'DOMAIN-SUFFIX,justgetflux.com,OvO'
    - 'DOMAIN-SUFFIX,kat.cr,OvO'
    - 'DOMAIN-SUFFIX,klip.me,OvO'
    - 'DOMAIN-SUFFIX,libsyn.com,OvO'
    - 'DOMAIN-SUFFIX,linkedin.com,OvO'
    - 'DOMAIN-SUFFIX,line-apps.com,OvO'
    - 'DOMAIN-SUFFIX,linode.com,OvO'
    - 'DOMAIN-SUFFIX,lithium.com,OvO'
    - 'DOMAIN-SUFFIX,littlehj.com,OvO'
    - 'DOMAIN-SUFFIX,live.com,OvO'
    - 'DOMAIN-SUFFIX,live.net,OvO'
    - 'DOMAIN-SUFFIX,livefilestore.com,OvO'
    - 'DOMAIN-SUFFIX,llnwd.net,OvO'
    - 'DOMAIN-SUFFIX,macid.co,OvO'
    - 'DOMAIN-SUFFIX,macromedia.com,OvO'
    - 'DOMAIN-SUFFIX,macrumors.com,OvO'
    - 'DOMAIN-SUFFIX,mashable.com,OvO'
    - 'DOMAIN-SUFFIX,mathjax.org,OvO'
    - 'DOMAIN-SUFFIX,medium.com,OvO'
    - 'DOMAIN-SUFFIX,mega.co.nz,OvO'
    - 'DOMAIN-SUFFIX,mega.nz,OvO'
    - 'DOMAIN-SUFFIX,megaupload.com,OvO'
    - 'DOMAIN-SUFFIX,microsofttranslator.com,OvO'
    - 'DOMAIN-SUFFIX,mindnode.com,OvO'
    - 'DOMAIN-SUFFIX,mobile01.com,OvO'
    - 'DOMAIN-SUFFIX,modmyi.com,OvO'
    - 'DOMAIN-SUFFIX,msedge.net,OvO'
    - 'DOMAIN-SUFFIX,myfontastic.com,OvO'
    - 'DOMAIN-SUFFIX,name.com,OvO'
    - 'DOMAIN-SUFFIX,nextmedia.com,OvO'
    - 'DOMAIN-SUFFIX,nsstatic.net,OvO'
    - 'DOMAIN-SUFFIX,nssurge.com,OvO'
    - 'DOMAIN-SUFFIX,nyt.com,OvO'
    - 'DOMAIN-SUFFIX,nytimes.com,OvO'
    - 'DOMAIN-SUFFIX,omnigroup.com,OvO'
    - 'DOMAIN-SUFFIX,onedrive.com,OvO'
    - 'DOMAIN-SUFFIX,onenote.com,OvO'
    - 'DOMAIN-SUFFIX,ooyala.com,OvO'
    - 'DOMAIN-SUFFIX,openvpn.net,OvO'
    - 'DOMAIN-SUFFIX,openwrt.org,OvO'
    - 'DOMAIN-SUFFIX,orkut.com,OvO'
    - 'DOMAIN-SUFFIX,osxdaily.com,OvO'
    - 'DOMAIN-SUFFIX,outlook.com,OvO'
    - 'DOMAIN-SUFFIX,ow.ly,OvO'
    - 'DOMAIN-SUFFIX,paddleapi.com,OvO'
    - 'DOMAIN-SUFFIX,parallels.com,OvO'
    - 'DOMAIN-SUFFIX,parse.com,OvO'
    - 'DOMAIN-SUFFIX,pdfexpert.com,OvO'
    - 'DOMAIN-SUFFIX,periscope.tv,OvO'
    - 'DOMAIN-SUFFIX,pinboard.in,OvO'
    - 'DOMAIN-SUFFIX,pinterest.com,OvO'
    - 'DOMAIN-SUFFIX,pixelmator.com,OvO'
    - 'DOMAIN-SUFFIX,pixiv.net,OvO'
    - 'DOMAIN-SUFFIX,playpcesor.com,OvO'
    - 'DOMAIN-SUFFIX,playstation.com,OvO'
    - 'DOMAIN-SUFFIX,playstation.com.hk,OvO'
    - 'DOMAIN-SUFFIX,playstation.net,OvO'
    - 'DOMAIN-SUFFIX,playstationnetwork.com,OvO'
    - 'DOMAIN-SUFFIX,pushwoosh.com,OvO'
    - 'DOMAIN-SUFFIX,rime.im,OvO'
    - 'DOMAIN-SUFFIX,servebom.com,OvO'
    - 'DOMAIN-SUFFIX,sfx.ms,OvO'
    - 'DOMAIN-SUFFIX,shadowsocks.org,OvO'
    - 'DOMAIN-SUFFIX,sharethis.com,OvO'
    - 'DOMAIN-SUFFIX,shazam.com,OvO'
    - 'DOMAIN-SUFFIX,skype.com,OvO'
    - 'DOMAIN-SUFFIX,smartdnsOvO.com,OvO'
    - 'DOMAIN-SUFFIX,smartmailcloud.com,OvO'
    - 'DOMAIN-SUFFIX,sndcdn.com,OvO'
    - 'DOMAIN-SUFFIX,sony.com,OvO'
    - 'DOMAIN-SUFFIX,soundcloud.com,OvO'
    - 'DOMAIN-SUFFIX,sourceforge.net,OvO'
    - 'DOMAIN-SUFFIX,spotify.com,OvO'
    - 'DOMAIN-SUFFIX,squarespace.com,OvO'
    - 'DOMAIN-SUFFIX,sstatic.net,OvO'
    - 'DOMAIN-SUFFIX,st.luluku.pw,OvO'
    - 'DOMAIN-SUFFIX,stackoverflow.com,OvO'
    - 'DOMAIN-SUFFIX,startpage.com,OvO'
    - 'DOMAIN-SUFFIX,staticflickr.com,OvO'
    - 'DOMAIN-SUFFIX,steamcommunity.com,OvO'
    - 'DOMAIN-SUFFIX,symauth.com,OvO'
    - 'DOMAIN-SUFFIX,symcb.com,OvO'
    - 'DOMAIN-SUFFIX,symcd.com,OvO'
    - 'DOMAIN-SUFFIX,tapbots.com,OvO'
    - 'DOMAIN-SUFFIX,tapbots.net,OvO'
    - 'DOMAIN-SUFFIX,tdesktop.com,OvO'
    - 'DOMAIN-SUFFIX,techcrunch.com,OvO'
    - 'DOMAIN-SUFFIX,techsmith.com,OvO'
    - 'DOMAIN-SUFFIX,thepiratebay.org,OvO'
    - 'DOMAIN-SUFFIX,theverge.com,OvO'
    - 'DOMAIN-SUFFIX,time.com,OvO'
    - 'DOMAIN-SUFFIX,timeinc.net,OvO'
    - 'DOMAIN-SUFFIX,tiny.cc,OvO'
    - 'DOMAIN-SUFFIX,tinypic.com,OvO'
    - 'DOMAIN-SUFFIX,tmblr.co,OvO'
    - 'DOMAIN-SUFFIX,todoist.com,OvO'
    - 'DOMAIN-SUFFIX,trello.com,OvO'
    - 'DOMAIN-SUFFIX,trustasiassl.com,OvO'
    - 'DOMAIN-SUFFIX,tumblr.co,OvO'
    - 'DOMAIN-SUFFIX,tumblr.com,OvO'
    - 'DOMAIN-SUFFIX,tweetdeck.com,OvO'
    - 'DOMAIN-SUFFIX,tweetmarker.net,OvO'
    - 'DOMAIN-SUFFIX,twitch.tv,OvO'
    - 'DOMAIN-SUFFIX,txmblr.com,OvO'
    - 'DOMAIN-SUFFIX,typekit.net,OvO'
    - 'DOMAIN-SUFFIX,ubertags.com,OvO'
    - 'DOMAIN-SUFFIX,ublock.org,OvO'
    - 'DOMAIN-SUFFIX,ubnt.com,OvO'
    - 'DOMAIN-SUFFIX,ulyssesapp.com,OvO'
    - 'DOMAIN-SUFFIX,urchin.com,OvO'
    - 'DOMAIN-SUFFIX,usertrust.com,OvO'
    - 'DOMAIN-SUFFIX,v.gd,OvO'
    - 'DOMAIN-SUFFIX,v2ex.com,OvO'
    - 'DOMAIN-SUFFIX,vimeo.com,OvO'
    - 'DOMAIN-SUFFIX,vimeocdn.com,OvO'
    - 'DOMAIN-SUFFIX,vine.co,OvO'
    - 'DOMAIN-SUFFIX,vivaldi.com,OvO'
    - 'DOMAIN-SUFFIX,vox-cdn.com,OvO'
    - 'DOMAIN-SUFFIX,vsco.co,OvO'
    - 'DOMAIN-SUFFIX,vultr.com,OvO'
    - 'DOMAIN-SUFFIX,w.org,OvO'
    - 'DOMAIN-SUFFIX,w3schools.com,OvO'
    - 'DOMAIN-SUFFIX,webtype.com,OvO'
    - 'DOMAIN-SUFFIX,wikiwand.com,OvO'
    - 'DOMAIN-SUFFIX,wikileaks.org,OvO'
    - 'DOMAIN-SUFFIX,wikimedia.org,OvO'
    - 'DOMAIN-SUFFIX,wikipedia.com,OvO'
    - 'DOMAIN-SUFFIX,wikipedia.org,OvO'
    - 'DOMAIN-SUFFIX,windows.com,OvO'
    - 'DOMAIN-SUFFIX,windows.net,OvO'
    - 'DOMAIN-SUFFIX,wire.com,OvO'
    - 'DOMAIN-SUFFIX,wordpress.com,OvO'
    - 'DOMAIN-SUFFIX,workflowy.com,OvO'
    - 'DOMAIN-SUFFIX,wp.com,OvO'
    - 'DOMAIN-SUFFIX,wsj.com,OvO'
    - 'DOMAIN-SUFFIX,wsj.net,OvO'
    - 'DOMAIN-SUFFIX,xda-developers.com,OvO'
    - 'DOMAIN-SUFFIX,xeeno.com,OvO'
    - 'DOMAIN-SUFFIX,xiti.com,OvO'
    - 'DOMAIN-SUFFIX,yahoo.com,OvO'
    - 'DOMAIN-SUFFIX,yimg.com,OvO'
    - 'DOMAIN-SUFFIX,ying.com,OvO'
    - 'DOMAIN-SUFFIX,yoyo.org,OvO'
    - 'DOMAIN-SUFFIX,ytimg.com,OvO'
    - 'DOMAIN-SUFFIX,telegra.ph,OvO'
    - 'DOMAIN-SUFFIX,telegram.org,OvO'
    - 'IP-CIDR,91.108.4.0/22,OvO,no-resolve'
    - 'IP-CIDR,91.108.8.0/21,OvO,no-resolve'
    - 'IP-CIDR,91.108.16.0/22,OvO,no-resolve'
    - 'IP-CIDR,91.108.56.0/22,OvO,no-resolve'
    - 'IP-CIDR,149.154.160.0/20,OvO,no-resolve'
    - 'IP-CIDR6,2001:67c:4e8::/48,OvO,no-resolve'
    - 'IP-CIDR6,2001:b28:f23d::/48,OvO,no-resolve'
    - 'IP-CIDR6,2001:b28:f23f::/48,OvO,no-resolve'
    - 'IP-CIDR,120.232.181.162/32,OvO,no-resolve'
    - 'IP-CIDR,120.241.147.226/32,OvO,no-resolve'
    - 'IP-CIDR,120.253.253.226/32,OvO,no-resolve'
    - 'IP-CIDR,120.253.255.162/32,OvO,no-resolve'
    - 'IP-CIDR,120.253.255.34/32,OvO,no-resolve'
    - 'IP-CIDR,120.253.255.98/32,OvO,no-resolve'
    - 'IP-CIDR,180.163.150.162/32,OvO,no-resolve'
    - 'IP-CIDR,180.163.150.34/32,OvO,no-resolve'
    - 'IP-CIDR,180.163.151.162/32,OvO,no-resolve'
    - 'IP-CIDR,180.163.151.34/32,OvO,no-resolve'
    - 'IP-CIDR,203.208.39.0/24,OvO,no-resolve'
    - 'IP-CIDR,203.208.40.0/24,OvO,no-resolve'
    - 'IP-CIDR,203.208.41.0/24,OvO,no-resolve'
    - 'IP-CIDR,203.208.43.0/24,OvO,no-resolve'
    - 'IP-CIDR,203.208.50.0/24,OvO,no-resolve'
    - 'IP-CIDR,220.181.174.162/32,OvO,no-resolve'
    - 'IP-CIDR,220.181.174.226/32,OvO,no-resolve'
    - 'IP-CIDR,220.181.174.34/32,OvO,no-resolve'
    - 'DOMAIN,injections.adguard.org,DIRECT'
    - 'DOMAIN,local.adguard.org,DIRECT'
    - 'DOMAIN-SUFFIX,local,DIRECT'
    - 'IP-CIDR,127.0.0.0/8,DIRECT'
    - 'IP-CIDR,172.16.0.0/12,DIRECT'
    - 'IP-CIDR,192.168.0.0/16,DIRECT'
    - 'IP-CIDR,10.0.0.0/8,DIRECT'
    - 'IP-CIDR,17.0.0.0/8,DIRECT'
    - 'IP-CIDR,100.64.0.0/10,DIRECT'
    - 'IP-CIDR,224.0.0.0/4,DIRECT'
    - 'IP-CIDR6,fe80::/10,DIRECT'
    - 'DOMAIN-SUFFIX,cn,DIRECT'
    - 'DOMAIN-KEYWORD,-cn,DIRECT'
    - 'GEOIP,CN,DIRECT'
  - MATCH,🚀 节点选择
`;
}

async function main() {
  try {
    const config = await fetchAndDecrypt();
    console.log(`📦 解密成功，版本 v${config.version}，共 ${config.nodes.length} 个节点`);
    const yaml = generateClashYAML(config);
    writeFileSync(OUTPUT_FILE, yaml, 'utf-8');
    console.log(`💾 已写入: ${OUTPUT_FILE}`);
    console.log('🎉 订阅文件更新完成！');
    config.nodes.forEach((n, i) => {
      const emoji = FLAG_MAP[n.flag] || '🌐';
      console.log(`   ${String(i + 1).padStart(2)}. ${emoji} ${n.name} → ${n.server}:${n.port}`);
    });
  } catch (e) {
    console.error(`❌ 更新失败: ${e.message}`);
    process.exit(1);
  }
}

main();
