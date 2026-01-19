import z from "zod"
import { Tool } from "./tool"
import { spawn, exec } from "child_process"
import { promisify } from "util"
import path from "path"
import fs from "fs/promises"
import DESCRIPTION from "./convert.txt"
import { Log } from "../util/log"
import { Instance } from "../project/instance"

const execAsync = promisify(exec)
const log = Log.create({ service: "convert-tool" })

/**
 * Supported conversion formats.
 */
type Format = "pdf" | "html" | "docx" | "pptx" | "xlsx" | "md" | "txt" | "png" | "jpg" | "webp" | "svg" | "csv" | "json" | "yaml" | "xml"

/**
 * Available conversion backends.
 */
interface Converters {
  libreoffice: boolean
  pandoc: boolean
  imagemagick: boolean
  poppler: boolean
  wkhtmltopdf: boolean
  puppeteer: boolean
}

/**
 * Cache for converter detection.
 */
let convertersCache: Converters | null = null

/**
 * Check which converters are available on the system.
 */
async function detectConverters(): Promise<Converters> {
  if (convertersCache) return convertersCache

  const which = async (cmd: string): Promise<boolean> => {
    try {
      await execAsync(`which ${cmd}`)
      return true
    } catch {
      return false
    }
  }

  const whichWin = async (cmd: string): Promise<boolean> => {
    try {
      await execAsync(`where ${cmd}`)
      return true
    } catch {
      return false
    }
  }

  const check = process.platform === "win32" ? whichWin : which

  convertersCache = {
    libreoffice: await check("soffice").catch(() => false),
    pandoc: await check("pandoc").catch(() => false),
    imagemagick: await check("convert").catch(() => false) || await check("magick").catch(() => false),
    poppler: await check("pdftoppm").catch(() => false),
    wkhtmltopdf: await check("wkhtmltopdf").catch(() => false),
    puppeteer: true, // Always available as fallback via built-in browser
  }

  log.info("Detected converters", convertersCache)
  return convertersCache
}

/**
 * Get file extension from format.
 */
function formatToExtension(format: Format): string {
  const map: Record<Format, string> = {
    pdf: "pdf",
    html: "html",
    docx: "docx",
    pptx: "pptx",
    xlsx: "xlsx",
    md: "md",
    txt: "txt",
    png: "png",
    jpg: "jpg",
    webp: "webp",
    svg: "svg",
    csv: "csv",
    json: "json",
    yaml: "yaml",
    xml: "xml",
  }
  return map[format]
}

/**
 * Detect format from file extension.
 */
function detectFormat(filepath: string): Format | null {
  const ext = path.extname(filepath).toLowerCase().slice(1)
  const formats: Format[] = ["pdf", "html", "docx", "pptx", "xlsx", "md", "txt", "png", "jpg", "webp", "svg", "csv", "json", "yaml", "xml"]
  if (formats.includes(ext as Format)) {
    return ext as Format
  }
  // Handle aliases
  const aliases: Record<string, Format> = {
    jpeg: "jpg",
    markdown: "md",
    text: "txt",
    htm: "html",
    yml: "yaml",
  }
  return aliases[ext] || null
}

/**
 * Run a shell command and return the result.
 */
async function runCommand(
  command: string,
  args: string[],
  options: { cwd?: string; timeout?: number } = {}
): Promise<{ success: boolean; output: string; error?: string }> {
  return new Promise((resolve) => {
    const proc = spawn(command, args, {
      cwd: options.cwd || Instance.directory,
      stdio: ["ignore", "pipe", "pipe"],
    })

    let stdout = ""
    let stderr = ""

    proc.stdout?.on("data", (data) => {
      stdout += data.toString()
    })

    proc.stderr?.on("data", (data) => {
      stderr += data.toString()
    })

    const timeout = setTimeout(() => {
      proc.kill("SIGTERM")
      resolve({ success: false, output: "", error: "Conversion timed out" })
    }, options.timeout || 60000)

    proc.on("close", (code) => {
      clearTimeout(timeout)
      if (code === 0) {
        resolve({ success: true, output: stdout })
      } else {
        resolve({ success: false, output: stdout, error: stderr || `Exit code: ${code}` })
      }
    })

    proc.on("error", (err) => {
      clearTimeout(timeout)
      resolve({ success: false, output: "", error: err.message })
    })
  })
}

/**
 * Convert using LibreOffice.
 */
async function convertWithLibreOffice(
  input: string,
  output: string,
  format: Format
): Promise<{ success: boolean; error?: string }> {
  const outputDir = path.dirname(output)
  const outputFormat = format === "pdf" ? "pdf" : format

  const result = await runCommand("soffice", [
    "--headless",
    "--convert-to",
    outputFormat,
    "--outdir",
    outputDir,
    input,
  ])

  if (!result.success) {
    return { success: false, error: result.error }
  }

  // LibreOffice creates file with same basename but new extension
  const baseName = path.basename(input, path.extname(input))
  const createdFile = path.join(outputDir, `${baseName}.${formatToExtension(format)}`)

  // Rename to desired output name if different
  if (createdFile !== output) {
    try {
      await fs.rename(createdFile, output)
    } catch (e) {
      // File might already be at the right location
    }
  }

  return { success: true }
}

/**
 * Convert using Pandoc.
 */
async function convertWithPandoc(
  input: string,
  output: string,
  format: Format
): Promise<{ success: boolean; error?: string }> {
  const args = [input, "-o", output]

  // Add format-specific options
  if (format === "pdf") {
    args.push("--pdf-engine=pdflatex")
  } else if (format === "pptx") {
    args.push("--reference-doc=/dev/null") // Use default template
  }

  const result = await runCommand("pandoc", args)
  return { success: result.success, error: result.error }
}

/**
 * Convert HTML to PDF using wkhtmltopdf or puppeteer.
 */
async function convertHtmlToPdf(
  input: string,
  output: string,
  options: { pageSize?: string; landscape?: boolean } = {}
): Promise<{ success: boolean; error?: string }> {
  const converters = await detectConverters()

  // Try wkhtmltopdf first
  if (converters.wkhtmltopdf) {
    const args = ["--enable-local-file-access"]
    if (options.pageSize) args.push("--page-size", options.pageSize)
    if (options.landscape) args.push("--orientation", "Landscape")
    args.push(input, output)

    const result = await runCommand("wkhtmltopdf", args)
    if (result.success) return { success: true }
  }

  // Fall back to puppeteer/playwright
  try {
    const { chromium } = await import("playwright").catch(() => ({ chromium: null }))
    if (!chromium) {
      return { success: false, error: "No PDF converter available. Install wkhtmltopdf or playwright." }
    }

    const browser = await chromium.launch({ headless: true })
    const page = await browser.newPage()

    // Load HTML file
    const fileUrl = input.startsWith("http") ? input : `file://${path.resolve(input)}`
    await page.goto(fileUrl, { waitUntil: "networkidle" })

    // Generate PDF
    await page.pdf({
      path: output,
      format: (options.pageSize as "A4" | "Letter") || "A4",
      landscape: options.landscape,
      printBackground: true,
    })

    await browser.close()
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) }
  }
}

/**
 * Convert images using ImageMagick or Sharp.
 */
async function convertImage(
  input: string,
  output: string,
  options: { quality?: number; width?: number; height?: number } = {}
): Promise<{ success: boolean; error?: string }> {
  const converters = await detectConverters()

  // Try ImageMagick first
  if (converters.imagemagick) {
    const args = [input]
    if (options.quality) args.push("-quality", String(options.quality))
    if (options.width && options.height) {
      args.push("-resize", `${options.width}x${options.height}`)
    } else if (options.width) {
      args.push("-resize", `${options.width}x`)
    } else if (options.height) {
      args.push("-resize", `x${options.height}`)
    }
    args.push(output)

    const cmd = process.platform === "win32" ? "magick" : "convert"
    const result = await runCommand(cmd, args)
    if (result.success) return { success: true }
  }

  // Fall back to Sharp
  try {
    const sharp = await import("sharp").catch(() => null)
    if (!sharp) {
      return { success: false, error: "No image converter available. Install imagemagick or sharp." }
    }

    let image = sharp.default(input)
    if (options.width || options.height) {
      image = image.resize(options.width, options.height)
    }

    const format = path.extname(output).slice(1).toLowerCase()
    if (format === "jpg" || format === "jpeg") {
      image = image.jpeg({ quality: options.quality || 80 })
    } else if (format === "png") {
      image = image.png()
    } else if (format === "webp") {
      image = image.webp({ quality: options.quality || 80 })
    }

    await image.toFile(output)
    return { success: true }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) }
  }
}

/**
 * Convert JSON/YAML/CSV data files.
 */
async function convertData(
  input: string,
  outputFormat: Format
): Promise<{ success: boolean; data?: string; error?: string }> {
  try {
    const content = await fs.readFile(input, "utf-8")
    const inputFormat = detectFormat(input)

    // Parse input
    let data: unknown
    if (inputFormat === "json") {
      data = JSON.parse(content)
    } else if (inputFormat === "yaml") {
      const yaml = await import("yaml").catch(() => null)
      if (!yaml) return { success: false, error: "YAML parsing not available" }
      data = yaml.parse(content)
    } else if (inputFormat === "csv") {
      // Simple CSV parsing
      const lines = content.trim().split("\n")
      const headers = lines[0].split(",").map((h) => h.trim())
      data = lines.slice(1).map((line) => {
        const values = line.split(",").map((v) => v.trim())
        return Object.fromEntries(headers.map((h, i) => [h, values[i]]))
      })
    } else {
      return { success: false, error: `Cannot parse ${inputFormat} format` }
    }

    // Convert to output format
    let output: string
    if (outputFormat === "json") {
      output = JSON.stringify(data, null, 2)
    } else if (outputFormat === "yaml") {
      const yaml = await import("yaml").catch(() => null)
      if (!yaml) return { success: false, error: "YAML conversion not available" }
      output = yaml.stringify(data)
    } else if (outputFormat === "csv") {
      if (!Array.isArray(data)) {
        return { success: false, error: "Data must be an array for CSV conversion" }
      }
      const headers = Object.keys(data[0] as object)
      const rows = (data as Record<string, unknown>[]).map((row) =>
        headers.map((h) => String(row[h] ?? "")).join(",")
      )
      output = [headers.join(","), ...rows].join("\n")
    } else if (outputFormat === "xml") {
      // Simple XML conversion
      const toXml = (obj: unknown, name: string = "root"): string => {
        if (Array.isArray(obj)) {
          return obj.map((item, i) => toXml(item, "item")).join("\n")
        } else if (typeof obj === "object" && obj !== null) {
          const children = Object.entries(obj)
            .map(([key, value]) => toXml(value, key))
            .join("\n")
          return `<${name}>\n${children}\n</${name}>`
        }
        return `<${name}>${String(obj)}</${name}>`
      }
      output = '<?xml version="1.0" encoding="UTF-8"?>\n' + toXml(data)
    } else {
      return { success: false, error: `Cannot convert to ${outputFormat} format` }
    }

    return { success: true, data: output }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : String(e) }
  }
}

/**
 * Convert PDF to images using Poppler or pdf-lib.
 */
async function convertPdfToImages(
  input: string,
  output: string,
  options: { page?: number; dpi?: number } = {}
): Promise<{ success: boolean; error?: string }> {
  const converters = await detectConverters()

  if (converters.poppler) {
    const outputBase = output.replace(/\.\w+$/, "")
    const format = path.extname(output).slice(1).toLowerCase()
    const dpi = options.dpi || 150

    const args = [
      `-${format === "png" ? "png" : "jpeg"}`,
      "-r",
      String(dpi),
    ]

    if (options.page !== undefined) {
      args.push("-f", String(options.page), "-l", String(options.page))
    }

    args.push(input, outputBase)

    const result = await runCommand("pdftoppm", args)
    if (result.success) {
      // pdftoppm adds page numbers to output, rename if single page
      if (options.page !== undefined) {
        const generatedFile = `${outputBase}-${String(options.page).padStart(6, "0")}.${format}`
        try {
          await fs.rename(generatedFile, output)
        } catch {
          // File might not exist or already renamed
        }
      }
      return { success: true }
    }
    return { success: false, error: result.error }
  }

  return { success: false, error: "PDF to image conversion requires poppler-utils (pdftoppm)" }
}

export const ConvertTool = Tool.define("convert", async () => {
  return {
    description: DESCRIPTION,
    parameters: z.object({
      input: z.string().describe("Path to the input file"),
      format: z
        .enum(["pdf", "html", "docx", "pptx", "xlsx", "md", "txt", "png", "jpg", "webp", "svg", "csv", "json", "yaml", "xml"])
        .describe("Target format to convert to"),
      output: z
        .string()
        .optional()
        .describe("Output file path. If not specified, will use input filename with new extension."),
      options: z
        .object({
          quality: z.number().min(1).max(100).optional().describe("Image quality (1-100) for JPEG/WebP"),
          width: z.number().optional().describe("Width in pixels for image resize"),
          height: z.number().optional().describe("Height in pixels for image resize"),
          pageSize: z.enum(["a4", "letter", "a3", "legal"]).optional().describe("Page size for PDF output"),
          landscape: z.boolean().optional().describe("Use landscape orientation for PDF"),
          page: z.number().optional().describe("Specific page number for PDF to image conversion"),
          dpi: z.number().optional().describe("DPI for PDF to image conversion (default: 150)"),
        })
        .optional()
        .describe("Format-specific conversion options"),
    }),
    async execute(params, ctx) {
      // Resolve input path
      const input = path.isAbsolute(params.input)
        ? params.input
        : path.resolve(Instance.directory, params.input)

      // Check input exists
      try {
        await fs.access(input)
      } catch {
        throw new Error(`Input file not found: ${input}`)
      }

      // Determine output path
      const outputExt = formatToExtension(params.format)
      const output = params.output
        ? path.isAbsolute(params.output)
          ? params.output
          : path.resolve(Instance.directory, params.output)
        : input.replace(/\.[^.]+$/, `.${outputExt}`)

      // Request permission
      await ctx.ask({
        permission: "convert",
        patterns: [`${input} -> ${output}`],
        always: [path.dirname(input) + "/*"],
        metadata: {},
      })

      // Detect formats
      const inputFormat = detectFormat(input)
      const outputFormat = params.format

      if (!inputFormat) {
        throw new Error(`Cannot detect format of input file: ${input}`)
      }

      // Ensure output directory exists
      await fs.mkdir(path.dirname(output), { recursive: true })

      // Detect available converters
      const converters = await detectConverters()

      let result: { success: boolean; error?: string }

      // Route to appropriate converter based on formats
      if (inputFormat === outputFormat) {
        // Just copy
        await fs.copyFile(input, output)
        result = { success: true }
      } else if (["png", "jpg", "webp", "svg"].includes(inputFormat) && ["png", "jpg", "webp"].includes(outputFormat)) {
        // Image to image
        result = await convertImage(input, output, params.options)
      } else if (inputFormat === "html" && outputFormat === "pdf") {
        // HTML to PDF
        result = await convertHtmlToPdf(input, output, params.options)
      } else if (inputFormat === "pdf" && ["png", "jpg"].includes(outputFormat)) {
        // PDF to image
        result = await convertPdfToImages(input, output, params.options)
      } else if (["json", "yaml", "csv"].includes(inputFormat) && ["json", "yaml", "csv", "xml"].includes(outputFormat)) {
        // Data format conversion
        const dataResult = await convertData(input, outputFormat)
        if (dataResult.success && dataResult.data) {
          await fs.writeFile(output, dataResult.data)
        }
        result = { success: dataResult.success, error: dataResult.error }
      } else if (inputFormat === "md" && ["pdf", "html", "docx", "pptx"].includes(outputFormat)) {
        // Markdown conversion with Pandoc
        if (converters.pandoc) {
          result = await convertWithPandoc(input, output, outputFormat)
        } else {
          result = { success: false, error: "Markdown conversion requires Pandoc. Install with: brew install pandoc" }
        }
      } else if (["docx", "pptx", "xlsx"].includes(inputFormat) && outputFormat === "pdf") {
        // Office to PDF with LibreOffice
        if (converters.libreoffice) {
          result = await convertWithLibreOffice(input, output, outputFormat)
        } else {
          result = { success: false, error: "Office conversion requires LibreOffice. Install with: brew install --cask libreoffice" }
        }
      } else if (inputFormat === "html" && ["docx", "pptx"].includes(outputFormat)) {
        // HTML to Office with LibreOffice
        if (converters.libreoffice) {
          result = await convertWithLibreOffice(input, output, outputFormat)
        } else if (converters.pandoc) {
          result = await convertWithPandoc(input, output, outputFormat)
        } else {
          result = { success: false, error: "HTML to Office conversion requires LibreOffice or Pandoc" }
        }
      } else {
        // Try LibreOffice as fallback for document conversions
        if (converters.libreoffice) {
          result = await convertWithLibreOffice(input, output, outputFormat)
        } else {
          result = {
            success: false,
            error: `Conversion from ${inputFormat} to ${outputFormat} is not supported. Available converters: ${Object.entries(converters).filter(([, v]) => v).map(([k]) => k).join(", ") || "none"}`,
          }
        }
      }

      if (!result.success) {
        throw new Error(`Conversion failed: ${result.error}`)
      }

      const stats = await fs.stat(output)
      return {
        title: `Converted to ${outputFormat}`,
        metadata: {},
        output: `Successfully converted ${path.basename(input)} to ${path.basename(output)} (${stats.size} bytes)`,
      }
    },
  }
})
