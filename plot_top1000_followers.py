"""
Two stacked bar charts from twitch_top1000_stats_scraped.json (non-null followers):
  Top:    every streamer, sorted low → high by followers.
  Bottom: top 100 by follower count, displayed low → high (no x labels).
"""

import json
from pathlib import Path

import matplotlib
import matplotlib.pyplot as plt

DATA_PATH = Path(__file__).resolve().parent / "twitch_top1000_stats_scraped.json"


def _fmt_y_axis(ax: plt.Axes) -> None:
    ax.ticklabel_format(style="plain", axis="y")
    ax.yaxis.set_major_formatter(
        plt.FuncFormatter(lambda v, _: f"{int(v):,}")
    )


def main() -> None:
    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    rows = [
        s
        for s in data["streamers"]
        if s.get("followers") is not None
    ]

    all_sorted = sorted(rows, key=lambda s: s["followers"])
    followers_all = [s["followers"] for s in all_sorted]
    n_all = len(followers_all)

    by_followers = sorted(rows, key=lambda s: s["followers"], reverse=True)[:100]
    top100_sorted = sorted(by_followers, key=lambda s: s["followers"])
    followers_100 = [s["followers"] for s in top100_sorted]

    fig_w = max(14, min(36, n_all * 0.02))
    fig, (ax_top, ax_bot) = plt.subplots(
        2,
        1,
        figsize=(fig_w, 10),
        height_ratios=[1.2, 1.0],
    )

    ax_top.bar(range(n_all), followers_all, width=1.0, color="steelblue", edgecolor="none")
    ax_top.set_ylabel("Followers")
    ax_top.set_xticks([])
    ax_top.set_title(f"All streamers — {n_all} channels (sorted by followers)")
    ax_top.margins(x=0.01)
    _fmt_y_axis(ax_top)

    ax_bot.bar(range(100), followers_100, width=1.0, color="coral", edgecolor="none")
    ax_bot.set_ylabel("Followers")
    ax_bot.set_xticks([])
    ax_bot.set_title("Top 100 by follower count (sorted ascending for display)")
    ax_bot.margins(x=0.01)
    _fmt_y_axis(ax_bot)

    fig.suptitle("Scraped Twitch stats — followers", y=1.02)
    plt.tight_layout()
    out = Path(__file__).resolve().parent / "followers_all_and_top100.png"
    fig.savefig(out, dpi=150, bbox_inches="tight")
    print(f"Saved {out}")
    if matplotlib.get_backend().lower() != "agg":
        plt.show()


if __name__ == "__main__":
    main()
