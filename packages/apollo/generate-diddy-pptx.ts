import PptxGenJS from "pptxgenjs"

const pptx = new PptxGenJS()
pptx.layout = "LAYOUT_16x9"
pptx.title = "The Rise and Fall of Sean Diddy Combs"
pptx.author = "Apollo"

// Colors
const bg = "1a1a1a"
const white = "ffffff"
const gray = "888888"
const darkGray = "666666"

// Slide 1: Title
const slide1 = pptx.addSlide()
slide1.background = { color: bg }
slide1.addText("The Rise and Fall of Diddy", {
  x: 0.5,
  y: 2.5,
  w: 9,
  h: 1,
  fontSize: 44,
  fontFace: "Georgia",
  color: white,
  bold: true,
  align: "center",
})
slide1.addText("From $1 Billion Empire to 50 Months Behind Bars", {
  x: 0.5,
  y: 3.6,
  w: 9,
  h: 0.5,
  fontSize: 20,
  fontFace: "Arial",
  color: gray,
  align: "center",
})

// Slide 2: The Rise - Stats
const slide2 = pptx.addSlide()
slide2.background = { color: bg }
slide2.addText("THE RISE", {
  x: 0.5,
  y: 0.5,
  w: 9,
  h: 0.3,
  fontSize: 11,
  fontFace: "Arial",
  color: darkGray,
  bold: true,
})
slide2.addText("$1B+ built on music, fashion, and vodka", {
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
  { num: "1993", label: "Bad Boy Records Founded" },
  { num: "3", label: "Grammy Awards Won" },
  { num: "$400M", label: "Annual Ciroc Revenue" },
  { num: "14", label: "Grammy Nominations" },
]
stats.forEach((stat, i) => {
  const col = i % 2
  const row = Math.floor(i / 2)
  const x = 0.5 + col * 4.5
  const y = 2.2 + row * 1.5
  slide2.addText(stat.num, { x, y, w: 4, h: 0.7, fontSize: 36, fontFace: "Georgia", color: white, bold: true })
  slide2.addText(stat.label, { x, y: y + 0.6, w: 4, h: 0.4, fontSize: 12, fontFace: "Arial", color: gray })
})
slide2.addText("Sources: Forbes, Billboard, Business Insider", {
  x: 0.5,
  y: 4.8,
  w: 9,
  h: 0.3,
  fontSize: 10,
  fontFace: "Arial",
  color: darkGray,
})

// Slide 3: Bad Boy Records
const slide3 = pptx.addSlide()
slide3.background = { color: bg }
slide3.addText("BAD BOY RECORDS", {
  x: 0.5,
  y: 0.5,
  w: 9,
  h: 0.3,
  fontSize: 11,
  fontFace: "Arial",
  color: darkGray,
  bold: true,
})
slide3.addText("Hip-hop's most influential label of the '90s", {
  x: 0.5,
  y: 0.9,
  w: 9,
  h: 0.8,
  fontSize: 32,
  fontFace: "Georgia",
  color: white,
  bold: true,
})
const bullets3 = [
  "Launched The Notorious B.I.G. to legend status",
  "Signed Mase, Faith Evans, The Lox, 112",
  "Multiple platinum albums in first 5 years",
  "2023: Returned publishing rights to all artists",
]
bullets3.forEach((text, i) => {
  slide3.addText(text, {
    x: 0.5,
    y: 2.0 + i * 0.55,
    w: 9,
    h: 0.5,
    fontSize: 18,
    fontFace: "Arial",
    color: white,
    bullet: true,
  })
})
slide3.addText("Source: Rolling Stone, AP News", {
  x: 0.5,
  y: 4.8,
  w: 9,
  h: 0.3,
  fontSize: 10,
  fontFace: "Arial",
  color: darkGray,
})

// Slide 4: Business Empire
const slide4 = pptx.addSlide()
slide4.background = { color: bg }
slide4.addText("THE EMPIRE", {
  x: 0.5,
  y: 0.5,
  w: 9,
  h: 0.3,
  fontSize: 11,
  fontFace: "Arial",
  color: darkGray,
  bold: true,
})
slide4.addText("More than music: A billion-dollar brand", {
  x: 0.5,
  y: 0.9,
  w: 9,
  h: 0.8,
  fontSize: 32,
  fontFace: "Georgia",
  color: white,
  bold: true,
})
const bullets4 = [
  "Ciroc Vodka: Turned -$40M loss into $400M annual revenue",
  "Sean John: Fashion empire worth $450M at peak",
  "Revolt TV: Hip-hop media network founded 2013",
  "Real Estate: $60M+ in luxury properties",
  "DeLeon Tequila: Premium spirits partnership",
]
bullets4.forEach((text, i) => {
  slide4.addText(text, {
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
slide4.addText("Sources: Bloomberg, Business Insider, Forbes", {
  x: 0.5,
  y: 4.8,
  w: 9,
  h: 0.3,
  fontSize: 10,
  fontFace: "Arial",
  color: darkGray,
})

// Slide 5: The Fall Timeline
const slide5 = pptx.addSlide()
slide5.background = { color: bg }
slide5.addText("THE FALL", {
  x: 0.5,
  y: 0.5,
  w: 9,
  h: 0.3,
  fontSize: 11,
  fontFace: "Arial",
  color: darkGray,
  bold: true,
})
slide5.addText("From penthouse to prison in 24 months", {
  x: 0.5,
  y: 0.9,
  w: 9,
  h: 0.8,
  fontSize: 32,
  fontFace: "Georgia",
  color: white,
  bold: true,
})
const timeline = [
  { year: "Nov '23", event: "Ex-girlfriend Cassie files lawsuit alleging abuse" },
  { year: "Mar '24", event: "Federal agents raid homes in LA and Miami" },
  { year: "Sep '24", event: "Arrested in NYC on federal indictment" },
  { year: "May '25", event: "Federal trial begins in Manhattan" },
  { year: "Jul '25", event: "Verdict: Guilty on 2 of 5 counts" },
  { year: "Oct '25", event: "Sentenced to 50 months in federal prison" },
]
timeline.forEach((item, i) => {
  slide5.addText(item.year, {
    x: 0.5,
    y: 1.9 + i * 0.45,
    w: 1.2,
    h: 0.4,
    fontSize: 14,
    fontFace: "Georgia",
    color: white,
    bold: true,
  })
  slide5.addText(item.event, {
    x: 1.8,
    y: 1.9 + i * 0.45,
    w: 7.5,
    h: 0.4,
    fontSize: 14,
    fontFace: "Arial",
    color: gray,
  })
})
slide5.addText("Sources: AP News, NBC News, NPR, BBC", {
  x: 0.5,
  y: 4.8,
  w: 9,
  h: 0.3,
  fontSize: 10,
  fontFace: "Arial",
  color: darkGray,
})

// Slide 6: The Verdict
const slide6 = pptx.addSlide()
slide6.background = { color: bg }
slide6.addText("THE VERDICT", {
  x: 0.5,
  y: 0.5,
  w: 9,
  h: 0.3,
  fontSize: 11,
  fontFace: "Arial",
  color: darkGray,
  bold: true,
})
slide6.addText("Guilty: 2 counts of transportation for prostitution", {
  x: 0.5,
  y: 0.9,
  w: 9,
  h: 0.8,
  fontSize: 28,
  fontFace: "Georgia",
  color: white,
  bold: true,
})
const verdicts = [
  "Not Guilty: Racketeering conspiracy",
  "Not Guilty: Sex trafficking by force/fraud",
  "Guilty: 2 counts transporting for prostitution",
  "Sentence: 50 months prison + $500K fine",
]
verdicts.forEach((text, i) => {
  slide6.addText(text, {
    x: 0.5,
    y: 2.0 + i * 0.5,
    w: 9,
    h: 0.5,
    fontSize: 16,
    fontFace: "Arial",
    color: white,
    bullet: true,
  })
})
slide6.addText('"Prosecutors sought 11+ years. Defense wanted 14 months. Judge gave 4 years, 2 months."', {
  x: 0.7,
  y: 3.8,
  w: 8.5,
  h: 0.6,
  fontSize: 16,
  fontFace: "Georgia",
  color: gray,
  italic: true,
})
slide6.addText("Sources: U.S. District Court SDNY, CNN, NBC News (October 3, 2025)", {
  x: 0.5,
  y: 4.8,
  w: 9,
  h: 0.3,
  fontSize: 10,
  fontFace: "Arial",
  color: darkGray,
})

// Slide 7: The Aftermath
const slide7 = pptx.addSlide()
slide7.background = { color: bg }
slide7.addText("THE AFTERMATH", {
  x: 0.5,
  y: 1.2,
  w: 9,
  h: 0.3,
  fontSize: 11,
  fontFace: "Arial",
  color: darkGray,
  bold: true,
  align: "center",
})
slide7.addText("$1B to ~$400M", {
  x: 0.5,
  y: 1.8,
  w: 9,
  h: 1,
  fontSize: 54,
  fontFace: "Georgia",
  color: white,
  bold: true,
  align: "center",
})
slide7.addText(
  "Net worth collapsed. Ciroc deal ended. Private jet sold.\n100+ civil lawsuits pending. A cautionary tale of unchecked power.",
  {
    x: 1,
    y: 3.0,
    w: 8,
    h: 1,
    fontSize: 18,
    fontFace: "Arial",
    color: gray,
    align: "center",
  },
)
slide7.addText("Sean Combs, age 55, currently incarcerated at MDC Brooklyn", {
  x: 0.5,
  y: 4.2,
  w: 9,
  h: 0.4,
  fontSize: 12,
  fontFace: "Arial",
  color: darkGray,
  align: "center",
})
slide7.addText("Sources: Bloomberg, Business Insider, The Sun (2024-2025)", {
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
const outputPath = "/Users/mac/Desktop/apollov2/packages/apollo/rise-and-fall-of-diddy.pptx"
await pptx.writeFile({ fileName: outputPath })
console.log("PPTX saved to:", outputPath)
