// Draws og.jpg, the 1200×630 picture a shared link to the site shows
// (WhatsApp, Telegram, X, iMessage): the app's icon and name on the app's
// background, and two of the site's screenshots. macOS only (AppKit).
//
//   swift tool/draw-og-image.swift ../flatball/icons/app/app_icon.png
//
// Rerun after changing the screenshots or the words below.
import AppKit

let args = CommandLine.arguments
guard args.count == 2, let icon = NSImage(contentsOfFile: args[1]) else {
  print("usage: swift tool/draw-og-image.swift <the app's icons/app/app_icon.png>")
  exit(1)
}
func screen(_ name: String) -> NSImage {
  guard let image = NSImage(contentsOfFile: "screens/\(name).jpg") else {
    print("Run from the website's folder: screens/\(name).jpg is missing")
    exit(1)
  }
  return image
}

// The app's light tokens (lib/design/theme.dart, and style.css here).
func colour(_ hex: UInt32) -> NSColor {
  NSColor(srgbRed: CGFloat(hex >> 16 & 0xFF) / 255, green: CGFloat(hex >> 8 & 0xFF) / 255,
          blue: CGFloat(hex & 0xFF) / 255, alpha: 1)
}
let background = colour(0xF4F3EF), text = colour(0x2A2A2D), text2 = colour(0x6B6B70)
let text3 = colour(0xA3A3A8), accent = colour(0x3D6A9E)

let width = 1200, height = 630
let rep = NSBitmapImageRep(
  bitmapDataPlanes: nil, pixelsWide: width, pixelsHigh: height, bitsPerSample: 8,
  samplesPerPixel: 4, hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB,
  bytesPerRow: 0, bitsPerPixel: 0)!
NSGraphicsContext.saveGraphicsState()
NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
// AppKit measures from the bottom left; the layout below is written from
// the top, so every rectangle is turned over here.
func fromTop(_ rect: NSRect) -> NSRect {
  NSRect(x: rect.minX, y: CGFloat(height) - rect.maxY, width: rect.width, height: rect.height)
}

background.setFill()
NSRect(x: 0, y: 0, width: width, height: height).fill()

func draw(_ image: NSImage, in top: NSRect, radius: CGFloat) {
  let rect = fromTop(top)
  NSGraphicsContext.saveGraphicsState()
  NSBezierPath(roundedRect: rect, xRadius: radius, yRadius: radius).addClip()
  image.draw(in: rect, from: .zero, operation: .sourceOver, fraction: 1,
             respectFlipped: false, hints: [.interpolation: NSImageInterpolation.high])
  NSGraphicsContext.restoreGraphicsState()
}

func write(_ string: String, x: CGFloat, y: CGFloat, size: CGFloat,
           weight: NSFont.Weight, colour: NSColor) {
  let attributes: [NSAttributedString.Key: Any] = [
    .font: NSFont.systemFont(ofSize: size, weight: weight),
    .foregroundColor: colour,
    .kern: weight == .bold ? -size * 0.02 : 0,
  ]
  let line = NSAttributedString(string: string, attributes: attributes)
  line.draw(at: NSPoint(x: x, y: CGFloat(height) - y - line.size().height))
}

// Left: the icon, the name, what it is.
draw(icon, in: NSRect(x: 72, y: 92, width: 128, height: 128), radius: 29)
write("Flatball Connect", x: 68, y: 246, size: 66, weight: .bold, colour: text)
write("Everything for ultimate, in one app.", x: 72, y: 336, size: 32,
      weight: .regular, colour: text2)
write("Rules · Drills · Strategies · Pickup games", x: 72, y: 392, size: 26,
      weight: .semibold, colour: accent)
write("flatballconnect.app", x: 72, y: 528, size: 24, weight: .medium, colour: text3)

// Right: two phones, running off the bottom edge.
func phone(_ image: NSImage, x: CGFloat, y: CGFloat) {
  let w: CGFloat = 236, h = w * 2385 / 1100, border: CGFloat = 8
  let top = NSRect(x: x, y: y, width: w + border * 2, height: h + border * 2)
  let frame = fromTop(top)
  NSGraphicsContext.saveGraphicsState()
  let shadow = NSShadow()
  shadow.shadowColor = NSColor(white: 0, alpha: 0.16)
  shadow.shadowBlurRadius = 30
  shadow.shadowOffset = NSSize(width: 0, height: -12)
  shadow.set()
  text.setFill()
  NSBezierPath(roundedRect: frame, xRadius: 38, yRadius: 38).fill()
  NSGraphicsContext.restoreGraphicsState()
  draw(image, in: top.insetBy(dx: border, dy: border), radius: 31)
}
phone(screen("learn"), x: 676, y: 70)
phone(screen("map"), x: 932, y: 118)

NSGraphicsContext.restoreGraphicsState()
// A JPEG: WhatsApp shows no picture for one over about 300 KB.
try! rep.representation(using: .jpeg, properties: [.compressionFactor: 0.86])!
  .write(to: URL(fileURLWithPath: "og.jpg"))
print("og.jpg written")
