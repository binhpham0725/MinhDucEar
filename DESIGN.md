---
name: DucEar
colors:
  surface: '#131316'
  surface-dim: '#131316'
  surface-bright: '#39393b'
  surface-container-lowest: '#0e0e10'
  surface-container-low: '#1c1b1e'
  surface-container: '#201f22'
  surface-container-high: '#2a2a2c'
  surface-container-highest: '#353437'
  on-surface: '#e5e1e5'
  on-surface-variant: '#cac4d4'
  inverse-surface: '#e5e1e5'
  inverse-on-surface: '#313033'
  outline: '#948e9d'
  outline-variant: '#494552'
  surface-tint: '#cebdff'
  primary: '#cebdff'
  on-primary: '#381385'
  primary-container: '#a78bfa'
  on-primary-container: '#3c1989'
  inverse-primary: '#674bb5'
  secondary: '#54d8e8'
  on-secondary: '#00363c'
  secondary-container: '#02aebe'
  on-secondary-container: '#003b42'
  tertiary: '#ffafd3'
  on-tertiary: '#620040'
  tertiary-container: '#f170b4'
  on-tertiary-container: '#6a0045'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e8ddff'
  primary-fixed-dim: '#cebdff'
  on-primary-fixed: '#21005e'
  on-primary-fixed-variant: '#4f319c'
  secondary-fixed: '#91f1ff'
  secondary-fixed-dim: '#54d8e8'
  on-secondary-fixed: '#001f23'
  on-secondary-fixed-variant: '#004f57'
  tertiary-fixed: '#ffd8e7'
  tertiary-fixed-dim: '#ffafd3'
  on-tertiary-fixed: '#3d0026'
  on-tertiary-fixed-variant: '#85145a'
  background: '#131316'
  on-background: '#e5e1e5'
  surface-variant: '#353437'
typography:
  display-xl:
    fontFamily: Inter
    fontSize: 56px
    fontWeight: '800'
    lineHeight: 64px
    letterSpacing: -0.03em
  display-xl-mobile:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '800'
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  title-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
    letterSpacing: -0.01em
  title-sm:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '600'
    lineHeight: 22px
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
    letterSpacing: 0em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0.01em
  code-spec-lg:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.04em
  code-spec-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.06em
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.12em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 0.75rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

DucEar translates the deeply personal sonic perspective of "Minh Duc's ears" into a cinematic, nocturnal audio haven. Built for discerning audiophiles, producers, and sonic travelers, the interface merges high-fidelity studio precision with the ambient intimacy of late-night listening.

The aesthetic philosophy centers on **Refined Dark Glassmorphism** layered over a vast, pitch-black void. Translucent frosted glass substrates, subtle spectral refraction, crisp 1px borders, and dynamic ambient glows derived from active album artwork elevate the UI beyond a utility into a sensorial stage. Interactions feel weightless, fluid, and acoustic, treating every album cover, waveform visualizer, and stream parameter as an intentional gallery object.

## Colors

The palette embraces deep tonal stratification within extreme low-light spectrums to preserve optical focus on cover art and audio visualizers:

- **Obsidian Foundation (`#070709`)**: The ground layer. An infinite, near-zero luminance base that prevents eye strain and provides absolute contrast.
- **Surface Elevation 1 (`#101014`)**: Container background for pinned sidebars, docked utility strips, and backdrop card regions.
- **Surface Elevation 2 (`#15151B`)**: Elevated modular blocks, floating dropdowns, and contextual menus.
- **Acoustic Glass Fill (`rgba(18, 18, 23, 0.58)`)**: Translucent surface applied over dynamic ambient glows and blurred cover art backdrops.
- **Glass Specular Border (`rgba(255, 255, 255, 0.08)`)**: Precision 1px outline defining glass sheets without harsh solid lines. Active states ramp up to `rgba(167, 139, 250, 0.40)`.
- **Primary Accent (`#A78BFA` - Electric Violet)**: Used for active playback controls, active track indicators, focus highlights, and scrubber thumbs.
- **Secondary Accent (`#67E8F9` - Cyan Phosphor)**: Applied to technical telemetry, stereo visualizer spikes, active Hi-Res badge markers, and volume levels.
- **Tertiary Accent (`#F472B6` - Neon Orchid)**: Reserved for curated recommendation tags, loved/favorite hearts, and acoustic dynamic highlights.
- **Text Tiers**: High-emphasis (`#F9FAFB`), Medium-emphasis audio metadata (`#9CA3AF`), and Low-emphasis technical timestamps (`#4B5563`).

## Typography

The type system balances clean, neutral UI scannability with studio-grade monospace engineering:

- **Inter**: Drives the narrative and interface layer. Its neutral grotesque geometry allows editorial music titles, artist credits, and long-form liner notes to breathe without visual noise.
- **JetBrains Mono**: Encodes all audio telemetry, sample rates (`192 kHz / 24-bit`), bitrates (`9216 kbps`), format labels (`FLAC`, `DSD`, `MQA`), timecode positions (`02:45 / 06:12`), and EQ frequencies.
- **Editorial Contrast**: Album and playlist titles use high-weight, negative-kerning Inter (`display-xl`), contrasting sharply against raw, upper-case monospaced audio diagnostics.

## Layout & Spacing

DucEar employs an adaptable fluid grid with fixed glass docking anchors:

- **Grid Architecture**: 12-column fluid grid on desktop (`> 1280px`) with 24px (`1.5rem`) gutters and 32px (`2rem`) outer boundaries. Reflows to an 8-column layout on tablet (`768px - 1279px`) and a 4-column layout on mobile (`< 768px`) with 12px gutters.
- **Persistent Docking Anchor**: 
  - Desktop: Left vertical acoustic nav column (240px fixed width) + fluid central content workspace + floating bottom glass player capsule.
  - Mobile: Full-width stacked view with bottom glass capsule docked 12px above mobile navigation rails.
- **Spatial Rhythm**: Components adhere to an 8pt spatial baseline. Tracklist entries use condensed vertical padding (`space-sm` / 8px) to maximize scanning density, while album heroes and category browses expand with `space-xl` (40px) to establish editorial grandeur.

## Elevation & Depth

Visual hierarchy is forged through multi-plane glassmorphism and real-time color projection rather than flat drop shadows:

- **Layer 0 (Canvas)**: Obsidian dark void (`#070709`) containing real-time blurred radial color discs that inherit primary tones from the currently playing album art (blur radius: `96px - 160px`, opacity: `0.15 - 0.28`).
- **Layer 1 (Panels & Shelves)**: Background: `rgba(18, 18, 23, 0.58)` with backdrop-filter `blur(24px) saturate(160%)`. Outlined with a top-weighted specular rim: `1px solid rgba(255, 255, 255, 0.08)`.
- **Layer 2 (Floating Player Capsule)**: Suspended playback bar lifted above page content. Background: `rgba(21, 21, 27, 0.72)` with backdrop-filter `blur(32px)`. Shadow: `0 20px 48px -12px rgba(0, 0, 0, 0.85), 0 0 24px -2px rgba(167, 139, 250, 0.12)`.
- **Layer 3 (Modals & EQ Overlays)**: Deep ambient shadow `0 24px 64px -8px rgba(0, 0, 0, 0.92)` coupled with a distinct interior glass bevel highlight (`inset 0 1px 0 rgba(255, 255, 255, 0.15)`).

## Shapes

The geometric framework balances organic fluidity with technical precision:

- **Standard Elements (0.5rem / 8px)**: Track rows, context menu items, tech badges, and audio input selectors.
- **Surface Cards & Hero Glass Banners (`rounded-lg` / 1rem / 16px)**: Album art containers, artist highlight tiles, and playlist grid items.
- **Floating Controls & Modals (`rounded-xl` / 1.5rem / 24px)**: The central player capsule, volume popovers, and equalizer consoles.
- **Pill Maximums (`rounded-full`)**: Play/pause trigger switches, dynamic visualizer frequency bars, scrubbing thumbs, and audio format pill tags.

## Components

### Floating Player Capsule
The crown jewel of the layout. A centered, suspended horizontal capsule resting 24px above the bottom viewport edge.
- Contains miniature vinyl/album thumbnail with ambient glow, title and artist ticker, interactive waveform seekbar, master transport controls (Shuffle, Prev, Play/Pause, Next, Loop), audio output target, and a dedicated Hi-Res status chip.
- Background: `rgba(21, 21, 27, 0.72)` with 32px backdrop blur and 1px border (`rgba(255, 255, 255, 0.08)`).
- On hover, the capsule's outer border subtly mirrors the track's primary tone (`rgba(167, 139, 250, 0.25)`).

### Interactive Audio Visualizer Bars
- Real-time frequency response spectrum rendered using slim vertical pill bars (`2px - 3px` width, `2px` gap).
- Gradient fills transition from Cyan (`#67E8F9`) at low amplitudes up to Violet (`#A78BFA`) at peak levels, providing immediate feedback during active playback.

### Audio Specification Chips & Badges
- Rendered in `JetBrains Mono` (`code-spec-sm` and `label-caps`).
- Pill badge for stream health: Dark obsidian fill (`#070709`), 1px cyan outline (`rgba(103, 232, 249, 0.3)`), cyan text glow displaying `24-BIT / 192KHZ FLAC`.

### Buttons
- **Primary Transport (Play/Pause)**: Solid circular container filled with `#A78BFA`, icon in dark obsidian (`#070709`). Emits a faint dynamic violet bloom (`box-shadow: 0 0 20px rgba(167, 139, 250, 0.45)`). Scales slightly on tap (`0.96`).
- **Secondary (Control Toggles, Queue)**: Translucent glass pill (`rgba(255, 255, 255, 0.05)`), text `#F9FAFB`. Border: `1px solid rgba(255, 255, 255, 0.08)`. Hover ramps surface to `rgba(255, 255, 255, 0.10)` and icon color to `#A78BFA`.
- **Ghost / Tertiary**: Transparent base with low-opacity icons (`#9CA3AF`), shifting to `#FFFFFF` on hover.

### Tracklist Rows
- Compact layout with index number/playing EQ indicator, album thumb (`40x40px`, `rounded-md`), title, artist, play count, duration, and technical format indicator.
- Default state: fully transparent background.
- Hover state: slides onto a glass sheen (`rgba(255, 255, 255, 0.04)`) with border radius `8px` and unveils contextual quick-actions (favorite, add to playlist, ellipsis menu).
- Active/Playing state: Left border accent line in `#A78BFA`, track title illuminates in `#A78BFA`, animated 3-bar audio equalizer replaces track index number.

### Input Fields & Search
- Low-profile search capsule with a glass substrate (`rgba(16, 16, 20, 0.6)`), 1px border (`rgba(255, 255, 255, 0.08)`), and left-aligned search glyph.
- Focused state: Border transforms to `#A78BFA` with an ambient glow (`box-shadow: 0 0 16px rgba(167, 139, 250, 0.20)`). Monospaced shortcut indicator (`⌘K`) anchored to the right edge.

### Cards & Album Modules
- Square aspect-ratio cover art with 16px corner radius.
- Embedded ambient shadow underneath the card that samples the cover art’s dominant hue.
- Hover effect: Art gently scales (`scale: 1.03`) with a rapid glass sheen reflection pass; a floating violet play button fades in over the lower right corner.