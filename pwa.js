/* MILO install: never auto-install; use native browser prompt only on user's click. */
(() => {
  let deferredPrompt = null;
  const button = document.getElementById('installAppButton');
  const isInstalled = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  function syncUI() {
    if (button) {button.hidden = isInstalled(); button.textContent = 'تثبيت على الجهاز';}
    document.body.dataset.canInstall = !isInstalled() ? '1' : '0';
  }
  function showHelp(message) {
    const title='تثبيت كاشير ميلو على اللابتوب';
    if (typeof window.showModal === 'function' && typeof window.closeModal === 'function') {
      window.showModal(title, `<div class="stack"><p>${message}</p></div>`, [{label:'إغلاق',onClick:window.closeModal}]);
    } else window.alert(message.replace(/<[^>]*>/g,' '));
  }
  window.miloInstallApp = async function () {
    if (isInstalled()) return showHelp('التطبيق مثبت ويعمل بالفعل في نافذة مستقلة.');
    if (!window.isSecureContext || location.protocol==='file:') return showHelp('لتثبيت التطبيق، انشر ملفات ميلو على رابط HTTPS وافتح الرابط في Chrome أو Edge. التشغيل من ملف HTML مباشرة لا يدعم تثبيت PWA.');
    if (deferredPrompt) {
      const prompt=deferredPrompt;deferredPrompt=null;
      try {await prompt.prompt();const result=await prompt.userChoice;if(result && result.outcome==='accepted'){syncUI();return;}} catch(e) { console.warn('MILO install:',e); }
    }
    showHelp('في <b>Microsoft Edge</b>: من قائمة (...) اختر <b>التطبيقات ← تثبيت هذا الموقع كتطبيق</b>.<br>في <b>Google Chrome</b>: اختر <b>تثبيت كاشير ميلو</b> من رمز التثبيت في شريط العنوان أو من قائمة المتصفح. تأكد من فتح رابط HTTPS لا ملفًا محليًا.');
  };
  window.addEventListener('beforeinstallprompt', event => {event.preventDefault();deferredPrompt=event;syncUI();});
  window.addEventListener('appinstalled',()=>{deferredPrompt=null;syncUI();});
  button?.addEventListener('click',()=>window.miloInstallApp());
  if ('serviceWorker' in navigator && (location.protocol==='https:' || ['localhost','127.0.0.1'].includes(location.hostname))) {
    window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js?v=16', {updateViaCache:'none'}).catch(e=>console.warn('MILO SW:',e)));
  }
  syncUI();
})();
