#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["Pillow>=10"]
# ///
"""Build an animated GIF from a folder of images.

Usage:
    build_gif.py <folder> <output.gif> [--frame-seconds 2] [--max-width 400]
    build_gif.py <folder-A> <folder-B> <output.gif> [--frame-seconds 2] \\
                 [--max-width 900] [--label-a Desktop] [--label-b Mobile] \\
                 [--gap 100] [--outer 40] [--card-h 110] [--font-size 48]

In single-folder mode, frames are taken from <folder> in alphabetical order.

In paired mode (two input folders), frames at the same alphabetical position
in <folder-A> and <folder-B> are composed side by side (A on the left) with
an optional label card above each column. Both folders must contain the same
number of images.

Prefix files with 01-, 02-, … to control the order. Supported extensions:
.png, .jpg, .jpeg (case-insensitive).
"""

from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
import tempfile
import urllib.request
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

IMG_EXTS = {".png", ".jpg", ".jpeg"}

# Playfair Display is the app's display font (see frontend/tailwind.config.ts).
# Cached to ~/.cache/miam-docs/fonts/ on first run so the repo stays clean.
DEFAULT_FONT_URL = (
    "https://github.com/google/fonts/raw/main/ofl/playfairdisplay/"
    "PlayfairDisplay%5Bwght%5D.ttf"
)

SYSTEM_FONT_FALLBACKS = [
    "/System/Library/Fonts/Helvetica.ttc",
    "/System/Library/Fonts/HelveticaNeue.ttc",
    "/System/Library/Fonts/Supplemental/Arial.ttf",
    "/Library/Fonts/Arial.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
]


def cached_font(url: str) -> Path | None:
    """Download a font once and cache it. Returns None on network failure."""
    cache_dir = Path.home() / ".cache" / "miam-docs" / "fonts"
    cache_dir.mkdir(parents=True, exist_ok=True)
    target = cache_dir / url.rsplit("/", 1)[-1]
    if target.exists():
        return target
    print(f"Downloading {target.name}...", file=sys.stderr)
    try:
        urllib.request.urlretrieve(url, target)
        return target
    except Exception as e:
        print(f"warning: failed to download font ({e})", file=sys.stderr)
        return None


def list_images(folder: Path) -> list[Path]:
    return sorted(p for p in folder.iterdir() if p.suffix.lower() in IMG_EXTS)


def load_font(font_path: str | None, font_url: str, size: int) -> ImageFont.ImageFont:
    if font_path:
        return ImageFont.truetype(font_path, size)
    # Try the app's display font first (downloaded and cached on first run).
    downloaded = cached_font(font_url)
    if downloaded is not None:
        return ImageFont.truetype(str(downloaded), size)
    # Network unavailable / cache write failed — fall back to anything on disk.
    for candidate in SYSTEM_FONT_FALLBACKS:
        if Path(candidate).exists():
            return ImageFont.truetype(candidate, size)
    print(
        "warning: no TTF/OTF font found — falling back to PIL's default",
        file=sys.stderr,
    )
    return ImageFont.load_default()


def column(
    img_path: Path,
    target_h: int,
    label: str | None,
    card_h: int,
    font: ImageFont.ImageFont,
    card_bg: tuple[int, int, int],
    card_fg: tuple[int, int, int],
    bg: tuple[int, int, int],
) -> Image.Image:
    """Scale one image to target_h and add an optional label card on top."""
    img = Image.open(img_path).convert("RGB")
    scaled_w = round(img.width * target_h / img.height)
    img = img.resize((scaled_w, target_h), Image.LANCZOS)

    if not label:
        return img

    out = Image.new("RGB", (scaled_w, target_h + card_h), bg)
    card = Image.new("RGB", (scaled_w, card_h), card_bg)
    draw = ImageDraw.Draw(card)
    bbox = draw.textbbox((0, 0), label, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text(
        ((scaled_w - tw) / 2 - bbox[0], (card_h - th) / 2 - bbox[1]),
        label,
        fill=card_fg,
        font=font,
    )
    out.paste(card, (0, 0))
    out.paste(img, (0, card_h))
    return out


def compose_pair(
    img_a: Path,
    img_b: Path,
    args: argparse.Namespace,
    font: ImageFont.ImageFont,
) -> Image.Image:
    bg = (255, 255, 255)
    card_bg = (238, 238, 238)
    card_fg = (51, 51, 51)
    target_h = args.image_h

    col_a = column(
        img_a, target_h, args.label_a, args.card_h, font, card_bg, card_fg, bg
    )
    col_b = column(
        img_b, target_h, args.label_b, args.card_h, font, card_bg, card_fg, bg
    )

    # Align columns to the same vertical extent (when only one has a label).
    final_h = max(col_a.height, col_b.height)

    total_w = col_a.width + args.gap + col_b.width + 2 * args.outer
    total_h = final_h + 2 * args.outer
    canvas = Image.new("RGB", (total_w, total_h), bg)
    canvas.paste(col_a, (args.outer, args.outer + (final_h - col_a.height)))
    canvas.paste(
        col_b,
        (args.outer + col_a.width + args.gap, args.outer + (final_h - col_b.height)),
    )
    return canvas


def assemble_gif(
    frame_dir: Path, output: Path, frame_seconds: float, max_width: int
) -> None:
    if not shutil.which("ffmpeg"):
        raise SystemExit("error: ffmpeg required (brew install ffmpeg)")

    frames = list_images(frame_dir)
    concat_list = frame_dir / "concat.txt"
    lines = []
    for f in frames:
        lines.append(f"file '{f.resolve()}'")
        lines.append(f"duration {frame_seconds}")
    # Concat demuxer drops the last frame's duration; repeat the final image
    # without a duration line. See https://trac.ffmpeg.org/wiki/Slideshow
    lines.append(f"file '{frames[-1].resolve()}'")
    concat_list.write_text("\n".join(lines))

    print(
        f"Building {output} from {len(frames)} frames "
        f"({frame_seconds}s each, {max_width}px wide)..."
    )
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-f",
            "concat",
            "-safe",
            "0",
            "-i",
            str(concat_list),
            "-vf",
            f"scale={max_width}:-1:flags=lanczos,split[a][b];"
            f"[a]palettegen=stats_mode=diff[p];"
            f"[b][p]paletteuse=dither=bayer:bayer_scale=5",
            "-loop",
            "0",
            str(output),
            "-hide_banner",
            "-loglevel",
            "error",
        ],
        check=True,
    )
    size_kb = output.stat().st_size / 1024
    print(f"Done: {output} ({size_kb:.0f}K)")


def main() -> None:
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument(
        "paths",
        nargs="+",
        help="<folder> <output.gif>  OR  <folder-A> <folder-B> <output.gif>",
    )
    parser.add_argument("--frame-seconds", type=float, default=2.0)
    parser.add_argument(
        "--max-width",
        type=int,
        default=None,
        help="GIF width (default 400 single, 900 paired)",
    )
    parser.add_argument(
        "--label-a", default=None, help="Card text above column A (paired mode)"
    )
    parser.add_argument(
        "--label-b", default=None, help="Card text above column B (paired mode)"
    )
    parser.add_argument(
        "--gap", type=int, default=100, help="Horizontal gap between columns in px"
    )
    parser.add_argument("--outer", type=int, default=40, help="Outer padding in px")
    parser.add_argument(
        "--card-h", type=int, default=110, help="Label card height in px"
    )
    parser.add_argument("--font-size", type=int, default=48)
    parser.add_argument(
        "--font", default=None, help="Path to a TTF/OTF file (overrides --font-url)"
    )
    parser.add_argument(
        "--font-url", default=DEFAULT_FONT_URL, help="TTF/OTF URL — cached on first run"
    )
    parser.add_argument(
        "--image-h",
        type=int,
        default=800,
        help="Per-column image height before scaling to max-width",
    )
    args = parser.parse_args()

    paths = args.paths
    if len(paths) == 2:
        mode = "single"
        folder_a, output = Path(paths[0]), Path(paths[1])
        folder_b = None
    elif len(paths) == 3:
        mode = "pair"
        folder_a, folder_b, output = Path(paths[0]), Path(paths[1]), Path(paths[2])
    else:
        parser.error("expected 2 or 3 positional arguments")

    if args.max_width is None:
        args.max_width = 900 if mode == "pair" else 400

    if not folder_a.is_dir():
        parser.error(f"'{folder_a}' is not a directory")
    if folder_b is not None and not folder_b.is_dir():
        parser.error(f"'{folder_b}' is not a directory")

    output.parent.mkdir(parents=True, exist_ok=True)

    with tempfile.TemporaryDirectory(prefix="gif_build.") as tmp:
        work = Path(tmp)
        if mode == "pair":
            assert folder_b is not None
            frames_a = list_images(folder_a)
            frames_b = list_images(folder_b)
            if not frames_a:
                parser.error(f"no images in '{folder_a}'")
            if len(frames_a) != len(frames_b):
                parser.error(
                    f"folder mismatch — '{folder_a}' has {len(frames_a)} images, "
                    f"'{folder_b}' has {len(frames_b)}"
                )

            font = (
                load_font(args.font, args.font_url, args.font_size)
                if (args.label_a or args.label_b)
                else ImageFont.load_default()
            )
            composed = work / "composed"
            composed.mkdir()
            print(f"Composing {len(frames_a)} side-by-side pairs...")
            for i, (a, b) in enumerate(zip(frames_a, frames_b)):
                compose_pair(a, b, args, font).save(composed / f"{i:03d}.png")
            frame_dir = composed
        else:
            if not list_images(folder_a):
                parser.error(f"no images in '{folder_a}'")
            frame_dir = folder_a

        assemble_gif(frame_dir, output, args.frame_seconds, args.max_width)


if __name__ == "__main__":
    main()
