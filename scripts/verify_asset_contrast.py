"""Asset visibility and contrast verification gate for light theme websites.

This module validates that all registered hardware images in data.json have
sufficient contrast and valid foreground content against light theme carrier
surfaces (Rule 0003), preventing invisible white-on-white wireframes or blank
transparent assets from reaching production.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any, Dict, List, Tuple

import numpy as np
from PIL import Image

# Reference light background luminance (#f8fafc / #ffffff)
LIGHT_BG_LUMINANCE: float = 0.2126 * 248.0 + 0.7152 * 250.0 + 0.0722 * 252.0  # ~249.7


def compute_asset_metrics(image_path: Path) -> Dict[str, Any]:
    """Compute foreground pixel ratio, contrast, and luminance distribution.

    Args:
        image_path: Path to the image file.

    Returns:
        Dict containing validation metrics:
            - exists: bool
            - width: int
            - height: int
            - fg_ratio: float (0.0 to 1.0)
            - mean_lum: float (0.0 to 255.0)
            - std_lum: float
            - contrast_diff: float (|bg_lum - mean_lum|)
            - near_white_pct: float (percentage of fg pixels with lum > 240)
            - passed: bool
            - reason: str
    """
    if not image_path.exists():
        return {
            "exists": False,
            "passed": False,
            "reason": f"File does not exist: {image_path}",
        }

    try:
        with Image.open(image_path) as img:
            rgba = img.convert("RGBA")
            width, height = rgba.size
            arr = np.array(rgba)
    except Exception as exc:  # pylint: disable=broad-except
        return {
            "exists": True,
            "passed": False,
            "reason": f"Failed to open image: {exc}",
        }

    total_pixels: int = width * height
    alpha = arr[:, :, 3]
    # Pixels with alpha > 25 (more than ~10% opacity)
    fg_mask = alpha > 25
    fg_count: int = int(np.sum(fg_mask))

    if fg_count == 0:
        return {
            "exists": True,
            "width": width,
            "height": height,
            "fg_ratio": 0.0,
            "passed": False,
            "reason": "Image is completely transparent with 0 foreground pixels",
        }

    fg_ratio: float = float(fg_count / total_pixels)
    if fg_ratio < 0.01:
        return {
            "exists": True,
            "width": width,
            "height": height,
            "fg_ratio": fg_ratio,
            "passed": False,
            "reason": f"Foreground occupies only {fg_ratio * 100:.2f}% of canvas (<1% minimum threshold)",
        }

    fg_rgb = arr[fg_mask, :3].astype(np.float32)
    # Relative luminance according to ITU-R BT.709
    lum = 0.2126 * fg_rgb[:, 0] + 0.7152 * fg_rgb[:, 1] + 0.0722 * fg_rgb[:, 2]

    mean_lum: float = float(np.mean(lum))
    std_lum: float = float(np.std(lum))
    contrast_diff: float = float(abs(LIGHT_BG_LUMINANCE - mean_lum))
    near_white_pct: float = float(np.mean(lum > 240.0) * 100.0)

    # Rejection criteria:
    # 1. Image foreground is virtually identical in brightness to light background
    #    with negligible texture/shadow detail (std_lum < 15)
    if contrast_diff < 15.0 and std_lum < 15.0:
        return {
            "exists": True,
            "width": width,
            "height": height,
            "fg_ratio": fg_ratio,
            "mean_lum": mean_lum,
            "std_lum": std_lum,
            "contrast_diff": contrast_diff,
            "near_white_pct": near_white_pct,
            "passed": False,
            "reason": (
                f"Insufficient contrast against light background: contrast_diff={contrast_diff:.1f} < 15.0 "
                f"and std_lum={std_lum:.1f} < 15.0 (image blends invisibly into carrier)"
            ),
        }

    # 2. Image is predominantly pure white wireframe (e.g. >80% near-white and low contrast)
    if near_white_pct > 80.0 and contrast_diff < 20.0:
        return {
            "exists": True,
            "width": width,
            "height": height,
            "fg_ratio": fg_ratio,
            "mean_lum": mean_lum,
            "std_lum": std_lum,
            "contrast_diff": contrast_diff,
            "near_white_pct": near_white_pct,
            "passed": False,
            "reason": (
                f"Near-white wireframe detected: {near_white_pct:.1f}% of foreground is near-white "
                f"with contrast_diff={contrast_diff:.1f} < 20.0"
            ),
        }

    return {
        "exists": True,
        "width": width,
        "height": height,
        "fg_ratio": fg_ratio,
        "mean_lum": mean_lum,
        "std_lum": std_lum,
        "contrast_diff": contrast_diff,
        "near_white_pct": near_white_pct,
        "passed": True,
        "reason": "OK",
    }


def verify_registry_assets(
    root_dir: Path, data_file: Path
) -> Tuple[bool, List[Dict[str, Any]]]:
    """Verify all assets referenced in data.json.

    Args:
        root_dir: Project root directory.
        data_file: Path to data.json.

    Returns:
        Tuple of (all_passed, results_list).
    """
    with open(data_file, "r", encoding="utf-8") as file_handle:
        data = json.load(file_handle)

    all_assets: List[Dict[str, Any]] = (
        data.get("hardware_registry", [])
        + data.get("display_assets", [])
        + data.get("peripherals", [])
        + data.get("power_assets", [])
    )

    results: List[Dict[str, Any]] = []
    all_passed: bool = True

    for asset in all_assets:
        asset_id: str = asset.get("id", "UNKNOWN")
        image_rel_path: str = asset.get("image_path", "")
        full_path: Path = root_dir / image_rel_path

        metrics = compute_asset_metrics(full_path)
        metrics["id"] = asset_id
        metrics["path"] = image_rel_path
        results.append(metrics)

        if not metrics["passed"]:
            all_passed = False

    return all_passed, results


def main() -> int:
    """CLI entrypoint for asset contrast verification."""
    root_dir = Path(__file__).resolve().parent.parent
    data_file = root_dir / "data.json"

    # Optional single file check
    if len(sys.argv) > 1:
        target_path = Path(sys.argv[1])
        metrics = compute_asset_metrics(target_path)
        print(json.dumps(metrics, indent=2))
        return 0 if metrics["passed"] else 1

    all_passed, results = verify_registry_assets(root_dir, data_file)

    print(f"=== Asset Contrast & Visibility Audit ({len(results)} assets) ===")
    for res in results:
        status = "PASS" if res["passed"] else "FAIL"
        diff_str = f"{res.get('contrast_diff', 0.0):5.1f}" if "contrast_diff" in res else " N/A "
        ratio_str = f"{res.get('fg_ratio', 0.0) * 100:4.1f}%" if "fg_ratio" in res else " N/A "
        white_str = f"{res.get('near_white_pct', 0.0):4.1f}%" if "near_white_pct" in res else " N/A "
        print(
            f"[{status}] {res['id']:18} {res['path']:36} "
            f"diff={diff_str} fg={ratio_str} near_white={white_str} : {res['reason']}"
        )

    if not all_passed:
        print("\nERROR: One or more image assets failed the light theme visibility gate.")
        return 1

    print("\nSUCCESS: All registered image assets passed the light theme visibility gate.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
