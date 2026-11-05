/* MILO CASHIER PWA: installation initiated only by direct user click. */
(() => {
  let installPrompt = null;
  const installBtn = document.getElementById('installAppButton');
  const installed = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  const markState = enabled => {
    document.body.dataset.canInstall = enabled ? '1' : '0';
    if (typeof renderBrowserInstallNotice === 'function') renderBrowserInstallNotice(enabled);
  };
  const syncButton = () => {
    if (installBtn) installBtn.hidden = installed() || !installPrompt;
    markState(!installed() && !!installPrompt);
  };
  const showHelp = (title, body) => {
    if (typeof showModal === 'function') {
      showModal(title, `<div class="stack"><p>${body}</p></div>`,
        [{label:'إغلاق', onClick: closeModal}]);
    } else {
      window.alert(body.replace(/<[^>]*>/g, ' '));
    }
  };
  window.miloInstallApp = async () => {
    if (installed()) {
      showHelp('التطبيق مثبت بالفعل', 'كاشير ميلو يعمل حاليًا كتطبيق مستقل على هذا الجهاز.');
      return;
    }
    if (installPrompt) {
      const prompt = installPrompt;
      installPrompt = null;
      syncButton();
      try {
        await prompt.prompt();
        const choice = await prompt.userChoice;
        if (choice?.outcome === 'accepted') return;
      } catch (err) {
        console.warn('PWA install prompt:', err);
      }
    }
    showHelp('تثبيت كاشير ميلو',
      'لتثبيت التطبيق افتح الموقع عبر HTTPS في Chrome أو Edge، ثم من قائمة المتصفح اختر <b>تثبيت التطبيق</b> أو <b>التطبيقات ← تثبيت هذا الموقع كتطبيق</b>. في Edge يمكن استخدام زر التثبيت الموجود بجانب شريط العنوان. إذا كنت تفتح ملف HTML مباشرة فلن يتوفر تثبيت PWA.');
  };
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(console.warn));
  }
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    installPrompt = event;
    syncButton();
  });
  window.addEventListener('appinstalled', () => {
    installPrompt = null;
    syncButton();
  });
  installBtn?.addEventListener('click', () => window.miloInstallApp());
  syncButton();
})();
