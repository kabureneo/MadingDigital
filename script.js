/* ============================================================
   MADING DIGITAL — script.js
   Scroll snap animations + all interactivity
   ============================================================ */

"use strict";

/* ─── PROGRESS BAR ─────────────────────────────────────────── */
const progressBar = document.getElementById("progress-bar");
function updateProgress() {
  const total = document.documentElement.scrollHeight - window.innerHeight;
  const pct = total > 0 ? (window.scrollY / total) * 100 : 0;
  progressBar.style.width = pct + "%";
}

/* ─── NAVBAR ────────────────────────────────────────────────── */
const navbar = document.getElementById("navbar");
const hamburger = document.getElementById("hamburger");
const navLinks = document.getElementById("nav-links");

function updateNavbar() {
  navbar.classList.toggle("scrolled", window.scrollY > 40);
}

hamburger.addEventListener("click", () => {
  navLinks.classList.toggle("open");
  hamburger.classList.toggle("open");
});
navLinks.querySelectorAll("a").forEach(link => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("open");
    hamburger.classList.remove("open");
  });
});

/* ─── HERO PARALLAX ─────────────────────────────────────────── */
// We use a CSS custom property instead of overriding transform
// so the Ken Burns @keyframes animation on hero-bg stays intact.
const heroSection = document.getElementById("hero");
const heroContent = document.querySelector(".hero-content");

function updateParallax() {
  const y = window.scrollY;
  if (y < window.innerHeight * 1.2) {
    // Drift hero text upward slowly as user scrolls (parallax feel)
    if (heroContent) {
      heroContent.style.transform = `translateY(${y * 0.18}px)`;
      heroContent.style.opacity = Math.max(0, 1 - y / (window.innerHeight * 0.65));
    }
    // Move the photo-credit and deco cards at a different rate
    document.querySelectorAll(".deco-card").forEach((el, i) => {
      el.style.transform = `translateY(${y * (0.08 + i * 0.03)}px) rotate(${i % 2 === 0 ? '-1deg' : '1deg'})`;
    });
  }
}

/* ─── SCROLL SNAP TRACKER ───────────────────────────────────── */
// Sections that participate in the snap highlight effect
const snapSections = document.querySelectorAll(".snap-section");
let currentSnap = 0;
let isSnapping = false;
let snapTimeout = null;
let lastScrollY = 0;
let snapLocked = false;

function getSnapIndex() {
  let closest = 0;
  let minDist = Infinity;
  snapSections.forEach((sec, i) => {
    const rect = sec.getBoundingClientRect();
    const dist = Math.abs(rect.top);
    if (dist < minDist) { minDist = dist; closest = i; }
  });
  return closest;
}

function snapToSection(index) {
  if (index < 0 || index >= snapSections.length) return;
  isSnapping = true;
  snapLocked = true;
  currentSnap = index;
  snapSections[index].scrollIntoView({ behavior: "smooth" });
  snapSections.forEach((s, i) => s.classList.toggle("snap-active", i === index));
  setTimeout(() => {
    isSnapping = false;
    setTimeout(() => { snapLocked = false; }, 600);
  }, 900);
}

let wheelDelta = 0;
let wheelTimer = null;
window.addEventListener("wheel", (e) => {
  if (snapLocked) {
    // Only prevent default when actually over a snap section
    const active = snapSections[currentSnap];
    if (active) {
      const rect = active.getBoundingClientRect();
      if (Math.abs(rect.top) < 80) {
        // Inside snap zone — accumulate and snap
        wheelDelta += e.deltaY;
        clearTimeout(wheelTimer);
        wheelTimer = setTimeout(() => {
          if (Math.abs(wheelDelta) > 60) {
            const dir = wheelDelta > 0 ? 1 : -1;
            snapToSection(currentSnap + dir);
          }
          wheelDelta = 0;
        }, 80);
      }
    }
  }
}, { passive: true });

// Keyboard nav for snapped sections
window.addEventListener("keydown", (e) => {
  if (!document.querySelector(".snap-section.snap-active")) return;
  if (e.key === "ArrowDown" || e.key === "PageDown") {
    e.preventDefault();
    snapToSection(currentSnap + 1);
  }
  if (e.key === "ArrowUp" || e.key === "PageUp") {
    e.preventDefault();
    snapToSection(currentSnap - 1);
  }
});

/* ─── SNAP DOTS NAV ─────────────────────────────────────────── */
function buildSnapDots() {
  if (snapSections.length === 0) return;
  const dots = document.createElement("nav");
  dots.id = "snap-dots";
  dots.setAttribute("aria-label", "Navigasi Seksi");
  snapSections.forEach((sec, i) => {
    const dot = document.createElement("button");
    dot.className = "snap-dot" + (i === 0 ? " active" : "");
    dot.setAttribute("aria-label", `Seksi ${i + 1}`);
    dot.dataset.index = i;
    dot.addEventListener("click", () => snapToSection(i));
    dots.appendChild(dot);
  });
  document.body.appendChild(dots);

  // Update dot active state on scroll
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const idx = [...snapSections].indexOf(entry.target);
        dots.querySelectorAll(".snap-dot").forEach((d, i) => {
          d.classList.toggle("active", i === idx);
        });
        currentSnap = idx;
      }
    });
  }, { threshold: 0.5 });
  snapSections.forEach(s => io.observe(s));
}

/* ─── INTERSECTION OBSERVER — REVEAL ───────────────────────── */
const revealEls = document.querySelectorAll(
  ".reveal-up, .reveal-left, .reveal-right, .article-card"
);
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

revealEls.forEach(el => revealObserver.observe(el));

/* ─── CARD STAGGER INDICES ───────────────────────────────────── */
document.querySelectorAll(".article-card").forEach((card, i) => {
  card.style.setProperty("--card-delay", i);
});

/* ─── 3D TILT ON CARDS (mouse) ──────────────────────────────── */
document.querySelectorAll(".article-card").forEach(card => {
  const inner = card.querySelector(".card-tilt-inner");
  if (!inner) return;

  card.addEventListener("mousemove", (e) => {
    const rect = card.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const rx = ((e.clientY - cy) / (rect.height / 2)) * -6;
    const ry = ((e.clientX - cx) / (rect.width / 2)) * 6;
    inner.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg) scale(1.02)`;
    inner.style.boxShadow = `${-ry * 2}px ${rx * 2}px 40px rgba(79,128,255,0.2)`;
  });

  card.addEventListener("mouseleave", () => {
    inner.style.transform = "rotateX(0) rotateY(0) scale(1)";
    inner.style.boxShadow = "";
  });
});

/* ─── FEATURED CARD TILT ─────────────────────────────────────── */
const featMain = document.getElementById("feat-main");
if (featMain) {
  featMain.addEventListener("mousemove", (e) => {
    const rect = featMain.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const rx = ((e.clientY - cy) / (rect.height / 2)) * -3;
    const ry = ((e.clientX - cx) / (rect.width / 2)) * 3;
    featMain.style.transform = `translateY(-6px) rotateX(${rx}deg) rotateY(${ry}deg)`;
  });
  featMain.addEventListener("mouseleave", () => {
    featMain.style.transform = "";
  });
}

/* ─── CATEGORY FILTER ────────────────────────────────────────── */
const filterBtns = document.querySelectorAll(".filter-btn");
const articleCards = document.querySelectorAll(".article-card");

filterBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    filterBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const filter = btn.dataset.filter;

    articleCards.forEach((card, i) => {
      const match = filter === "all" || card.dataset.category === filter;
      card.style.setProperty("--card-delay", i);
      if (match) {
        card.classList.remove("filtering-out", "hidden");
        setTimeout(() => card.classList.add("visible"), 20);
      } else {
        card.classList.add("filtering-out");
        setTimeout(() => card.classList.add("hidden"), 350);
      }
    });
  });
});

/* ─── ANIMATED COUNTER ───────────────────────────────────────── */
function animateCounter(el, target, duration = 1800) {
  let start = null;
  const isLarge = target > 999;
  const step = (timestamp) => {
    if (!start) start = timestamp;
    const progress = Math.min((timestamp - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(eased * target);
    el.textContent = isLarge
      ? current.toLocaleString("id-ID")
      : current.toString();
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = isLarge ? target.toLocaleString("id-ID") : target.toString();
  };
  requestAnimationFrame(step);
}

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target;
      animateCounter(el, parseInt(el.dataset.target));
      counterObserver.unobserve(el);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll(".stat-num").forEach(el => counterObserver.observe(el));

/* ─── TICKER DUPLICATE ───────────────────────────────────────── */
const tickerInner = document.getElementById("ticker-inner");
if (tickerInner) {
  tickerInner.innerHTML += tickerInner.innerHTML; // seamless loop
}

/* ─── GALLERY LIGHTBOX ───────────────────────────────────────── */
document.querySelectorAll(".gallery-item").forEach(item => {
  item.addEventListener("click", () => {
    const img = item.querySelector("img");
    const caption = item.querySelector(".gallery-caption");
    const lb = document.createElement("div");
    lb.id = "lightbox";
    lb.innerHTML = `
      <div class="lb-backdrop"></div>
      <div class="lb-box">
        <button class="lb-close" aria-label="Tutup">✕</button>
        <img src="${img.src}" alt="${img.alt}" />
        <p>${caption ? caption.textContent : ""}</p>
      </div>`;
    document.body.appendChild(lb);
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => lb.classList.add("open"));

    function closeLb() {
      lb.classList.remove("open");
      setTimeout(() => { lb.remove(); document.body.style.overflow = ""; }, 350);
    }
    lb.querySelector(".lb-backdrop").addEventListener("click", closeLb);
    lb.querySelector(".lb-close").addEventListener("click", closeLb);
    window.addEventListener("keydown", (e) => { if (e.key === "Escape") closeLb(); }, { once: true });
  });
});

/* ─── ARTICLE MODAL ──────────────────────────────────────────── */
const ARTICLES_DATA = [
  {
    title: "Perwakilan kelas XIF2 memenangkan lomba Ranking 1 yang diadakan oleh genza",
    author: "Dominicus Excel",
    date: "1 Maret 2026",
    category: "Pendidikan",
    img: "foto juara 1.jpeg",
    content: `<p>Dominicus Excel C.H Raih Juara Lomba Ranking 1 Genza Sampit, 30 Januari 2026 - Suasana penuh semangat dan antusiasme mewarnai pelaksanaan Lomba Ranking 1 yang diselenggarakan oleh Genza Sampit pada Jumat, 30 Januari 2026.
Kegiatan ini diikuti oleh banyak peserta yang siap menguji kemampuan dan pengetahuan mereka dalam berbagai bidang.<p>
<p>Lomba Ranking 1 merupakan ajang kompetisi yang menantang peserta untuk menjawab berbagai pertanyaan secara cepat dan tepat. Setiap peserta harus mampu bertahan dari setiap babak dengan konsentrasi penuh. Suasana semakin menegangkan ketika jumlah peserta mulai berkurang hingga tersisa beberapa orang terbaik saja.<p>
<p>Setelah melalui persaingan yang ketat, akhirnya Dominicus Excel C.H dari kelas XI F2 berhasil keluar sebagai pemenang dan meraih posisi Ranking 1. Keberhasilannya ini menjadi kebanggaan tersendiri, baik bagi dirinya maupun teman-teman sekelasnya.<p>
<p>saat diwawancarai setelah kemenangan tersebut, Excel mengungkapkan perasaannya yang penuh haru dan bahagia. Ia mengaku merasa sangat bangga atas pencapaian ini. Namun di sisi lain, ia juga tidak menyangka bisa menjadi juara karena menurutnya semua peserta memiliki kemampuan yang hebat dan persaingan berlangsung sangat ketat.<p>
<p>“Saya benar-benar tidak menyangka bisa menang. Tadi sempat merasa gugup, apalagi ketika tinggal sedikit peserta yang tersisa. Tapi saya mencoba tetap fokus dan tenang,” ungkapnya.<p>
<p>Kemenangan ini menjadi bukti bahwa kerja keras, ketekunan, dan keberanian untuk mencoba dapat membuahkan hasil yang membanggakan. Prestasi yang diraih Dominicus Excel C.H diharapkan dapat menjadi inspirasi bagi siswa lainnya untuk terus berusaha dan tidak takut mengikuti kompetisi.<p>
<p>Lomba Ranking 1 Genza Sampit tahun ini pun ditutup dengan penuh semangat dan kebahagiaan, meninggalkan pengalaman berharga bagi seluruh peserta yang terlibat.</p>`
  },
  {
    title: "Band Jol perwakilan lomba band kelas XIF2 meraih juara 2 pada event Hajatan 63 SMA Negeri 1 sampit",
    author: "Dominicus Excel",
    date: "28 Februari 2026",
    category: "Seni Musik",
    img: "foto juara 3.jpeg",
    content: `<p>Perwakilan Kelas XI F2 Raih Juara 2 di Hajatan SMANSA ke-63<p>
<p>Sampit, 9 Oktober 2025 – Kabar membanggakan datang dari perwakilan kelas XI F2 yang berhasil meraih Juara 2 dalam ajang Hajatan SMANSA ke-63 yang diselenggarakan di SMAN 1 Sampit. Kegiatan tahunan ini merupakan bagian dari perayaan ulang tahun sekolah yang ke-63 dan berlangsung dengan penuh kemeriahan serta antusiasme dari seluruh warga sekolah.<p>
<p>Tim perwakilan XI F2 yang turut berpartisipasi dalam event tersebut terdiri dari:<p>
<p>1. Pius Dioniggi Augustha<p>
<p>2. Richard Brawijaya Anggen<p>
<p>3. Dominicus Excel Chandra Hoo<p>
<p>4. Ramos Riky Vedrosa Damanik<p>
<p>5. Muhammad Fadhil<p>
<p>Dengan semangat kebersamaan dan kerja sama yang solid, tim XI F2 mampu memberikan penampilan terbaik mereka di hadapan para juri dan penonton. Persaingan yang ketat tidak menyurutkan semangat mereka untuk tampil maksimal dan percaya diri.<p>
<p>Persiapan yang dilakukan pun tidak singkat. Selama kurang lebih dua minggu, mereka berlatih dan mematangkan konsep penampilan dengan penuh keseriusan dan tanggung jawab. Kerja keras tersebut akhirnya membuahkan hasil yang membanggakan.<p>
<p>“Kami sangat bangga karena bisa memberikan hasil yang baik,” ungkap perwakilan tim. Prestasi ini menjadi bukti bahwa usaha, kekompakan, dan dedikasi yang tinggi dapat membawa hasil yang memuaskan.<p>
<p>Keberhasilan meraih Juara 2 ini diharapkan dapat menjadi motivasi bagi seluruh siswa kelas XI F2 untuk terus berprestasi dan berkontribusi positif dalam setiap kegiatan sekolah. Semoga ke depannya, semakin banyak prestasi gemilang yang dapat diraih dan semakin mengharumkan nama kelas serta sekolah.</p>`
  },
  {
    title: "XIF2 memperingati hari guru ",
    author: "Dominicus Excel",
    date: "27 Februari 2026",
    category: "Kebersamaan",
    img: "mading 1.jpeg",
    content: `<p>Siswa XI F2 Beri Kejutan Spesial untuk Wali Kelas di Hari Guru Nasional<p>
<p>Dalam rangka memperingati Hari Guru Nasional, siswa kelas XI F2 dari SMAN 1 Sampit mengadakan kejutan sederhana namun penuh makna untuk wali kelas tercinta mereka, Ibu Zulkiyah. Momen tersebut berlangsung dengan suasana haru dan bahagia di dalam kelas.<p>
<p>Sejak pagi hari, para siswa telah mempersiapkan berbagai kejutan secara diam-diam. Mereka menghias kelas dengan dekorasi sederhana dan menyiapkan kue serta ucapan terima kasih yang ditulis langsung oleh seluruh siswa XI F2. Semua persiapan dilakukan sebagai bentuk apresiasi atas dedikasi dan kesabaran Ibu Zulkiyah dalam membimbing mereka selama ini.<p>
<p>Ketika Ibu Zulkiyah memasuki kelas, para siswa langsung menyambutnya dengan nyanyian dan tepuk tangan meriah. Ekspresi terkejut sekaligus bahagia terlihat jelas di wajah beliau. Beberapa siswa juga menyampaikan pesan dan kesan mereka, mengungkapkan rasa terima kasih atas bimbingan, nasihat, serta perhatian yang selalu diberikan.<p>
<p>Perayaan Hari Guru Nasional ini menjadi momen yang mempererat hubungan antara siswa dan wali kelas. Tidak hanya sekadar memberikan kejutan, kegiatan ini juga menjadi pengingat bahwa peran guru sangatlah besar dalam membentuk karakter dan masa depan para siswa.<p>
<p>Melalui kegiatan sederhana ini, siswa XI F2 berharap dapat membalas sedikit dari segala kebaikan dan jasa yang telah diberikan oleh Ibu Zulkiyah. Semoga semangat kebersamaan dan rasa hormat kepada guru selalu terjaga, tidak hanya pada Hari Guru Nasional, tetapi setiap hari.</p>`
  },
  {
    title: "Kelas XIF2 menjadi petugas upacara bendera ",
    author: "Dominicus Excel",
    date: "26 Februari 2026",
    category: "Kebersamaan",
    img: "mading 2.jpeg",
    content: `<p>XI F2 Tunjukkan Tanggung Jawab sebagai Petugas Upacara Hari Senin<p>
<p>Sampit – Siswa kelas XI F2 dari SMAN 1 Sampit mendapatkan kesempatan dan kepercayaan untuk menjadi petugas upacara bendera pada hari Senin. Tugas tersebut dijalankan dengan penuh tanggung jawab, disiplin, dan semangat kebersamaan.<p>
<p>Sejak beberapa hari sebelumnya, seluruh anggota kelas yang bertugas telah melakukan latihan secara rutin agar pelaksanaan upacara dapat berjalan dengan lancar. Mereka mempersiapkan diri mulai dari pemimpin upacara, pengibar bendera, pembaca teks Pancasila, pembaca UUD 1945, pembaca doa, hingga petugas protokol.<p>
<p>Pada hari pelaksanaan, upacara berlangsung dengan tertib dan khidmat. Pengibaran bendera berjalan lancar, sementara pemimpin upacara mampu memimpin jalannya kegiatan dengan tegas dan percaya diri. Seluruh siswa XI F2 menunjukkan kekompakan serta keseriusan dalam menjalankan peran masing-masing.<p>
<p>Keberhasilan XI F2 dalam menjalankan tugas ini tidak hanya menjadi kebanggaan bagi kelas mereka, tetapi juga menjadi contoh bagi kelas lain tentang pentingnya kerja sama dan tanggung jawab. Melalui kegiatan ini, siswa belajar untuk lebih disiplin, percaya diri, dan menghargai makna upacara bendera sebagai wujud cinta tanah air.<p>
<p>Dengan suksesnya pelaksanaan upacara hari Senin tersebut, XI F2 membuktikan bahwa mereka mampu menjalankan amanah sekolah dengan baik dan penuh dedikasi.</p>`
  },
  {
    title: "Kelas XI F2 Terima Hasil Pembagian Rapor Semester 1",
    author: "Dominicus Excel",
    date: "25 Februari 2026",
    category: "Opini",
    img: "mading 5.jpeg",
    content: `<p>Kelas XI F2 Terima Hasil Pembagian Rapor dengan Hasil yang Memuaskan<p>
<p>Sampit – Kelas XI F2 SMAN 1 Sampit menerima hasil pembagian rapor semester ini dengan perasaan bangga dan penuh rasa syukur. Secara keseluruhan, nilai yang diperoleh siswa-siswi XI F2 menunjukkan hasil yang sangat memuaskan dan mencerminkan kerja keras mereka selama proses pembelajaran.<p>
<p>Momen pembagian rapor menjadi saat yang dinantikan oleh seluruh siswa. Tidak hanya sebagai bentuk evaluasi hasil belajar, tetapi juga sebagai cerminan usaha, kedisiplinan, serta tanggung jawab dalam mengikuti kegiatan akademik di sekolah. Banyak siswa yang mengalami peningkatan nilai, sementara yang lainnya tetap konsisten mempertahankan prestasi mereka.<p>
<p>Keberhasilan ini tentu tidak lepas dari peran guru-guru yang telah membimbing dengan penuh dedikasi, serta semangat belajar siswa yang terus berkembang. Dukungan dan kerja sama antar teman sekelas juga menjadi salah satu faktor penting dalam menciptakan suasana belajar yang positif dan kondusif.<p>
<p>Untuk ke depannya, kelas XI F2 berharap agar nilai rapor yang telah diraih saat ini dapat dijadikan motivasi dan pelajaran untuk menjadi lebih baik lagi. Hasil yang memuaskan bukanlah akhir dari perjuangan, melainkan langkah awal untuk terus meningkatkan prestasi, memperbaiki kekurangan, dan mencapai target yang lebih tinggi di semester berikutnya.<p>
<p>Dengan semangat kebersamaan dan tekad yang kuat, XI F2 optimis dapat meraih pencapaian yang lebih gemilang di masa mendatang.</p>`
  },
  {
    title: "Kelas XI F2 Meriahkan Jalan Sehat SMANSA pada Event Hajatan ke-63 dengan Tema Unik",
    author: "Dominicus Excel",
    date: "24 Februari 2026",
    category: "Kebersamaan",
    img: "mading 4.jpeg",
    content: `<p>Kelas XI F2 Meriahkan Jalan Sehat SMANSA pada Event Hajatan ke-63 dengan Tema Unik<p>
<p>Sampit – Dalam rangka memeriahkan Hajatan ke-63 yang diselenggarakan oleh SMAN 1 Sampit, kelas XI F2 turut berpartisipasi dalam kegiatan Jalan Sehat SMANSA yang berlangsung dengan penuh semangat dan kreativitas. Mengusung tema bebas kreatif, XI F2 tampil unik dengan konsep “Pemancing dan Ikan”.<p>
<p>Tema tersebut dipilih melalui diskusi bersama seluruh anggota kelas. Mereka ingin menampilkan sesuatu yang berbeda, menarik, dan tetap menghibur. Dengan kerja sama yang solid, para siswa menyiapkan berbagai properti seperti alat pancing, kostum ikan berwarna-warni, serta atribut pendukung lainnya yang menambah keseruan penampilan mereka.<p>
<p>Saat kegiatan jalan sehat dimulai, XI F2 langsung mencuri perhatian peserta lain dan penonton di sepanjang rute. Kostum yang kreatif dan kekompakan mereka dalam berjalan bersama membuat suasana semakin meriah. Beberapa siswa berperan sebagai pemancing lengkap dengan gaya khasnya, sementara yang lain mengenakan kostum ikan yang lucu dan atraktif.<p>
<p>Partisipasi dalam kegiatan ini tidak hanya menjadi ajang hiburan, tetapi juga mempererat kebersamaan antaranggota kelas. Melalui momen tersebut, XI F2 menunjukkan bahwa kekompakan dan kreativitas dapat menciptakan pengalaman yang berkesan.<p?
<p>Dengan semangat Hajatan ke-63, kelas XI F2 berharap kebersamaan dan kreativitas seperti ini dapat terus terjaga dalam setiap kegiatan sekolah.</p>`
  }
];

function openArticleModal(index) {
  const data = ARTICLES_DATA[index];
  if (!data) return;
  const modal = document.createElement("div");
  modal.id = "article-modal";
  modal.innerHTML = `
    <div class="modal-backdrop"></div>
    <div class="modal-box" role="dialog" aria-modal="true" aria-label="${data.title}">
      <button class="modal-close" aria-label="Tutup">✕</button>
      <div class="modal-hero" style="background-image:url('${data.img}')">
        <div class="modal-hero-overlay"></div>
        <span class="feat-tag">${data.category}</span>
        <h2 class="modal-title">${data.title}</h2>
      </div>
      <div class="modal-body">
        <div class="modal-meta">
          <span>✍️ ${data.author}</span>
          <span>📅 ${data.date}</span>
        </div>
        <div class="modal-content">${data.content}</div>
      </div>
    </div>`;
  document.body.appendChild(modal);
  document.body.style.overflow = "hidden";
  requestAnimationFrame(() => modal.classList.add("open"));

  function closeModal() {
    modal.classList.remove("open");
    setTimeout(() => { modal.remove(); document.body.style.overflow = ""; }, 380);
  }
  modal.querySelector(".modal-backdrop").addEventListener("click", closeModal);
  modal.querySelector(".modal-close").addEventListener("click", closeModal);
  window.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); }, { once: true });
}

// Wire up card read buttons
document.querySelectorAll(".article-card").forEach((card, i) => {
  card.querySelector(".card-read")?.addEventListener("click", (e) => {
    e.preventDefault();
    openArticleModal(i);
  });
  card.querySelector(".card-title")?.addEventListener("click", (e) => {
    e.preventDefault();
    openArticleModal(i);
  });
});

/* ─── SCROLL HANDLER (combined) ────────────────────────────── */
function onScroll() {
  updateProgress();
  updateNavbar();
  updateParallax();
}

window.addEventListener("scroll", onScroll, { passive: true });

/* ─── INIT ──────────────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  buildSnapDots();
  updateNavbar();

  // Animate hero elements on load
  setTimeout(() => {
    document.querySelectorAll("#hero .reveal-up").forEach(el => {
      el.classList.add("visible");
    });
  }, 200);
});
