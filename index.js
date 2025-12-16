document.addEventListener('DOMContentLoaded', () => {
    const beam = document.getElementById('beam');
    const support = document.querySelector('.support');
    const txtLeft = document.getElementById('l-score');
    const txtRight = document.getElementById('r-score');
    const btnClear = document.getElementById('clear-data');

    const LIMITS = { maxAngle: 30, minW: 1, maxW: 10 };
    let items = [];

    // LocalStorage verisini yükle
    const startApp = () => {
        const savedData = localStorage.getItem('seesaw_data');
        if (savedData) {
            items = JSON.parse(savedData);
        }
        updateSystem();
    };

    // Sistemi güncelle
    function updateSystem() {
        let torqueL = 0, torqueR = 0;
        let weightL = 0, weightR = 0;

        // Çubuğun şu anki canlı genişliğini al (Responsive olması için şart)
        const currentWidth = beam.offsetWidth;
        const halfWidth = currentWidth / 2;

        beam.innerHTML = '';

        items.forEach(item => {
            // Veri uyumluluğu (Eski versiyondan geçiş yapılıyorsa)
            // Eğer veride 'factor' (oran) yoksa, eski pixel verisinden oran üret.
            if (typeof item.factor === 'undefined') {
                item.factor = item.dist / 250; // 250 eski varsayılan yarıçaptı
            }

            // HTML Oluştur
            const el = document.createElement('div');
            el.className = 'item';
            el.innerText = item.val;
            
            // Konumlandırma: Yüzde (%) bazlı yapıyoruz ki ekran küçülünce kaymasın.
            // Merkez %50'dir. Factor -1 ile 1 arasındadır.
            // Örnek: Factor 0.5 ise -> 50 + 25 = %75 (Sağ taraf)
            const cssPercent = 50 + (item.factor * 50);
            el.style.left = cssPercent + '%';
            el.style.transform = 'translateX(-50%)';
            
            beam.appendChild(el);

            // Fizik Hesapları
            // Responsive olduğunda, çubuk küçülürse tork etkisi de azalır (Fizik kuralı: Mesafe azalırsa tork azalır)
            const currentDist = item.factor * halfWidth; 
            const force = item.val * Math.abs(currentDist);

            if (item.factor < 0) {
                torqueL += force;
                weightL += item.val;
            } else {
                torqueR += force;
                weightR += item.val;
            }
        });

        // Açı hesabı
        const diff = torqueR - torqueL;
        // Çubuk kısaldığında açı çok oynamasın diye genişliğe göre normalize ediyoruz
        // (Bu detay gerçekçilik için önemli)
        let rot = diff / (halfWidth / 25); 
        
        if (rot > LIMITS.maxAngle) rot = LIMITS.maxAngle;
        if (rot < -LIMITS.maxAngle) rot = -LIMITS.maxAngle;

        beam.style.transform = `rotate(${rot}deg)`;
        txtLeft.innerText = `Sol Ağırlık: ${weightL} kg`;
        txtRight.innerText = `Sağ Ağırlık: ${weightR} kg`;
    }

    // Tıklama Olayı
    beam.addEventListener('click', (e) => {
        // Tıklama anındaki güncel ölçüler
        const rect = beam.getBoundingClientRect();
        const width = rect.width;
        const center = rect.left + (width / 2);
        
        // Tıklanan nokta ile merkez arasındaki fark (px cinsinden)
        const rawDist = e.clientX - center;
        
        // Oran Hesapla (-1 en sol, 0 merkez, +1 en sağ)
        // Bu oran ekran boyutu değişse bile sabittir.
        const half = width / 2;
        const factor = rawDist / half;

        // Çok merkeze tıklanırsa iptal (%1 tolerans)
        if (Math.abs(factor) < 0.02) return;

        const w = Math.floor(Math.random() * LIMITS.maxW) + LIMITS.minW;

        items.push({
            id: Date.now(),
            val: w,
            factor: factor // Artık piksel (dist) değil, oran saklıyoruz
        });

        saveAndRender();
    });

    btnClear.addEventListener('click', () => {
        items = [];
        localStorage.removeItem('seesaw_data');
        updateSystem();
    });

    // Ekran boyutu değişirse (Telefon yan çevrilirse vs.) yeniden hesapla
    window.addEventListener('resize', updateSystem);

    function saveAndRender() {
        localStorage.setItem('seesaw_data', JSON.stringify(items));
        updateSystem();
    }

    startApp();
});