/* MILO Print Bridge — structured customer/kitchen receipt payloads. */
(()=>{'use strict';
const endpoint='http://127.0.0.1:17855/print';
const txt=(el)=>el?.textContent?.replace(/\s+/g,' ').trim()||'';
const money=(s)=>{const m=String(s||'').replace(/,/g,'').match(/-?\d+(?:\.\d+)?/);return m?Number(m[0]):0};
async function imageAsPng(img, maxSize=320){
 if(!img)return null;
 const source=img.getAttribute("src");if(!source)return null;
 const picture=new Image();picture.src=source;await picture.decode();
 const scale=Math.min(1,maxSize/Math.max(picture.naturalWidth,picture.naturalHeight));
 const canvas=document.createElement("canvas");canvas.width=Math.max(1,Math.round(picture.naturalWidth*scale));canvas.height=Math.max(1,Math.round(picture.naturalHeight*scale));
 const ctx=canvas.getContext("2d");ctx.fillStyle="#fff";ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(picture,0,0,canvas.width,canvas.height);
 return canvas.toDataURL("image/png");
}
async function qrAsPng(svg){
 if(!svg)return null;
 const source=new XMLSerializer().serializeToString(svg);
 const blob=new Blob([source],{type:"image/svg+xml;charset=utf-8"});const url=URL.createObjectURL(blob);
 try {
  const image=new Image();image.src=url;await image.decode();
  const canvas=document.createElement("canvas");canvas.width=320;canvas.height=320;const ctx=canvas.getContext("2d");
  ctx.fillStyle="#fff";ctx.fillRect(0,0,320,320);ctx.imageSmoothingEnabled=false;ctx.drawImage(image,0,0,320,320);return canvas.toDataURL("image/png");
 } finally {URL.revokeObjectURL(url)}
}
async function payload(html,kitchen=false){
 const doc=new DOMParser().parseFromString(html,'text/html');const root=doc.querySelector('#receipt');if(!root)throw Error('الفاتورة غير موجودة');
 const fields=[...root.querySelectorAll('.receipt-grid > div')];
 const field=(label)=>txt(fields.find(x=>txt(x.querySelector('span')).includes(label))?.querySelector('b'));
 const isKitchen=root.classList.contains('milo-special-ticket')&&txt(root.querySelector('.receipt-head h2')).includes('المطبخ');
 const rows=[...root.querySelectorAll('.receipt-items tbody tr')].map(tr=>{const td=[...tr.querySelectorAll('td')];return {name:txt(td[0]?.querySelector('.item-main')||td[0]),qty:money(txt(td[1]))||1,price:isKitchen?0:money(txt(td[2])),lineTotal:money(txt(td[3]))}});
 const summary=[...root.querySelectorAll('.receipt-summary .rline')];
 const sum=(label)=>money(txt(summary.find(x=>txt(x.querySelector('span')).includes(label))?.querySelector('b')));
 const number=field('الفاتورة')||field('الطلب')||txt(root.querySelector('.milo-order-number strong'));
 const orderNumber=txt(root.querySelector('.milo-order-number strong'))||field('الطلب');
 const dateRaw=field('التاريخ');const dateParsed=new Date(dateRaw);
 const tax=txt(root.querySelector('.milo-vat-at-top')).replace(/[^0-9]/g,'');
 const logoBase64=isKitchen?null:await imageAsPng(root.querySelector(".milo-receipt-logo"));
 const qrBase64=isKitchen?null:await qrAsPng(root.querySelector(".qr-area svg"));
 return {logoBase64,qrBase64,receiptType:isKitchen?'kitchen':'customer',store:txt(root.querySelector('.receipt-head h2'))||'MILO CASHIER',subtitle:txt(root.querySelector('.receipt-head .receipt-sub')),number,orderNumber,cashier:field('الكاشير'),paymentMethod:field('طريقة الدفع'),taxNumber:tax,items:rows,subtotal:sum('المجموع الفرعي'),vat:sum('ضريبة القيمة المضافة'),total:sum('الإجمالي المستحق')||sum('الإجمالي'),dateTime:Number.isNaN(dateParsed.getTime())?null:dateParsed.toISOString(),footer:txt(root.querySelector('.receipt-footer'))||'شكرًا لزيارتكم'};
}
async function send(data){const token=localStorage.getItem('milo_bridge_token')||'';if(!token)throw Error('أدخل مفتاح الربط في إعدادات الطباعة');let res;try{res=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json','X-MILO-Token':token},body:JSON.stringify(data),signal:AbortSignal.timeout(15000)})}catch(e){throw Error('تعذر الاتصال ببرنامج MILO Print Bridge: '+e.message)}if(!res.ok)throw Error('رفض برنامج الطباعة الطلب (HTTP '+res.status+'): '+(await res.text()).slice(0,160));return true;}
async function printTask(task){const data=await payload(task.html,false);await send(data);return true;}
window.MiloPrintBridge={printTask};
})();
