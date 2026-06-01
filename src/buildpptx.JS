const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const fs = require("fs");

const livenessImg = fs.readFileSync('/home/claude/liveness.b64', 'utf8');
const homescreenImg = fs.readFileSync('/home/claude/homescreen.b64', 'utf8');

// ─── PALETTE ───────────────────────────────────────────────
const P = {
  bg:      "060D17",
  bgMid:   "0A1628",
  card:    "0D1F35",
  card2:   "112240",
  cyan:    "00C8F0",
  green:   "00E5A0",
  purple:  "7C5CF5",
  gold:    "F5C842",
  red:     "FF4757",
  white:   "FFFFFF",
  offwh:   "BFD0E2",
  muted:   "6A8099",
};

async function icon(name, color = "#FFFFFF", size = 256) {
  const fa = require("react-icons/fa");
  const md = require("react-icons/md");
  const all = { ...fa, ...md };
  const Comp = all[name];
  if (!Comp) throw new Error("Icon not found: " + name);
  const svg = ReactDOMServer.renderToStaticMarkup(
    React.createElement(Comp, { color, size: String(size) })
  );
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}

function cardShape(s, x, y, w, h, accentColor, topStripe = false) {
  s.addShape("rect", { x, y, w, h,
    fill: { color: P.card },
    line: { color: accentColor, width: 0.6, transparency: 55 },
    shadow: { type: "outer", color: "000000", blur: 10, offset: 2, angle: 135, opacity: 0.25 }
  });
  if (topStripe) {
    s.addShape("rect", { x, y, w, h: 0.06, fill: { color: accentColor }, line: { color: accentColor } });
  }
}

async function main() {
  const icons = {
    shield:   await icon("FaShieldAlt",    "#00C8F0"),
    shieldW:  await icon("FaShieldAlt",    "#FFFFFF"),
    wifi:     await icon("FaWifi",          "#FF4757"),
    brain:    await icon("FaBrain",         "#7C5CF5"),
    mobile:   await icon("FaMobileAlt",     "#00C8F0"),
    db:       await icon("FaDatabase",      "#00E5A0"),
    cloud:    await icon("FaCloud",         "#7C5CF5"),
    check:    await icon("FaCheckCircle",   "#00E5A0"),
    user:     await icon("FaUser",          "#00C8F0"),
    lock:     await icon("FaLock",          "#00C8F0"),
    camera:   await icon("FaCamera",        "#00C8F0"),
    eye:      await icon("FaEye",           "#00E5A0"),
    bolt:     await icon("FaBolt",          "#F5C842"),
    sync:     await icon("FaSync",          "#7C5CF5"),
    trash:    await icon("FaTrash",         "#FF4757"),
    android:  await icon("FaAndroid",       "#00E5A0"),
    globe:    await icon("FaGlobeAsia",     "#00E5A0"),
    rocket:   await icon("FaRocket",        "#F5C842"),
    cogs:     await icon("FaCogs",          "#7C5CF5"),
    github:   await icon("FaGithub",        "#FFFFFF"),
    factory:  await icon("FaIndustry",      "#00C8F0"),
    leaf:     await icon("FaLeaf",          "#00E5A0"),
    plane:    await icon("FaPlane",         "#F5C842"),
  };

  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  pres.author = "DataLake Team";
  pres.title = "DataLake FaceAuth — Hackathon 7.0";

  // ══════════════════════════════
  // SLIDE 1 — TITLE
  // ══════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: P.bg };

    // Glow orbs
    s.addShape("oval", { x: -0.8, y: -0.8, w: 4, h: 4, fill: { color: P.purple, transparency: 82 }, line: { color: "000000", transparency: 100 } });
    s.addShape("oval", { x: 8.2, y: 2.8, w: 3.5, h: 3.5, fill: { color: P.cyan, transparency: 85 }, line: { color: "000000", transparency: 100 } });

    // HUD grid lines
    for (let i = 0; i < 7; i++) {
      s.addShape("line", { x: 0, y: 0.4 + i * 0.75, w: 10, h: 0, line: { color: P.cyan, width: 0.3, transparency: 90 } });
    }

    // Top badge
    s.addShape("rect", { x: 3.7, y: 0.2, w: 2.6, h: 0.38, fill: { color: P.cyan, transparency: 10 }, line: { color: P.cyan } });
    s.addText("✦  HACKATHON 7.0  ✦", { x: 3.7, y: 0.2, w: 2.6, h: 0.38, fontSize: 10, bold: true, color: P.bg, align: "center", valign: "middle", charSpacing: 2 });

    // Logo shield circle
    s.addShape("oval", { x: 4.3, y: 0.75, w: 1.4, h: 1.4, fill: { color: P.cyan, transparency: 15 }, line: { color: P.cyan, width: 2 } });
    s.addImage({ data: icons.shieldW, x: 4.55, y: 0.9, w: 0.9, h: 0.9 });

    // Title
    s.addText("DataLake FaceAuth", { x: 0.3, y: 2.2, w: 9.4, h: 0.9, fontSize: 54, bold: true, color: P.white, align: "center", fontFace: "Arial Black", margin: 0 });
    s.addText("Offline Facial Recognition & Liveness Detection System", { x: 0.3, y: 3.1, w: 9.4, h: 0.45, fontSize: 17, color: P.cyan, align: "center", fontFace: "Calibri", margin: 0 });

    // Divider dots
    s.addText("◆ ◆ ◆", { x: 0, y: 3.6, w: 10, h: 0.35, fontSize: 10, color: P.purple, align: "center", margin: 0 });

    // 3 badge pills
    const badges = [
      { text: "⚡  100% Offline", c: P.cyan },
      { text: "🧠  Edge AI Models", c: P.purple },
      { text: "☁️  AWS Sync", c: P.green },
    ];
    badges.forEach((b, i) => {
      const bx = 1.0 + i * 2.7;
      s.addShape("rect", { x: bx, y: 4.0, w: 2.3, h: 0.55, fill: { color: b.c, transparency: 82 }, line: { color: b.c, transparency: 20 } });
      s.addText(b.text, { x: bx, y: 4.0, w: 2.3, h: 0.55, fontSize: 13, bold: true, color: b.c, align: "center", valign: "middle", margin: 0 });
    });

    // Footer
    s.addText("Team DataLake  |  Field Biometric Authentication", { x: 0, y: 5.25, w: 10, h: 0.25, fontSize: 9, color: P.muted, align: "center" });
  }

  // ══════════════════════════════
  // SLIDE 2 — PROBLEM
  // ══════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: P.bgMid };

    // Title strip
    s.addShape("rect", { x: 0, y: 0, w: 10, h: 0.95, fill: { color: P.bg }, line: { color: P.bg } });
    s.addShape("rect", { x: 0.35, y: 0.2, w: 0.07, h: 0.6, fill: { color: P.red }, line: { color: P.red } });
    s.addText("Problem Statement", { x: 0.52, y: 0.18, w: 8, h: 0.4, fontSize: 24, bold: true, color: P.white, fontFace: "Arial Black", margin: 0 });
    s.addText("Why current solutions fail in the field", { x: 0.52, y: 0.58, w: 8, h: 0.28, fontSize: 11, color: P.red, fontFace: "Calibri", margin: 0 });

    const problems = [
      { icon: icons.wifi,   color: P.red,    title: "No Connectivity",     desc: "60%+ of field sites—factories, rural zones, checkpoints—have zero or unstable internet." },
      { icon: icons.user,   color: P.gold,   title: "Manual ID Checks",    desc: "Human-based verification is 3× slower, prone to error and cannot scale." },
      { icon: icons.shield, color: P.purple, title: "Photo/Video Spoofing", desc: "Basic face systems are tricked by printed photos or pre-recorded videos." },
      { icon: icons.cloud,  color: P.red,    title: "Cloud Dependency",     desc: "Cloud-only auth fails completely during internet outages—100% downtime." },
    ];

    problems.forEach((p, i) => {
      const y = 1.1 + i * 1.08;
      cardShape(s, 0.35, y, 5.8, 0.92, p.color);
      s.addShape("rect", { x: 0.35, y, w: 0.09, h: 0.92, fill: { color: p.color }, line: { color: p.color } });
      s.addImage({ data: p.icon, x: 0.55, y: y + 0.22, w: 0.46, h: 0.46 });
      s.addText(p.title, { x: 1.12, y: y + 0.1, w: 4.9, h: 0.36, fontSize: 14, bold: true, color: P.white, fontFace: "Arial Black", margin: 0 });
      s.addText(p.desc,  { x: 1.12, y: y + 0.46, w: 4.9, h: 0.38, fontSize: 10.5, color: P.offwh, fontFace: "Calibri", margin: 0 });
    });

    // Right impact panel
    cardShape(s, 6.35, 1.1, 3.3, 4.22, P.cyan);
    s.addShape("rect", { x: 6.35, y: 1.1, w: 3.3, h: 0.06, fill: { color: P.cyan }, line: { color: P.cyan } });
    s.addText("The Cost of Gaps", { x: 6.35, y: 1.2, w: 3.3, h: 0.45, fontSize: 15, bold: true, color: P.cyan, align: "center", fontFace: "Arial Black", margin: 0 });

    const stats = [
      { v: "60%+", l: "Field workers lack\nstable internet" },
      { v: "3×",   l: "Slower manual\nID verification" },
      { v: "~0%",  l: "Uptime with pure\ncloud auth + outage" },
    ];
    stats.forEach((st, i) => {
      s.addShape("rect", { x: 6.55, y: 1.78 + i * 1.1, w: 2.9, h: 0.98, fill: { color: P.bg, transparency: 10 }, line: { color: P.cyan, transparency: 70 } });
      s.addText(st.v, { x: 6.55, y: 1.82 + i * 1.1, w: 2.9, h: 0.44, fontSize: 32, bold: true, color: P.cyan, align: "center", fontFace: "Arial Black", margin: 0 });
      s.addText(st.l, { x: 6.55, y: 2.26 + i * 1.1, w: 2.9, h: 0.45, fontSize: 9.5, color: P.offwh, align: "center", fontFace: "Calibri", margin: 0 });
    });
  }

  // ══════════════════════════════
  // SLIDE 3 — SOLUTION
  // ══════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: P.bgMid };
    s.addShape("rect", { x: 0, y: 0, w: 10, h: 0.95, fill: { color: P.bg }, line: { color: P.bg } });
    s.addShape("rect", { x: 0.35, y: 0.2, w: 0.07, h: 0.6, fill: { color: P.green }, line: { color: P.green } });
    s.addText("Our Solution", { x: 0.52, y: 0.18, w: 8, h: 0.4, fontSize: 24, bold: true, color: P.white, fontFace: "Arial Black", margin: 0 });
    s.addText("100% offline biometric authentication powered by edge AI", { x: 0.52, y: 0.58, w: 8, h: 0.28, fontSize: 11, color: P.green, fontFace: "Calibri", margin: 0 });

    const features = [
      { icon: icons.mobile, c: P.cyan,   title: "Zero Internet Needed",    desc: "All AI inference runs entirely on the device. No server calls, no latency." },
      { icon: icons.eye,    c: P.green,  title: "Liveness Detection",       desc: "Blink, smile & head turn challenges reject photos, videos & masks." },
      { icon: icons.brain,  c: P.purple, title: "Face Recognition",         desc: "MobileFaceNet embeddings matched with cosine similarity at <1s speed." },
      { icon: icons.db,     c: P.green,  title: "SQLite Offline Storage",   desc: "Auth logs & face embeddings persist locally with zero data loss." },
      { icon: icons.cloud,  c: P.purple, title: "AWS Batch Sync",           desc: "Smart sync batches 25 records per request when network returns." },
      { icon: icons.shield, c: P.cyan,   title: "Anti-Spoof AI",            desc: "MobileNetV3 INT8 model actively classifies and blocks spoof attempts." },
    ];

    const cols = [0.35, 3.48, 6.62];
    const rows = [1.08, 2.88];
    features.forEach((f, i) => {
      const x = cols[i % 3], y = rows[Math.floor(i / 3)];
      cardShape(s, x, y, 2.98, 1.65, f.c, true);
      s.addImage({ data: f.icon, x: x + 0.16, y: y + 0.2, w: 0.5, h: 0.5 });
      s.addText(f.title, { x: x + 0.75, y: y + 0.15, w: 2.15, h: 0.42, fontSize: 12, bold: true, color: P.white, fontFace: "Arial Black", margin: 0 });
      s.addText(f.desc,  { x: x + 0.75, y: y + 0.57, w: 2.15, h: 0.95, fontSize: 9.5, color: P.offwh, fontFace: "Calibri", margin: 0 });
    });
  }

  // ══════════════════════════════
  // SLIDE 4 — ARCHITECTURE
  // ══════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: P.bgMid };
    s.addShape("rect", { x: 0, y: 0, w: 10, h: 0.95, fill: { color: P.bg }, line: { color: P.bg } });
    s.addShape("rect", { x: 0.35, y: 0.2, w: 0.07, h: 0.6, fill: { color: P.purple }, line: { color: P.purple } });
    s.addText("System Architecture", { x: 0.52, y: 0.18, w: 8, h: 0.4, fontSize: 24, bold: true, color: P.white, fontFace: "Arial Black", margin: 0 });
    s.addText("End-to-end on-device AI pipeline", { x: 0.52, y: 0.58, w: 8, h: 0.28, fontSize: 11, color: P.purple, fontFace: "Calibri", margin: 0 });

    const steps = [
      { icon: icons.camera,  label: "Camera",         sub: "VisionCamera\nFrame API",      c: P.cyan },
      { icon: icons.eye,     label: "Face Detect",    sub: "MediaPipe\nLandmarks",          c: P.green },
      { icon: icons.shield,  label: "Liveness",       sub: "Blink/Smile\nHead Turn",        c: P.purple },
      { icon: icons.brain,   label: "Anti-Spoof",     sub: "MobileNetV3\nINT8 TFLite",      c: P.gold },
      { icon: icons.lock,    label: "Face Match",     sub: "MobileFaceNet\nCosine Sim",     c: P.cyan },
      { icon: icons.db,      label: "SQLite",         sub: "Logs +\nEmbeddings",            c: P.green },
      { icon: icons.cloud,   label: "AWS DynamoDB",   sub: "Batch 25\nrecords/req",         c: P.purple },
      { icon: icons.trash,   label: "Auto Purge",     sub: "7-day\ncleanup",               c: P.red },
    ];

    const bw = 1.07, bh = 1.32, startX = 0.32, y = 1.1;
    steps.forEach((st, i) => {
      const x = startX + i * 1.18;
      cardShape(s, x, y, bw, bh, st.c, true);
      s.addImage({ data: st.icon, x: x + 0.26, y: y + 0.1, w: 0.52, h: 0.52 });
      s.addText(st.label, { x, y: y + 0.64, w: bw, h: 0.3, fontSize: 8, bold: true, color: P.white, align: "center", fontFace: "Arial Black", margin: 0 });
      s.addText(st.sub,   { x, y: y + 0.95, w: bw, h: 0.34, fontSize: 7, color: st.c, align: "center", fontFace: "Calibri", margin: 0 });
      if (i < steps.length - 1) {
        s.addText("›", { x: x + bw - 0.01, y: y + 0.52, w: 0.2, h: 0.3, fontSize: 14, color: P.cyan, align: "center", bold: true, margin: 0 });
      }
    });

    // Phase banners
    s.addShape("rect", { x: 0.32, y: 2.52, w: 5.5, h: 0.36, fill: { color: P.cyan, transparency: 88 }, line: { color: P.cyan, transparency: 40 } });
    s.addText("📱  ON-DEVICE INFERENCE  —  100% Offline", { x: 0.32, y: 2.52, w: 5.5, h: 0.36, fontSize: 10, bold: true, color: P.cyan, align: "center", valign: "middle" });
    s.addShape("rect", { x: 5.9, y: 2.52, w: 3.78, h: 0.36, fill: { color: P.purple, transparency: 88 }, line: { color: P.purple, transparency: 40 } });
    s.addText("☁️  CLOUD SYNC LAYER  —  When Online", { x: 5.9, y: 2.52, w: 3.78, h: 0.36, fontSize: 10, bold: true, color: P.purple, align: "center", valign: "middle" });

    // Description card
    cardShape(s, 0.32, 3.0, 9.36, 0.95, P.cyan);
    s.addText([
      { text: "Key Innovation: ", options: { bold: true, color: P.cyan } },
      { text: "All detection, liveness, anti-spoof, and face recognition runs on-device using ", options: { color: P.offwh } },
      { text: "INT8 quantized TFLite models (~8MB total)", options: { bold: true, color: P.green } },
      { text: ". No biometric data ever leaves the device until the operator manually triggers cloud sync via AWS DynamoDB.", options: { color: P.offwh } },
    ], { x: 0.52, y: 3.06, w: 9.0, h: 0.83, fontSize: 11, fontFace: "Calibri" });
  }

  // ══════════════════════════════
  // SLIDE 5 — TECH STACK
  // ══════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: P.bgMid };
    s.addShape("rect", { x: 0, y: 0, w: 10, h: 0.95, fill: { color: P.bg }, line: { color: P.bg } });
    s.addShape("rect", { x: 0.35, y: 0.2, w: 0.07, h: 0.6, fill: { color: P.gold }, line: { color: P.gold } });
    s.addText("Tech Stack", { x: 0.52, y: 0.18, w: 8, h: 0.4, fontSize: 24, bold: true, color: P.white, fontFace: "Arial Black", margin: 0 });
    s.addText("Lightweight, battle-tested, production-grade", { x: 0.52, y: 0.58, w: 8, h: 0.28, fontSize: 11, color: P.gold, fontFace: "Calibri", margin: 0 });

    const stack = [
      { emoji: "📱", name: "React Native 0.73",  role: "Cross-platform mobile",    c: P.cyan },
      { emoji: "🔷", name: "TypeScript",          role: "Type-safe codebase",       c: P.purple },
      { emoji: "📷", name: "VisionCamera",        role: "Camera & frame processor", c: P.green },
      { emoji: "🤖", name: "TensorFlow Lite INT8",role: "On-device AI inference",   c: P.gold },
      { emoji: "🧠", name: "MobileFaceNet",       role: "Lightweight face model",   c: P.cyan },
      { emoji: "🛡️", name: "MobileNetV3",         role: "Anti-spoof classifier",    c: P.purple },
      { emoji: "💾", name: "SQLite",              role: "Offline local storage",    c: P.green },
      { emoji: "☁️", name: "AWS DynamoDB",        role: "Cloud sync & audit log",   c: P.gold },
      { emoji: "🤖", name: "Android 8.0+",        role: "Target platform (API 26+)", c: P.cyan },
    ];

    stack.forEach((item, i) => {
      const col = i % 3, row = Math.floor(i / 3);
      const x = 0.35 + col * 3.22, y = 1.06 + row * 1.48;
      cardShape(s, x, y, 3.05, 1.3, item.c);
      s.addShape("rect", { x, y, w: 0.08, h: 1.3, fill: { color: item.c }, line: { color: item.c } });
      s.addText(item.emoji, { x: x + 0.1, y: y + 0.3, w: 0.65, h: 0.65, fontSize: 26, align: "center" });
      s.addText(item.name, { x: x + 0.82, y: y + 0.15, w: 2.15, h: 0.48, fontSize: 12.5, bold: true, color: P.white, fontFace: "Arial Black", margin: 0 });
      s.addText(item.role, { x: x + 0.82, y: y + 0.65, w: 2.15, h: 0.5, fontSize: 10, color: P.offwh, fontFace: "Calibri", margin: 0 });
    });
  }

  // ══════════════════════════════
  // SLIDE 6 — DEMO SCREENSHOTS
  // ══════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: P.bg };

    // Stars bg feel
    s.addShape("oval", { x: -1, y: -1, w: 4, h: 4, fill: { color: P.green, transparency: 90 }, line: { color: "000000", transparency: 100 } });
    s.addShape("oval", { x: 7.5, y: 2.5, w: 3.5, h: 3.5, fill: { color: P.cyan, transparency: 90 }, line: { color: "000000", transparency: 100 } });

    s.addText("Live App Demo", { x: 0.35, y: 0.12, w: 9.3, h: 0.55, fontSize: 30, bold: true, color: P.white, fontFace: "Arial Black", align: "center", margin: 0 });
    s.addText("Real screenshots from our working Android APK", { x: 0.35, y: 0.67, w: 9.3, h: 0.28, fontSize: 12, color: P.cyan, align: "center", fontFace: "Calibri", margin: 0 });

    // Left — Home Screen
    cardShape(s, 0.25, 1.05, 4.45, 4.35, P.green);
    s.addShape("rect", { x: 0.25, y: 1.05, w: 4.45, h: 0.07, fill: { color: P.green }, line: { color: P.green } });
    s.addText("🏠  DataLake 3.0 — Home Screen", { x: 0.35, y: 1.12, w: 4.25, h: 0.36, fontSize: 11.5, bold: true, color: P.green, fontFace: "Arial Black", margin: 0 });

    // Phone bezel effect
    s.addShape("rect", { x: 1.05, y: 1.54, w: 2.85, h: 3.6, fill: { color: "050C15" }, line: { color: P.green, width: 1 } });
    s.addImage({ data: homescreenImg, x: 1.1, y: 1.58, w: 2.75, h: 3.52, sizing: { type: "contain", w: 2.75, h: 3.52 } });

    // Feature callouts
    const leftNotes = ["Sync status dashboard", "Authenticate (blue CTA)", "Enroll New Face", "Sync to AWS (green)"];
    leftNotes.forEach((n, i) => {
      s.addText(`• ${n}`, { x: 0.3, y: 1.62 + i * 0.82, w: 0.72, h: 0.38, fontSize: 7.5, color: P.offwh, fontFace: "Calibri", margin: 0 });
    });

    // Right — Liveness Screen
    cardShape(s, 5.3, 1.05, 4.45, 4.35, P.cyan);
    s.addShape("rect", { x: 5.3, y: 1.05, w: 4.45, h: 0.07, fill: { color: P.cyan }, line: { color: P.cyan } });
    s.addText("👁  Liveness Challenge — Authentication", { x: 5.4, y: 1.12, w: 4.25, h: 0.36, fontSize: 11.5, bold: true, color: P.cyan, fontFace: "Arial Black", margin: 0 });

    s.addShape("rect", { x: 6.1, y: 1.54, w: 2.85, h: 3.6, fill: { color: "050C15" }, line: { color: P.cyan, width: 1 } });
    s.addImage({ data: livenessImg, x: 6.15, y: 1.58, w: 2.75, h: 3.52, sizing: { type: "contain", w: 2.75, h: 3.52 } });

    const rightNotes = ["Dashed face oval guide", "Turn head left task", "Blink twice task", "Anti-spoof checking"];
    rightNotes.forEach((n, i) => {
      s.addText(`• ${n}`, { x: 9.2, y: 1.62 + i * 0.82, w: 0.72, h: 0.38, fontSize: 7.5, color: P.offwh, fontFace: "Calibri", margin: 0 });
    });
  }

  // ══════════════════════════════
  // SLIDE 7 — PERFORMANCE
  // ══════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: P.bgMid };
    s.addShape("rect", { x: 0, y: 0, w: 10, h: 0.95, fill: { color: P.bg }, line: { color: P.bg } });
    s.addShape("rect", { x: 0.35, y: 0.2, w: 0.07, h: 0.6, fill: { color: P.gold }, line: { color: P.gold } });
    s.addText("Performance Metrics", { x: 0.52, y: 0.18, w: 8, h: 0.4, fontSize: 24, bold: true, color: P.white, fontFace: "Arial Black", margin: 0 });
    s.addText("Optimized for edge — fast, tiny, accurate", { x: 0.52, y: 0.58, w: 8, h: 0.28, fontSize: 11, color: P.gold, fontFace: "Calibri", margin: 0 });

    const metrics = [
      { val: "< 1s",  label: "Inference Speed",  sub: "per auth",          c: P.green,  icon: icons.bolt },
      { val: "~8MB",  label: "Total Model Size",  sub: "vs 50MB+ rivals",  c: P.cyan,   icon: icons.brain },
      { val: "100%",  label: "Offline Coverage",  sub: "no net needed",    c: P.purple, icon: icons.mobile },
      { val: "API 26", label: "Android Support",  sub: "Android 8.0+",     c: P.gold,   icon: icons.android },
    ];

    metrics.forEach((m, i) => {
      const x = 0.32 + i * 2.38;
      cardShape(s, x, 1.08, 2.22, 2.1, m.c, true);
      s.addImage({ data: m.icon, x: x + 0.84, y: 1.2, w: 0.52, h: 0.52 });
      s.addText(m.val,   { x, y: 1.75, w: 2.22, h: 0.65, fontSize: 32, bold: true, color: m.c, align: "center", fontFace: "Arial Black", margin: 0 });
      s.addText(m.label, { x, y: 2.4,  w: 2.22, h: 0.35, fontSize: 11, bold: true, color: P.white, align: "center", fontFace: "Calibri", margin: 0 });
      s.addText(m.sub,   { x, y: 2.75, w: 2.22, h: 0.3,  fontSize: 9,  color: P.muted, align: "center", fontFace: "Calibri", margin: 0 });
    });

    // Bar chart
    s.addChart("bar", [{
      name: "Model Size (MB)",
      labels: ["DataLake\nFaceAuth", "FaceNet\nStandard", "AWS\nRekognition", "Azure\nFace API"],
      values: [8, 25, 55, 70]
    }], {
      x: 0.32, y: 3.28, w: 6.2, h: 2.1,
      barDir: "col",
      chartColors: [P.green, "2A4060", "2A4060", "2A4060"],
      chartArea: { fill: { color: P.card }, roundedCorners: false },
      catAxisLabelColor: P.offwh, valAxisLabelColor: P.offwh,
      valGridLine: { color: "1A3050", size: 0.5 }, catGridLine: { style: "none" },
      showValue: true, dataLabelColor: P.white,
      showLegend: false, showTitle: true,
      title: "Model Size Comparison (MB) — smaller is better",
      titleColor: P.offwh, titleFontSize: 10,
    });

    // Accuracy panel
    cardShape(s, 6.72, 3.28, 2.96, 2.1, P.cyan);
    s.addText("Accuracy", { x: 6.72, y: 3.33, w: 2.96, h: 0.38, fontSize: 13, bold: true, color: P.cyan, align: "center", fontFace: "Arial Black" });
    const rows2 = [["Metric","Result"],["Face Match","✅ High"],["Liveness","✅ Good"],["False+ Rate","< 2%"],["Spoof Block","✅ Active"]];
    rows2.forEach((row, ri) => {
      row.forEach((cell, ci) => {
        s.addShape("rect", { x: 6.76 + ci * 1.44, y: 3.75 + ri * 0.3, w: 1.42, h: 0.27,
          fill: { color: ri === 0 ? P.cyan : (ri%2===0 ? "0A1828" : P.card) },
          line: { color: "1A3050" }
        });
        s.addText(cell, { x: 6.76 + ci * 1.44, y: 3.75 + ri * 0.3, w: 1.42, h: 0.27,
          fontSize: 9, bold: ri === 0, color: ri === 0 ? P.bg : P.offwh,
          align: "center", valign: "middle", fontFace: "Calibri"
        });
      });
    });
  }

  // ══════════════════════════════
  // SLIDE 8 — DATA FLOW
  // ══════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: P.bgMid };
    s.addShape("rect", { x: 0, y: 0, w: 10, h: 0.95, fill: { color: P.bg }, line: { color: P.bg } });
    s.addShape("rect", { x: 0.35, y: 0.2, w: 0.07, h: 0.6, fill: { color: P.green }, line: { color: P.green } });
    s.addText("Offline → Cloud Data Flow", { x: 0.52, y: 0.18, w: 8, h: 0.4, fontSize: 24, bold: true, color: P.white, fontFace: "Arial Black", margin: 0 });
    s.addText("Smart sync engine with auto-cleanup — zero data loss guaranteed", { x: 0.52, y: 0.58, w: 8, h: 0.28, fontSize: 11, color: P.green, fontFace: "Calibri", margin: 0 });

    const flow = [
      { icon: icons.user,   label: "User",       sub: "Requests\nauth",         c: P.cyan },
      { icon: icons.camera, label: "Camera",     sub: "Capture\nframe",         c: P.green },
      { icon: icons.eye,    label: "Liveness",   sub: "Blink /\nSmile / Turn",  c: P.purple },
      { icon: icons.brain,  label: "AI Model",   sub: "Face\nmatching",         c: P.gold },
      { icon: icons.db,     label: "SQLite",     sub: "Save log\noffline",      c: P.cyan },
      { icon: icons.bolt,   label: "Net Check",  sub: "Online\nor offline?",    c: P.gold },
      { icon: icons.cloud,  label: "DynamoDB",   sub: "Batch\nupload 25",       c: P.green },
      { icon: icons.trash,  label: "Purge",      sub: "7-day\ncleanup",         c: P.red },
    ];

    const bw = 1.04, bh = 1.32, sy = 1.1;
    flow.forEach((f, i) => {
      const x = 0.32 + i * 1.18;
      cardShape(s, x, sy, bw, bh, f.c);
      s.addShape("oval", { x: x + 0.23, y: sy + 0.1, w: 0.56, h: 0.56, fill: { color: f.c, transparency: 80 }, line: { color: f.c, width: 1 } });
      s.addImage({ data: f.icon, x: x + 0.27, y: sy + 0.14, w: 0.48, h: 0.48 });
      s.addText(f.label, { x, y: sy + 0.68, w: bw, h: 0.3, fontSize: 8, bold: true, color: P.white, align: "center", fontFace: "Arial Black", margin: 0 });
      s.addText(f.sub,   { x, y: sy + 0.97, w: bw, h: 0.32, fontSize: 7.5, color: f.c, align: "center", fontFace: "Calibri", margin: 0 });
      if (i < flow.length - 1) {
        s.addText("→", { x: x + bw - 0.02, y: sy + 0.52, w: 0.22, h: 0.28, fontSize: 13, color: P.cyan, align: "center", bold: true, margin: 0 });
      }
    });

    // Offline branch
    cardShape(s, 2.8, 2.55, 4.4, 0.5, P.gold);
    s.addText("⚡  If OFFLINE → stays in SQLite until connectivity returns", { x: 2.8, y: 2.55, w: 4.4, h: 0.5, fontSize: 10, bold: true, color: P.gold, align: "center", valign: "middle", fontFace: "Calibri" });

    // 3 guarantees
    const guarantees = [
      { e: "🔒", t: "Zero data loss\nSQLite persists all events" },
      { e: "⚡", t: "Batch efficiency\n25 records per DynamoDB req" },
      { e: "🧹", t: "Auto-cleanup\nSynced records purged ×7 days" },
    ];
    guarantees.forEach((g, i) => {
      cardShape(s, 0.32 + i * 3.22, 3.2, 3.06, 0.85, P.cyan);
      s.addText(g.e, { x: 0.42 + i * 3.22, y: 3.26, w: 0.6, h: 0.6, fontSize: 24, align: "center" });
      s.addText(g.t, { x: 1.06 + i * 3.22, y: 3.26, w: 2.4, h: 0.72, fontSize: 10, color: P.offwh, fontFace: "Calibri", valign: "middle", margin: 0 });
    });

    // Code line
    cardShape(s, 0.32, 4.22, 9.36, 0.7, P.cyan);
    s.addText([
      { text: "syncService", options: { color: P.cyan, bold: true } },
      { text: ".checkNetwork()  →  online: ", options: { color: P.offwh } },
      { text: "batchUpload(25)", options: { color: P.green, bold: true } },
      { text: "  →  ", options: { color: P.offwh } },
      { text: "markSynced()", options: { color: P.gold, bold: true } },
      { text: "  →  7 days: ", options: { color: P.offwh } },
      { text: "autoPurge()", options: { color: P.red, bold: true } },
    ], { x: 0.52, y: 4.28, w: 9.0, h: 0.58, fontSize: 12, fontFace: "Consolas", valign: "middle" });
  }

  // ══════════════════════════════
  // SLIDE 9 — DELIVERABLES
  // ══════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: P.bgMid };
    s.addShape("rect", { x: 0, y: 0, w: 10, h: 0.95, fill: { color: P.bg }, line: { color: P.bg } });
    s.addShape("rect", { x: 0.35, y: 0.2, w: 0.07, h: 0.6, fill: { color: P.green }, line: { color: P.green } });
    s.addText("Deliverables", { x: 0.52, y: 0.18, w: 8, h: 0.4, fontSize: 24, bold: true, color: P.white, fontFace: "Arial Black", margin: 0 });
    s.addText("What we built and shipped", { x: 0.52, y: 0.58, w: 8, h: 0.28, fontSize: 11, color: P.green, fontFace: "Calibri", margin: 0 });

    const items = [
      { e: "📱", label: "Android APK",           status: "DONE",    c: P.green,  detail: "Tested on Android 8.0+ devices" },
      { e: "👤", label: "Face Recognition",       status: "DONE",    c: P.green,  detail: "MobileFaceNet + cosine similarity" },
      { e: "👁",  label: "Liveness Detection",    status: "DONE",    c: P.green,  detail: "Blink, smile & head movement" },
      { e: "💾", label: "Offline SQLite Storage", status: "DONE",    c: P.green,  detail: "Local persistence, zero data loss" },
      { e: "☁️", label: "AWS DynamoDB Sync",      status: "PARTIAL", c: P.gold,   detail: "Core working, polling WIP" },
      { e: "🛡️", label: "Anti-Spoof AI",          status: "DONE",    c: P.green,  detail: "MobileNetV3 INT8 integrated" },
      { e: "📊", label: "Presentation",            status: "DONE",    c: P.green,  detail: "This winning hackathon deck" },
      { e: "📝", label: "Project Report",          status: "DONE",    c: P.green,  detail: "Full system documentation" },
    ];

    items.forEach((item, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const x = 0.32 + col * 4.9, y = 1.08 + row * 1.06;
      cardShape(s, x, y, 4.72, 0.92, item.c);
      s.addShape("rect", { x, y, w: 0.08, h: 0.92, fill: { color: item.c }, line: { color: item.c } });
      s.addText(item.e, { x: x + 0.1, y: y + 0.12, w: 0.58, h: 0.58, fontSize: 25, align: "center" });
      s.addShape("rect", { x: x + 3.62, y: y + 0.22, w: 0.98, h: 0.36,
        fill: { color: item.c, transparency: 15 }, line: { color: item.c }
      });
      s.addText(item.status, { x: x + 3.62, y: y + 0.22, w: 0.98, h: 0.36, fontSize: 8.5, bold: true, color: P.bg, align: "center", valign: "middle", fontFace: "Arial Black" });
      s.addText(item.label,  { x: x + 0.74, y: y + 0.1,  w: 2.8, h: 0.38, fontSize: 13, bold: true, color: P.white, fontFace: "Arial Black", margin: 0 });
      s.addText(item.detail, { x: x + 0.74, y: y + 0.5,  w: 2.8, h: 0.34, fontSize: 10, color: P.offwh, fontFace: "Calibri", margin: 0 });
    });

    // Completion bar
    s.addShape("rect", { x: 0.32, y: 5.18, w: 9.36, h: 0.3, fill: { color: P.card }, line: { color: P.green, transparency: 40 } });
    s.addShape("rect", { x: 0.32, y: 5.18, w: 8.19, h: 0.3, fill: { color: P.green }, line: { color: P.green } });
    s.addText("Overall Completion: 87.5%  🏆", { x: 0.32, y: 5.18, w: 9.36, h: 0.3, fontSize: 11, bold: true, color: P.bg, align: "center", valign: "middle", fontFace: "Arial Black" });
  }

  // ══════════════════════════════
  // SLIDE 10 — USE CASES
  // ══════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: P.bgMid };
    s.addShape("rect", { x: 0, y: 0, w: 10, h: 0.95, fill: { color: P.bg }, line: { color: P.bg } });
    s.addShape("rect", { x: 0.35, y: 0.2, w: 0.07, h: 0.6, fill: { color: P.cyan }, line: { color: P.cyan } });
    s.addText("Real-World Impact", { x: 0.52, y: 0.18, w: 8, h: 0.4, fontSize: 24, bold: true, color: P.white, fontFace: "Arial Black", margin: 0 });
    s.addText("Where DataLake FaceAuth transforms operations", { x: 0.52, y: 0.58, w: 8, h: 0.28, fontSize: 11, color: P.cyan, fontFace: "Calibri", margin: 0 });

    const cases = [
      { icon: icons.factory, c: P.cyan,   title: "Factory Attendance",    desc: "Replace punch cards with instant biometric clock-in on offline factory floors", stat: "5,000+ workers" },
      { icon: icons.leaf,    c: P.green,  title: "Rural Field Workers",   desc: "Verify field staff identity in remote zones — zero connectivity required",       stat: "Zero internet" },
      { icon: icons.shield,  c: P.purple, title: "Security Checkpoints",  desc: "Fast, spoof-proof guard authentication at high-security facilities",              stat: "< 1 sec auth" },
      { icon: icons.plane,   c: P.gold,   title: "Airport ID Verification",desc: "Portable biometric verification for airports and border checkpoints",             stat: "Any location" },
    ];

    const pos = [[0.32, 1.08], [5.18, 1.08], [0.32, 3.0], [5.18, 3.0]];
    cases.forEach((c, i) => {
      const [x, y] = pos[i];
      cardShape(s, x, y, 4.7, 1.78, c.c, true);
      s.addImage({ data: c.icon, x: x + 0.18, y: y + 0.4, w: 0.62, h: 0.62 });
      s.addText(c.title, { x: x + 0.92, y: y + 0.12, w: 3.65, h: 0.42, fontSize: 15, bold: true, color: P.white, fontFace: "Arial Black", margin: 0 });
      s.addShape("rect", { x: x + 0.92, y: y + 0.55, w: 2.0, h: 0.28, fill: { color: c.c, transparency: 18 }, line: { color: c.c } });
      s.addText(c.stat, { x: x + 0.92, y: y + 0.55, w: 2.0, h: 0.28, fontSize: 9, bold: true, color: c.c, align: "center", valign: "middle" });
      s.addText(c.desc, { x: x + 0.92, y: y + 0.9, w: 3.65, h: 0.75, fontSize: 10, color: P.offwh, fontFace: "Calibri", margin: 0 });
    });

    // Market footer
    cardShape(s, 0.32, 5.05, 9.36, 0.42, P.cyan);
    s.addText("🌍  Global Biometrics Market: $68.6B by 2028  |  Edge AI Security growing at 22% CAGR", { x: 0.32, y: 5.05, w: 9.36, h: 0.42, fontSize: 11, bold: true, color: P.cyan, align: "center", valign: "middle", fontFace: "Calibri" });
  }

  // ══════════════════════════════
  // SLIDE 11 — CONCLUSION
  // ══════════════════════════════
  {
    const s = pres.addSlide();
    s.background = { color: P.bg };

    s.addShape("oval", { x: -1.2, y: -1.2, w: 5, h: 5, fill: { color: P.purple, transparency: 85 }, line: { color: "000000", transparency: 100 } });
    s.addShape("oval", { x: 7.2, y: 2.2, w: 4.5, h: 4.5, fill: { color: P.cyan, transparency: 88 }, line: { color: "000000", transparency: 100 } });
    for (let i = 0; i < 8; i++) {
      s.addShape("line", { x: 0, y: 0.2 + i * 0.7, w: 10, h: 0, line: { color: P.cyan, width: 0.3, transparency: 92 } });
    }

    // Central shield
    s.addShape("oval", { x: 4.1, y: 0.22, w: 1.8, h: 1.8, fill: { color: P.cyan, transparency: 12 }, line: { color: P.cyan, width: 2 } });
    s.addImage({ data: icons.shieldW, x: 4.36, y: 0.38, w: 1.28, h: 1.28 });

    s.addText("Secure. Offline. Intelligent.", { x: 0.3, y: 2.1, w: 9.4, h: 0.82, fontSize: 46, bold: true, color: P.white, align: "center", fontFace: "Arial Black", margin: 0 });
    s.addText("DataLake FaceAuth — Built for the Real World", { x: 0.3, y: 2.95, w: 9.4, h: 0.45, fontSize: 18, color: P.cyan, align: "center", fontFace: "Calibri", margin: 0 });

    const pillars = [
      { icon: icons.mobile,  c: P.cyan,   title: "100% Offline",  desc: "No internet needed" },
      { icon: icons.brain,   c: P.purple, title: "Edge AI",       desc: "~8MB on-device" },
      { icon: icons.globe,   c: P.green,  title: "Scalable",      desc: "Any environment" },
    ];
    pillars.forEach((p, i) => {
      const x = 1.1 + i * 2.7;
      cardShape(s, x, 3.55, 2.5, 1.35, p.c, true);
      s.addImage({ data: p.icon, x: x + 0.97, y: 3.65, w: 0.55, h: 0.55 });
      s.addText(p.title, { x, y: 4.24, w: 2.5, h: 0.36, fontSize: 15, bold: true, color: p.c, align: "center", fontFace: "Arial Black", margin: 0 });
      s.addText(p.desc,  { x, y: 4.6,  w: 2.5, h: 0.25, fontSize: 10, color: P.offwh, align: "center", fontFace: "Calibri", margin: 0 });
    });

    s.addText('"All face detection, liveness, anti-spoof, and recognition runs entirely on-device — zero internet, zero compromise."', {
      x: 0.5, y: 5.06, w: 9, h: 0.38, fontSize: 9.5, color: P.muted, align: "center", italic: true, fontFace: "Calibri"
    });
  }

  await pres.writeFile({ fileName: "/mnt/user-data/outputs/DataLake_FaceAuth_Hackathon7.pptx" });
  console.log("✅ PPTX done!");
}

main().catch(e => { console.error(e); process.exit(1); });