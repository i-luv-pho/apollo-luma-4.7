import PptxGenJS from "pptxgenjs"

const pptx = new PptxGenJS()
pptx.layout = "LAYOUT_16x9"
pptx.title = "Yves Saint Laurent: The Man Who Dressed Women in Power"
pptx.author = "Apollo"

// Colors - elegant cream/black theme
const bg = "0a0a0a"
const white = "ffffff"
const cream = "f5f0e8"
const gold = "c9a962"
const gray = "888888"
const darkGray = "555555"

// Slide 1: Title with YSL portrait
const slide1 = pptx.addSlide()
slide1.background = { color: bg }
// Add YSL photo (using Wikimedia Commons public domain image)
slide1.addImage({
  path: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Yves_Saint-Laurent_1958.jpg/440px-Yves_Saint-Laurent_1958.jpg",
  x: 0.5,
  y: 1.0,
  w: 3.5,
  h: 4.2,
})
slide1.addText("Yves Saint Laurent", {
  x: 4.5,
  y: 1.5,
  w: 5,
  h: 1,
  fontSize: 44,
  fontFace: "Georgia",
  color: white,
  bold: true,
})
slide1.addText("The Man Who Dressed\nWomen in Power", {
  x: 4.5,
  y: 2.6,
  w: 5,
  h: 1,
  fontSize: 24,
  fontFace: "Arial",
  color: gold,
})
slide1.addText("1936 – 2008", {
  x: 4.5,
  y: 3.8,
  w: 5,
  h: 0.5,
  fontSize: 18,
  fontFace: "Arial",
  color: gray,
})

// Slide 2: The Visionary - Stats
const slide2 = pptx.addSlide()
slide2.background = { color: bg }
slide2.addText("THE VISIONARY", {
  x: 0.5,
  y: 0.5,
  w: 9,
  h: 0.3,
  fontSize: 11,
  fontFace: "Arial",
  color: gold,
  bold: true,
})
slide2.addText("First designer to make fashion democratic", {
  x: 0.5,
  y: 0.9,
  w: 9,
  h: 0.8,
  fontSize: 32,
  fontFace: "Georgia",
  color: white,
  bold: true,
})
// Stats grid
const stats = [
  { num: "21", label: "Age when he became Dior's head designer" },
  { num: "1961", label: "Founded his own fashion house" },
  { num: "60+", label: "Years of influence on fashion" },
  { num: "$3B+", label: "Annual brand revenue today" },
]
stats.forEach((stat, i) => {
  const col = i % 2
  const row = Math.floor(i / 2)
  const x = 0.5 + col * 4.5
  const y = 2.2 + row * 1.5
  slide2.addText(stat.num, { x, y, w: 4, h: 0.7, fontSize: 42, fontFace: "Georgia", color: gold, bold: true })
  slide2.addText(stat.label, { x, y: y + 0.65, w: 4, h: 0.4, fontSize: 13, fontFace: "Arial", color: gray })
})
slide2.addText("Sources: Britannica, Kering Annual Report 2024", {
  x: 0.5,
  y: 4.8,
  w: 9,
  h: 0.3,
  fontSize: 10,
  fontFace: "Arial",
  color: darkGray,
})

// Slide 3: Le Smoking - The Revolution
const slide3 = pptx.addSlide()
slide3.background = { color: bg }
// Add Le Smoking image
slide3.addImage({
  path: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Le_Smoking_at_deYoung_Museum_San_Francisco.jpg/440px-Le_Smoking_at_deYoung_Museum_San_Francisco.jpg",
  x: 5.5,
  y: 0.8,
  w: 4,
  h: 4.2,
})
slide3.addText("LE SMOKING", {
  x: 0.5,
  y: 0.5,
  w: 5,
  h: 0.3,
  fontSize: 11,
  fontFace: "Arial",
  color: gold,
  bold: true,
})
slide3.addText("The suit that changed everything", {
  x: 0.5,
  y: 0.9,
  w: 5,
  h: 0.8,
  fontSize: 28,
  fontFace: "Georgia",
  color: white,
  bold: true,
})
slide3.addText(
  "In 1966, YSL unveiled the women's tuxedo. Restaurants refused entry. Society was scandalized. History was made.",
  {
    x: 0.5,
    y: 1.8,
    w: 4.8,
    h: 1,
    fontSize: 16,
    fontFace: "Arial",
    color: gray,
    italic: true,
  },
)
const bullets3 = [
  "First tuxedo designed for women",
  "Challenged gender norms in fashion",
  "Gave women the uniform of power",
  "Still in production 60 years later",
]
bullets3.forEach((text, i) => {
  slide3.addText(text, {
    x: 0.5,
    y: 2.9 + i * 0.45,
    w: 4.8,
    h: 0.4,
    fontSize: 14,
    fontFace: "Arial",
    color: white,
    bullet: true,
  })
})
slide3.addText("Source: Musée Yves Saint Laurent Paris", {
  x: 0.5,
  y: 4.8,
  w: 9,
  h: 0.3,
  fontSize: 10,
  fontFace: "Arial",
  color: darkGray,
})

// Slide 4: The Mondrian Collection
const slide4 = pptx.addSlide()
slide4.background = { color: bg }
// Add Mondrian dress image
slide4.addImage({
  path: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Yves_St_Laurent_Mondrian_dress.jpg/440px-Yves_St_Laurent_Mondrian_dress.jpg",
  x: 0.3,
  y: 0.8,
  w: 3.5,
  h: 4.2,
})
slide4.addText("ART MEETS FASHION", {
  x: 4.2,
  y: 0.5,
  w: 5.5,
  h: 0.3,
  fontSize: 11,
  fontFace: "Arial",
  color: gold,
  bold: true,
})
slide4.addText("The Mondrian Collection, 1965", {
  x: 4.2,
  y: 0.9,
  w: 5.5,
  h: 0.8,
  fontSize: 28,
  fontFace: "Georgia",
  color: white,
  bold: true,
})
slide4.addText(
  "YSL transformed Piet Mondrian's geometric paintings into wearable art, proving fashion could be a canvas.",
  {
    x: 4.2,
    y: 1.8,
    w: 5.3,
    h: 0.8,
    fontSize: 15,
    fontFace: "Arial",
    color: gray,
    italic: true,
  },
)
const bullets4 = [
  "Six iconic shift dresses",
  "Inspired by De Stijl movement",
  "Blurred line between art & fashion",
  "Now in museum collections worldwide",
]
bullets4.forEach((text, i) => {
  slide4.addText(text, {
    x: 4.2,
    y: 2.7 + i * 0.45,
    w: 5.3,
    h: 0.4,
    fontSize: 14,
    fontFace: "Arial",
    color: white,
    bullet: true,
  })
})
slide4.addText("Source: V&A Museum, Wikipedia", {
  x: 0.5,
  y: 4.8,
  w: 9,
  h: 0.3,
  fontSize: 10,
  fontFace: "Arial",
  color: darkGray,
})

// Slide 5: Timeline of Innovation
const slide5 = pptx.addSlide()
slide5.background = { color: bg }
slide5.addText("A LIFE OF FIRSTS", {
  x: 0.5,
  y: 0.5,
  w: 9,
  h: 0.3,
  fontSize: 11,
  fontFace: "Arial",
  color: gold,
  bold: true,
})
slide5.addText("Revolutionary moments in fashion history", {
  x: 0.5,
  y: 0.9,
  w: 9,
  h: 0.8,
  fontSize: 28,
  fontFace: "Georgia",
  color: white,
  bold: true,
})
const timeline = [
  { year: "1957", event: "Named head of Christian Dior at age 21" },
  { year: "1961", event: "Founded Yves Saint Laurent with Pierre Bergé" },
  { year: "1965", event: "Mondrian Collection merges art and fashion" },
  { year: "1966", event: "Le Smoking tuxedo revolutionizes womenswear" },
  { year: "1966", event: "Opens Rive Gauche — first luxury ready-to-wear" },
  { year: "2002", event: "Retires after 40+ years of haute couture" },
]
timeline.forEach((item, i) => {
  slide5.addText(item.year, {
    x: 0.5,
    y: 1.85 + i * 0.48,
    w: 1.2,
    h: 0.4,
    fontSize: 16,
    fontFace: "Georgia",
    color: gold,
    bold: true,
  })
  slide5.addText(item.event, {
    x: 1.8,
    y: 1.85 + i * 0.48,
    w: 7.5,
    h: 0.4,
    fontSize: 15,
    fontFace: "Arial",
    color: white,
  })
})
slide5.addText("Sources: Britannica, Musée YSL Paris, GOAT", {
  x: 0.5,
  y: 4.8,
  w: 9,
  h: 0.3,
  fontSize: 10,
  fontFace: "Arial",
  color: darkGray,
})

// Slide 6: The Business Empire
const slide6 = pptx.addSlide()
slide6.background = { color: bg }
slide6.addText("THE EMPIRE TODAY", {
  x: 0.5,
  y: 0.5,
  w: 9,
  h: 0.3,
  fontSize: 11,
  fontFace: "Arial",
  color: gold,
  bold: true,
})
slide6.addText("A €3B+ luxury powerhouse under Kering", {
  x: 0.5,
  y: 0.9,
  w: 9,
  h: 0.8,
  fontSize: 28,
  fontFace: "Georgia",
  color: white,
  bold: true,
})
const bullets6 = [
  "Acquired by Kering (then PPR) in 1999",
  "Renamed 'Saint Laurent' in 2012 under Hedi Slimane",
  "Ready-to-wear, handbags, shoes, beauty, eyewear",
  "Flagship stores in Paris, NYC, Tokyo, London",
  "Creative Director: Anthony Vaccarello (since 2016)",
]
bullets6.forEach((text, i) => {
  slide6.addText(text, {
    x: 0.5,
    y: 1.9 + i * 0.5,
    w: 9,
    h: 0.5,
    fontSize: 16,
    fontFace: "Arial",
    color: white,
    bullet: true,
  })
})
slide6.addText('"Fashion fades, style is eternal." — Yves Saint Laurent', {
  x: 0.7,
  y: 4.0,
  w: 8.5,
  h: 0.5,
  fontSize: 18,
  fontFace: "Georgia",
  color: gold,
  italic: true,
})
slide6.addText("Sources: Kering 2024 Annual Report, Fashion Dive", {
  x: 0.5,
  y: 4.8,
  w: 9,
  h: 0.3,
  fontSize: 10,
  fontFace: "Arial",
  color: darkGray,
})

// Slide 7: Legacy
const slide7 = pptx.addSlide()
slide7.background = { color: bg }
slide7.addText("THE LEGACY", {
  x: 0.5,
  y: 1.0,
  w: 9,
  h: 0.3,
  fontSize: 11,
  fontFace: "Arial",
  color: gold,
  bold: true,
  align: "center",
})
slide7.addText("He didn't just dress women.\nHe empowered them.", {
  x: 0.5,
  y: 1.6,
  w: 9,
  h: 1.2,
  fontSize: 36,
  fontFace: "Georgia",
  color: white,
  bold: true,
  align: "center",
})
slide7.addText(
  "From pioneering ready-to-wear to shattering gender norms,\nYves Saint Laurent gave women the wardrobe of independence.\nHis vision lives on in every power suit, every tuxedo jacket,\nevery woman who dresses for herself.",
  {
    x: 0.8,
    y: 3.0,
    w: 8.5,
    h: 1.2,
    fontSize: 16,
    fontFace: "Arial",
    color: gray,
    align: "center",
  },
)
slide7.addText("Musée Yves Saint Laurent: Paris & Marrakech", {
  x: 0.5,
  y: 4.4,
  w: 9,
  h: 0.3,
  fontSize: 14,
  fontFace: "Arial",
  color: gold,
  align: "center",
})
slide7.addText("Sources: Britannica, Medium, EBSCO Research", {
  x: 0.5,
  y: 4.8,
  w: 9,
  h: 0.3,
  fontSize: 10,
  fontFace: "Arial",
  color: darkGray,
  align: "center",
})

// Save
const outputPath = "/Users/mac/Desktop/apollov2/packages/apollo/yves-saint-laurent.pptx"
await pptx.writeFile({ fileName: outputPath })
console.log("PPTX saved to:", outputPath)
