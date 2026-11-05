/* MILO Print Bridge connector: opt-in, local-only, no fallback on failure. */
(()=>{'use strict';
const endpoint='http://127.0.0.1:17855/print';
const txt=(el)=>el?.textContent?.replace(/\s+/g,' ').trim()||'';
const money=(s)=>{const m=String(s||'').replace(/,/g,'').match(/-?\d+(?:\.\d+)?/);return m?Number(m[0]):0};
function payload(html){
 const doc=new DOMParser().parseFromString(html,'text/html');const root=doc.querySelector('#receipt');if(!root)throw Error('الفاتورة غير موجودة');
 const cells=[...root.querySelectorAll('.receipt-grid > div')];
 const num=cells.find(x=>txt(x.querySelector('span')).includes('الفاتورة'));
 const rows=[...root.querySelectorAll('.receipt-items tbody tr')].map(tr=>{const td=[...tr.querySelectorAll('td')];return {name:txt(td[0]?.querySelector('.item-main')||td[0]),qty:money(txt(td[1]))||1,price:money(txt(td[2]))}});
 const summary=[...root.querySelectorAll('.receipt-summary .rline')];
 const total=summary.find(x=>txt(x).includes('الإجمالي المستحق'))||summary.find(x=>txt(x).includes('الإجمالي'));
 return {store:txt(root.querySelector('.receipt-head h2'))||'MILO CASHIER',subtitle:txt(root.querySelector('.receipt-head .receipt-sub')),number:txt(num?.querySelector('b'))||txt(root.querySelector('.milo-order-number strong')),items:rows,total:money(txt(total?.querySelector('b'))),footer:txt(root.querySelector('.receipt-footer'))};
}
async function printTask(task){
 const token=localStorage.getItem('milo_bridge_token')||'';if(!token)throw Error('أدخل مفتاح الربط في إعدادات الطباعة');
 let res;try{res=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json','X-MILO-Token':token},body:JSON.stringify(payload(task.html)),signal:AbortSignal.timeout(12000)})}catch(e){throw Error('تعذر الاتصال ببرنامج MILO Print Bridge. تأكد من تشغيله وإعدادات المتصفح: '+e.message)}
 if(!res.ok)throw Error('رفض برنامج الطباعة الطلب (HTTP '+res.status+'): '+(await res.text()).slice(0,150));return true;
}
window.MiloPrintBridge={printTask};
})();
