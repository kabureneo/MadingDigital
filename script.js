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
    title: "5 Teknik Belajar Efektif di Era Digital",
    author: "Rizky Pratama",
    date: "1 Maret 2026",
    category: "Pendidikan",
    img: "https://images.unsplash.com/photo-1606761568499-6d2451b23c66?w=900&auto=format&fit=crop",
    content: `<p>Di era yang serba digital ini, distraksi datang dari mana-mana — notifikasi media sosial, video pendek yang tiada habisnya, hingga percakapan grup yang tak pernah sepi. Ironisnya, alat yang harusnya membantu belajar justru sering menjadi penghalang terbesar konsentrasi.</p>
    <p>Namun, bukan berarti teknologi adalah musuh prestasi. Kuncinya ada pada bagaimana kita mengelola diri dan memilih teknik yang tepat.</p>
    <h3>1. Teknik Pomodoro Digital</h3>
    <p>Belajar selama 25 menit penuh tanpa gangguan, lalu beristirahat 5 menit. Gunakan aplikasi timer khusus dan aktifkan mode fokus di ponselmu. Penelitian menunjukkan otak manusia bekerja paling optimal dalam sesi pendek yang intens daripada marathon belajar yang melelahkan.</p>
    <h3>2. Active Recall dengan Flashcard Digital</h3>
    <p>Daripada membaca ulang catatan berkali-kali, ujilah dirimu sendiri. Aplikasi seperti Anki menggunakan algoritma spaced repetition — kamu akan diuji tepat saat kamu hampir lupa, sehingga memori jangka panjang terbentuk lebih efisien.</p>
    <h3>3. Mind Mapping dan Visualisasi</h3>
    <p>Otak kita lebih mudah mengingat gambar dan pola daripada teks lurus. Buat mind map digital untuk setiap bab pelajaran. Hubungkan konsep satu dengan lainnya dengan warna dan simbol yang bermakna bagimu.</p>
    <h3>4. Belajar dengan Mengajar (Feynman Technique)</h3>
    <p>Coba jelaskan materi yang baru kamu pelajari seolah kamu mengajar teman yang tidak tahu apa-apa. Rekam penjelasanmu, upload sebagai video, atau tulis di blog. Proses mengajar memaksa otakmu mengidentifikasi celah pemahaman yang selama ini tersembunyi.</p>
    <h3>5. Environment Batching</h3>
    <p>Pisahkan secara tegas antara ruang belajar dan ruang hiburan — baik secara fisik maupun digital. Buat profil browser terpisah untuk belajar, tanpa akses ke media sosial. Kondisikan otakmu bahwa saat kamu membuka laptop di meja belajar, artinya waktunya fokus.</p>
    <p>Prestasi bukan soal berapa lama kamu duduk di depan buku, melainkan seberapa cerdas kamu menggunakan setiap menitnya. Mulai terapkan satu teknik hari ini!</p>`
  },
  {
    title: "Ekspresiku: Pameran Lukisan Siswa X-IPS",
    author: "Dewi Sartika",
    date: "28 Februari 2026",
    category: "Seni & Budaya",
    img: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=900&auto=format&fit=crop",
    content: `<p>Lorong kelas X-IPS yang biasanya ramai dengan obrolan dan gelak tawa kini berubah menjadi galeri seni yang sunyi dan penuh makna. Puluhan lukisan karya siswa tergantung rapi di sepanjang dinding — setiap karya menceritakan kisahnya sendiri.</p>
    <p>Selama tiga minggu, siswa kelas X-IPS mendedikasikan pelajaran Seni Budaya bukan untuk menghafal teori, melainkan untuk berkarya. Hasilnya luar biasa di luar ekspektasi para guru.</p>
    <blockquote>"Saya tidak pernah menyangka bisa melukis. Tapi ternyata ketika diberi kebebasan berekspresi, ada sesuatu yang mengalir begitu saja dari dalam diri." — Zahra Amelia, siswa X-IPS 2</blockquote>
    <p>Tema yang dipilih tahun ini adalah "Identitas dan Akar" — sebuah eksplorasi tentang siapa kita sebenarnya di tengah arus globalisasi yang deras. Ada yang melukis rumah adat kampung halamannya, ada yang menuangkan konflik identitas remaja dalam warna-warna gelap yang kuat, dan ada pula yang memilih keindahan batik sebagai subjek abstrak.</p>
    <p>Pameran ini terbuka untuk seluruh warga sekolah selama satu minggu. Guru Seni Bu Kartini berharap acara ini bisa menjadi agenda tetap tahunan dan diperluas menjadi pameran bersama antar kelas.</p>`
  },
  {
    title: "Tim Basket Putra Lolos Final Kota",
    author: "Bagas Santoso",
    date: "27 Februari 2026",
    category: "Olahraga",
    img: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=900&auto=format&fit=crop",
    content: `<p>Tepuk tangan riuh memenuhi gedung olahraga tertutup GOR Kota ketika wasit meniup peluit panjang tanda berakhirnya pertandingan semifinal. Skor akhir 67-54 untuk kemenangan tim basket putra sekolah kita melawan SMA Negeri 4.</p>
    <p>Perjalanan menuju final ini bukan tanpa rintangan. Di babak penyisihan grup, tim sempat terseok dengan kekalahan dramatis satu poin melawan SMA Bina Bangsa. Namun mental juara para pemain tidak goyah.</p>
    <blockquote>"Kami bangkit setelah kekalahan itu. Kami evaluasi, kami perbaiki rotasi, dan kami berlatih dua kali lebih keras." — Ardiansyah, kapten tim</blockquote>
    <p>Highlight pertandingan semifinal adalah aksi Fadil Nugroho, shooting guard kelas XII-IPA, yang mencetak 3 tembakan tiga angka berturut-turut di kuarter keempat saat tim tertinggal 6 poin. Seisi tribun berdiri dan bersorak.</p>
    <p>Final akan digelar Sabtu, 8 Maret 2026 pukul 14.00 WIB di GOR Kota. Mari kita datang beramai-ramai dan dukung tim kita meraih trofi pertama dalam 7 tahun terakhir!</p>`
  },
  {
    title: "Ekstrakurikuler Robotika Raih Silver di Kompetisi Nasional",
    author: "Farhan Maulana",
    date: "26 Februari 2026",
    category: "Teknologi",
    img: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=900&auto=format&fit=crop",
    content: `<p>Robot bernama "Nusantara-X" itu bergerak mulus melewati rintangan demi rintangan di arena kompetisi. Ratusan pasang mata menyaksikan dengan campur aduk antara tegang dan kagum. Dan ketika skor akhir diumumkan — Silver Medal — teriakan bahagia meledak dari sudut tribun tempat tim robotika sekolah kita duduk.</p>
    <p>Kompetisi Robotika Nasional 2026 yang digelar di Jakarta Convention Center diikuti oleh lebih dari 200 tim dari seluruh Indonesia. Bersaing di kategori Autonomous Navigation, Nusantara-X berhasil menyelesaikan course dengan waktu tercepat ketiga dan akurasi tertinggi keempat.</p>
    <h3>Inovasi di Balik Nusantara-X</h3>
    <p>Yang membuat robot ini istimewa adalah sistem navigasi berbasis visi komputer yang dikembangkan sendiri oleh anggota tim, bukan menggunakan library siap pakai. "Kami tulis algoritmanya dari nol menggunakan Python dan OpenCV. Prosesnya butuh 4 bulan," jelas Ammar Hakim, lead programmer tim.</p>
    <p>Robot ini juga dilengkapi AI sederhana yang memungkinkannya belajar dari jalur yang pernah dilewati dan mengoptimalkan rute secara real-time.</p>
    <p>Pembina ekskul robotika, Pak Hendra, menyatakan tim akan terus berlatih untuk kompetisi internasional yang rencananya akan diikuti akhir tahun ini. "Silver hari ini adalah motivasi untuk Gold berikutnya."</p>`
  },
  {
    title: "Stop Bullying: Sudah Saatnya Kita Berbicara",
    author: "Nadia Putri",
    date: "25 Februari 2026",
    category: "Opini",
    img: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=900&auto=format&fit=crop",
    content: `<p><em>Catatan redaksi: Artikel ini merupakan opini pribadi penulis dan tidak merepresentasikan posisi resmi sekolah.</em></p>
    <p>Ada seorang teman yang berhenti masuk sekolah tiga minggu lalu. Alasan resminya: sakit. Tapi mereka yang jeli tahu bahwa di balik "sakit" itu tersimpan luka yang jauh lebih dalam — luka akibat kata-kata yang dilontarkan teman-temannya sendiri, setiap hari, selama berbulan-bulan.</p>
    <p>Perundungan — baik yang kasat mata maupun yang tersembunyi di balik lelucon — adalah krisis nyata di sekolah kita. Dan diam adalah bentuk persetujuan.</p>
    <h3>Mengapa Kita Diam?</h3>
    <p>Banyak dari kita memilih diam bukan karena tidak peduli, melainkan karena takut: takut dianggap lebay, takut ikut jadi target, atau takut dikucilkan. Budaya "jangan ikut campur urusan orang lain" telah menjadi tameng pembenaran yang sangat nyaman untuk dipegang.</p>
    <p>Padahal, satu suara yang berani berkata "hei, itu tidak lucu" dapat mengubah dinamika keseluruhan kelompok.</p>
    <h3>Apa yang Bisa Kita Lakukan?</h3>
    <p>Pertama, kenali bahwa perundungan tidak selalu berbentuk kekerasan fisik. Mengucilkan seseorang, menyebarkan gosip, atau terus-menerus meledek penampilan seseorang — itu semua adalah perundungan.</p>
    <p>Kedua, jadilah upstander, bukan bystander. Kamu tidak harus konfrontasi langsung jika tidak aman. Temani korban setelah kejadian, laporkan kepada guru, atau sekadar kirimi mereka pesan yang mengatakan kamu ada untuk mereka.</p>
    <p>Sekolah yang aman bukan sekolah yang tidak punya masalah — tapi sekolah yang warganya berani berbicara ketika ada yang salah. Mulailah dari kita.</p>`
  },
  {
    title: "Band Sekolah Tampil di Festival Musik Indie Kota",
    author: "Ayu Lestari",
    date: "24 Februari 2026",
    category: "Seni & Budaya",
    img: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=900&auto=format&fit=crop",
    content: `<p>Matahari baru saja terbenam ketika nama band "Resonansi Muda" dipanggil ke atas panggung Festival Musik Indie Kota. Empat siswa berseragam putih abu-abu — gitar, bass, drum, dan vokal — berjalan ke tengah sorotan lampu dengan rasa gugup yang mereka sembunyikan di balik senyum.</p>
    <p>Lagu pertama yang mereka bawakan berjudul "Persimpangan" — sebuah lagu original karya vokalis mereka, Kirana Salsabila, yang terinspirasi dari pengalaman memilih antara impian dan ekspektasi orang tua.</p>
    <blockquote>"Waktu kami mulai main, ada beberapa orang yang masih ngobrol. Tapi setelah reff pertama, semua diam dan nonton. Itu perasaan yang tidak akan pernah saya lupa." — Kirana, vokalis</blockquote>
    <p>Resonansi Muda membawakan tiga lagu dalam sesi 15 menit mereka. Lagu terakhir, "Sabtu Sore di Kantin," justru menjadi yang paling disambut — liriknya yang jujur tentang kehidupan sehari-hari di sekolah membuat banyak penonton tertawa dan mengangguk-angguk kesetujuan.</p>
    <p>Meski tidak memenangkan penghargaan malam itu, Resonansi Muda pulang dengan sesuatu yang lebih berharga: kepercayaan diri dan rekaman live yang sudah ditonton hampir 5.000 kali di TikTok dalam 24 jam pertama.</p>`
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
