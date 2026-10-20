"""
generate_all_game_arts.py — World-Class Luxury Artwork Generator for Mantrika Games
Generates bespoke, authentic, high-resolution 3D perspective artwork for all 27 games.
"""

import os
import subprocess
import time

CHROME_BIN = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
OUTPUT_DIR = "/Users/shubham/mantrikagames/assets/images"
TEMP_HTML = "/Users/shubham/mantrikagames/scratch_card.html"

HTML_TEMPLATE = """<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800&family=Inter:wght@400;600&display=swap');
  * {{ margin: 0; padding: 0; box-sizing: border-box; }}
  body {{
    width: 1200px;
    height: 900px;
    background: #0B0D0E;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    perspective: 1200px;
    font-family: 'Cinzel', serif;
  }}
  
  .backdrop-glow {{
    position: absolute;
    width: 1000px;
    height: 800px;
    background: radial-gradient(ellipse at center, {glow_color} 0%, rgba(18, 21, 24, 0.75) 50%, #0B0D0E 100%);
    pointer-events: none;
  }}
  
  .scene {{
    position: relative;
    width: 720px;
    height: 720px;
    transform: rotateX(30deg) rotateZ({rot_z}deg) scale(0.92);
    transform-style: preserve-3d;
  }}
  
  .board-shadow {{
    position: absolute;
    inset: -35px;
    background: rgba(0, 0, 0, 0.75);
    filter: blur(45px);
    transform: translateZ(-40px) translateY(45px);
    border-radius: 40px;
  }}

  .board-plinth {{
    position: absolute;
    inset: 0;
    background: {plinth_bg};
    border-radius: 28px;
    border: 4px solid {plinth_border};
    box-shadow: 
      inset 0 0 50px rgba(0, 0, 0, 0.85),
      0 25px 60px rgba(0, 0, 0, 0.95),
      0 0 0 2px rgba(214, 173, 105, 0.35);
    padding: 26px;
    transform-style: preserve-3d;
  }}

  .board-inner {{
    width: 100%;
    height: 100%;
    background: {inner_bg};
    border-radius: 18px;
    border: 2px solid rgba(214, 173, 105, 0.4);
    box-shadow: inset 0 0 60px rgba(0, 0, 0, 0.9);
    position: relative;
    overflow: hidden;
  }}

  svg.board-grid {{
    width: 100%;
    height: 100%;
    filter: drop-shadow(0 4px 6px rgba(0,0,0,0.85));
  }}

  .watermark {{
    position: absolute;
    bottom: 45px;
    left: 55px;
    color: rgba(244, 233, 212, 0.9);
    text-shadow: 0 4px 16px rgba(0, 0, 0, 0.95);
    z-index: 10;
  }}
  .watermark h1 {{
    font-size: 34px;
    letter-spacing: 4px;
    font-weight: 700;
    color: #F4E9D4;
    text-transform: uppercase;
  }}
  .watermark p {{
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: #D6AD69;
    margin-top: 5px;
  }}
  
  .vignette {{
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at center, transparent 40%, rgba(11, 13, 14, 0.88) 100%);
    pointer-events: none;
    z-index: 20;
  }}
</style>
</head>
<body>
  <div class="backdrop-glow"></div>
  
  <div class="scene">
    <div class="board-shadow"></div>
    <div class="board-plinth">
      <div class="board-inner">
        {svg_content}
      </div>
    </div>
  </div>

  <div class="watermark">
    <h1>{title}</h1>
    <p>{subtitle}</p>
  </div>

  <div class="vignette"></div>
</body>
</html>
"""

COMMON_DEFS = """
<defs>
  <linearGradient id="goldLine" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" stop-color="#FFF0D0"/>
    <stop offset="50%" stop-color="#D6AD69"/>
    <stop offset="100%" stop-color="#8C6D3B"/>
  </linearGradient>
  <radialGradient id="pieceGold" cx="35%" cy="30%" r="65%">
    <stop offset="0%" stop-color="#FFF7E6"/>
    <stop offset="40%" stop-color="#E5C178"/>
    <stop offset="80%" stop-color="#996E2E"/>
    <stop offset="100%" stop-color="#4E330D"/>
  </radialGradient>
  <radialGradient id="pieceIvory" cx="35%" cy="30%" r="65%">
    <stop offset="0%" stop-color="#FFFFFF"/>
    <stop offset="45%" stop-color="#F4EADB"/>
    <stop offset="80%" stop-color="#D4C4AE"/>
    <stop offset="100%" stop-color="#A8947C"/>
  </radialGradient>
  <radialGradient id="pieceObsidian" cx="35%" cy="30%" r="65%">
    <stop offset="0%" stop-color="#707A84"/>
    <stop offset="45%" stop-color="#24282D"/>
    <stop offset="80%" stop-color="#111316"/>
    <stop offset="100%" stop-color="#020304"/>
  </radialGradient>
  <radialGradient id="pieceRuby" cx="35%" cy="30%" r="65%">
    <stop offset="0%" stop-color="#FFA8B6"/>
    <stop offset="40%" stop-color="#D63350"/>
    <stop offset="80%" stop-color="#8A152A"/>
    <stop offset="100%" stop-color="#3D000C"/>
  </radialGradient>
  <radialGradient id="pieceSapphire" cx="35%" cy="30%" r="65%">
    <stop offset="0%" stop-color="#A8D8FF"/>
    <stop offset="40%" stop-color="#2B7DE9"/>
    <stop offset="80%" stop-color="#11458A"/>
    <stop offset="100%" stop-color="#00183D"/>
  </radialGradient>
  <radialGradient id="pieceJade" cx="35%" cy="30%" r="65%">
    <stop offset="0%" stop-color="#C2F5D6"/>
    <stop offset="40%" stop-color="#38A169"/>
    <stop offset="80%" stop-color="#1C5E3B"/>
    <stop offset="100%" stop-color="#0B2B19"/>
  </radialGradient>
  <filter id="pieceShadow" x="-35%" y="-35%" width="170%" height="170%">
    <feDropShadow dx="4" dy="8" stdDeviation="6" flood-color="#000" flood-opacity="0.85"/>
  </filter>
  <filter id="glowFilter" x="-30%" y="-30%" width="160%" height="160%">
    <feGaussianBlur stdDeviation="8" result="blur"/>
    <feComposite in="SourceGraphic" in2="blur" operator="over"/>
  </filter>
</defs>
"""

# Dictionary of bespoke SVG contents for all 26 remaining games
GAMES = {
    # 1. Reversi World
    "game_reversi_art.jpg": {
        "title": "Reversi World",
        "subtitle": "Capture, Flip & Outflank • 8x8 Felt Tabletop",
        "glow_color": "rgba(40, 167, 69, 0.22)",
        "plinth_bg": "linear-gradient(135deg, #2b1810 0%, #160c08 60%, #0a0503 100%)",
        "plinth_border": "#4a2e1f",
        "inner_bg": "radial-gradient(circle at 45% 35%, #18422d 0%, #0d281a 70%, #06160d 100%)",
        "rot_z": -12,
        "svg": """<svg class="board-grid" viewBox="0 0 660 660">""" + COMMON_DEFS + """
          <!-- 8x8 Grid -->
          """ + "".join([f'<line x1="{45 + i*71.25}" y1="45" x2="{45 + i*71.25}" y2="615" stroke="rgba(214, 173, 105, 0.35)" stroke-width="2"/>' for i in range(9)]) + """
          """ + "".join([f'<line x1="45" y1="{45 + j*71.25}" x2="615" y2="{45 + j*71.25}" stroke="rgba(214, 173, 105, 0.35)" stroke-width="2"/>' for j in range(9)]) + """
          <!-- Star dots -->
          <circle cx="187.5" cy="187.5" r="5" fill="#D6AD69"/>
          <circle cx="472.5" cy="187.5" r="5" fill="#D6AD69"/>
          <circle cx="187.5" cy="472.5" r="5" fill="#D6AD69"/>
          <circle cx="472.5" cy="472.5" r="5" fill="#D6AD69"/>
          <!-- Discs -->
          <circle cx="258" cy="258" r="28" fill="url(#pieceGold)" filter="url(#pieceShadow)"/>
          <circle cx="330" cy="258" r="28" fill="url(#pieceObsidian)" filter="url(#pieceShadow)"/>
          <circle cx="401" cy="258" r="28" fill="url(#pieceGold)" filter="url(#pieceShadow)"/>
          <circle cx="258" cy="330" r="28" fill="url(#pieceObsidian)" filter="url(#pieceShadow)"/>
          <circle cx="330" cy="330" r="28" fill="url(#pieceGold)" filter="url(#pieceShadow)"/>
          <circle cx="401" cy="330" r="28" fill="url(#pieceObsidian)" filter="url(#pieceShadow)"/>
          <circle cx="472" cy="330" r="28" fill="url(#pieceGold)" filter="url(#pieceShadow)"/>
          <circle cx="258" cy="401" r="28" fill="url(#pieceGold)" filter="url(#pieceShadow)"/>
          <circle cx="330" cy="401" r="28" fill="url(#pieceObsidian)" filter="url(#pieceShadow)"/>
          <circle cx="401" cy="401" r="28" fill="url(#pieceGold)" filter="url(#pieceShadow)"/>
          <!-- Flip arc -->
          <path d="M 270 240 Q 330 180 390 240" fill="none" stroke="#FFF0D0" stroke-width="3" stroke-dasharray="6,6" filter="url(#glowFilter)"/>
          <ellipse cx="330" cy="210" rx="26" ry="14" fill="url(#pieceGold)" filter="url(#pieceShadow)"/>
        </svg>"""
    },

    # 2. Pallanguzhi
    "game_pallanguzhi_art.jpg": {
        "title": "Pallanguzhi",
        "subtitle": "14 Carved Pits & Cowrie Shell Sowing • Ali Guli Mane",
        "glow_color": "rgba(214, 173, 105, 0.25)",
        "plinth_bg": "linear-gradient(135deg, #3d1c06 0%, #210e02 60%, #0d0501 100%)",
        "plinth_border": "#5c2e0b",
        "inner_bg": "radial-gradient(circle at 45% 40%, #2a1304 0%, #150902 70%, #080301 100%)",
        "rot_z": -15,
        "svg": """<svg class="board-grid" viewBox="0 0 660 660">""" + COMMON_DEFS + """
          <!-- 14 Carved Cups (2 rows of 7) -->
          <g filter="url(#pieceShadow)">
          """ + "".join([f'<ellipse cx="{70 + c*86}" cy="240" rx="36" ry="46" fill="#120701" stroke="url(#goldLine)" stroke-width="3"/>' for c in range(7)]) + """
          """ + "".join([f'<ellipse cx="{70 + c*86}" cy="420" rx="36" ry="46" fill="#120701" stroke="url(#goldLine)" stroke-width="3"/>' for c in range(7)]) + """
          <!-- Shells inside cups -->
          """ + "".join([
              f'<circle cx="{62 + c*86}" cy="235" r="9" fill="url(#pieceIvory)"/>'
              f'<circle cx="{78 + c*86}" cy="245" r="9" fill="url(#pieceGold)"/>'
              f'<circle cx="{70 + c*86}" cy="250" r="8" fill="url(#pieceIvory)"/>'
              f'<circle cx="{62 + c*86}" cy="415" r="9" fill="url(#pieceGold)"/>'
              f'<circle cx="{78 + c*86}" cy="425" r="9" fill="url(#pieceIvory)"/>'
              f'<circle cx="{70 + c*86}" cy="430" r="8" fill="url(#pieceGold)"/>'
              for c in range(7)
          ]) + """
          <!-- Pasu (4 bonus seeds) highlighting cup 3 -->
          <ellipse cx="328" cy="240" rx="38" ry="48" fill="none" stroke="#FFF0D0" stroke-width="4" filter="url(#glowFilter)"/>
          <circle cx="328" cy="225" r="11" fill="url(#pieceIvory)"/>
          <circle cx="316" cy="245" r="11" fill="url(#pieceGold)"/>
          <circle cx="340" cy="245" r="11" fill="url(#pieceIvory)"/>
          <circle cx="328" cy="255" r="11" fill="url(#pieceGold)"/>
          </g>
        </svg>"""
    },

    # 3. Chowka Bara
    "game_chowka_bara_art.jpg": {
        "title": "Chowka Bara",
        "subtitle": "Concentric Loops & Safe Castle Kattas • Ashta Chamma",
        "glow_color": "rgba(214, 173, 105, 0.25)",
        "plinth_bg": "linear-gradient(135deg, #331f13 0%, #1a0f08 60%, #0d0703 100%)",
        "plinth_border": "#54331e",
        "inner_bg": "radial-gradient(circle at 40% 35%, #2b170c 0%, #150a04 70%, #0a0402 100%)",
        "rot_z": -10,
        "svg": """<svg class="board-grid" viewBox="0 0 660 660">""" + COMMON_DEFS + """
          <!-- 5x5 Grid Cells -->
          """ + "".join([f'<rect x="{50 + c*112}" y="{50 + r*112}" width="112" height="112" fill="none" stroke="url(#goldLine)" stroke-width="3"/>' for r in range(5) for c in range(5)]) + """
          <!-- Safe Kattas (X-marked squares at (0,2), (2,0), (2,2), (2,4), (4,2)) -->
          <!-- (0,2) North -->
          <line x1="274" y1="50" x2="386" y2="162" stroke="#FFF0D0" stroke-width="4"/>
          <line x1="386" y1="50" x2="274" y2="162" stroke="#FFF0D0" stroke-width="4"/>
          <!-- (2,0) West -->
          <line x1="50" y1="274" x2="162" y2="386" stroke="#FFF0D0" stroke-width="4"/>
          <line x1="162" y1="274" x2="50" y2="386" stroke="#FFF0D0" stroke-width="4"/>
          <!-- (2,2) Central Ghar -->
          <rect x="274" y="274" width="112" height="112" fill="rgba(214, 173, 105, 0.2)" stroke="#FFF0D0" stroke-width="4"/>
          <line x1="274" y1="274" x2="386" y2="386" stroke="#FFF0D0" stroke-width="4"/>
          <line x1="386" y1="274" x2="274" y2="386" stroke="#FFF0D0" stroke-width="4"/>
          <!-- (2,4) East -->
          <line x1="498" y1="274" x2="610" y2="386" stroke="#FFF0D0" stroke-width="4"/>
          <line x1="610" y1="274" x2="498" y2="386" stroke="#FFF0D0" stroke-width="4"/>
          <!-- (4,2) South -->
          <line x1="274" y1="498" x2="386" y2="610" stroke="#FFF0D0" stroke-width="4"/>
          <line x1="386" y1="498" x2="274" y2="610" stroke="#FFF0D0" stroke-width="4"/>
          <!-- Conical Pawns -->
          <circle cx="106" cy="106" r="22" fill="url(#pieceRuby)" filter="url(#pieceShadow)"/>
          <circle cx="218" cy="106" r="22" fill="url(#pieceRuby)" filter="url(#pieceShadow)"/>
          <circle cx="554" cy="554" r="22" fill="url(#pieceGold)" filter="url(#pieceShadow)"/>
          <circle cx="442" cy="554" r="22" fill="url(#pieceGold)" filter="url(#pieceShadow)"/>
          <!-- Cast Cowries in center -->
          <ellipse cx="310" cy="320" rx="14" ry="8" fill="url(#pieceIvory)" transform="rotate(30 310 320)"/>
          <ellipse cx="350" cy="320" rx="14" ry="8" fill="url(#pieceIvory)" transform="rotate(-40 350 320)"/>
          <ellipse cx="320" cy="350" rx="14" ry="8" fill="url(#pieceIvory)" transform="rotate(75 320 350)"/>
          <ellipse cx="350" cy="345" rx="14" ry="8" fill="url(#pieceIvory)" transform="rotate(10 350 345)"/>
        </svg>"""
    },

    # 4. Chaupar
    "game_chaupar_art.jpg": {
        "title": "Chaupar",
        "subtitle": "The Royal Court Classic • Pasa Dice & Joori Pairs",
        "glow_color": "rgba(214, 51, 80, 0.25)",
        "plinth_bg": "linear-gradient(135deg, #421019 0%, #21070c 60%, #0d0205 100%)",
        "plinth_border": "#6b1c2b",
        "inner_bg": "radial-gradient(circle at 45% 35%, #2e0811 0%, #170308 70%, #080104 100%)",
        "rot_z": -12,
        "svg": """<svg class="board-grid" viewBox="0 0 660 660">""" + COMMON_DEFS + """
          <!-- Cross Arms (North, South, East, West) -->
          <rect x="230" y="40" width="200" height="200" fill="none" stroke="url(#goldLine)" stroke-width="3"/>
          <rect x="230" y="420" width="200" height="200" fill="none" stroke="url(#goldLine)" stroke-width="3"/>
          <rect x="40" y="230" width="200" height="200" fill="none" stroke="url(#goldLine)" stroke-width="3"/>
          <rect x="420" y="230" width="200" height="200" fill="none" stroke="url(#goldLine)" stroke-width="3"/>
          <!-- Central Charkoni Square -->
          <rect x="230" y="230" width="200" height="200" fill="rgba(214, 173, 105, 0.25)" stroke="#FFF0D0" stroke-width="4"/>
          <!-- 3 Columns per arm -->
          <line x1="296" y1="40" x2="296" y2="240" stroke="url(#goldLine)" stroke-width="2"/>
          <line x1="363" y1="40" x2="363" y2="240" stroke="url(#goldLine)" stroke-width="2"/>
          <line x1="296" y1="420" x2="296" y2="620" stroke="url(#goldLine)" stroke-width="2"/>
          <line x1="363" y1="420" x2="363" y2="620" stroke="url(#goldLine)" stroke-width="2"/>
          <line x1="40" y1="296" x2="240" y2="296" stroke="url(#goldLine)" stroke-width="2"/>
          <line x1="40" y1="363" x2="240" y2="363" stroke="url(#goldLine)" stroke-width="2"/>
          <line x1="420" y1="296" x2="620" y2="296" stroke="url(#goldLine)" stroke-width="2"/>
          <line x1="420" y1="363" x2="620" y2="363" stroke="url(#goldLine)" stroke-width="2"/>
          <!-- Paired Joori Pawns -->
          <circle cx="330" cy="160" r="18" fill="url(#pieceRuby)" filter="url(#pieceShadow)"/>
          <circle cx="345" cy="170" r="18" fill="url(#pieceRuby)" filter="url(#pieceShadow)"/>
          <!-- 3 Long Rectangular Pasa Dice in Center -->
          <rect x="290" y="270" width="16" height="60" rx="3" fill="#FFF0D0" stroke="#8C6D3B" stroke-width="2" transform="rotate(25 290 270)"/>
          <rect x="330" y="270" width="16" height="60" rx="3" fill="#FFF0D0" stroke="#8C6D3B" stroke-width="2" transform="rotate(-15 330 270)"/>
          <rect x="365" y="280" width="16" height="60" rx="3" fill="#FFF0D0" stroke="#8C6D3B" stroke-width="2" transform="rotate(45 365 280)"/>
        </svg>"""
    },

    # 5. Twelve Beads (Baro Guti)
    "game_twelve_beads_art.jpg": {
        "title": "Twelve Beads",
        "subtitle": "Baro Guti • Tactical Flank Combat on Diamond Grid",
        "glow_color": "rgba(214, 173, 105, 0.22)",
        "plinth_bg": "linear-gradient(135deg, #2b1d14 0%, #170d07 60%, #0a0502 100%)",
        "plinth_border": "#4a301f",
        "inner_bg": "radial-gradient(circle at 45% 35%, #24140b 0%, #130a05 70%, #080301 100%)",
        "rot_z": -12,
        "svg": """<svg class="board-grid" viewBox="0 0 660 660">""" + COMMON_DEFS + """
          <!-- 5x5 Grid Lines with diagonals -->
          <rect x="130" y="130" width="400" height="400" fill="none" stroke="url(#goldLine)" stroke-width="4"/>
          <!-- Inner grid lines -->
          <line x1="230" y1="130" x2="230" y2="530" stroke="url(#goldLine)" stroke-width="3"/>
          <line x1="330" y1="130" x2="330" y2="530" stroke="url(#goldLine)" stroke-width="3"/>
          <line x1="430" y1="130" x2="430" y2="530" stroke="url(#goldLine)" stroke-width="3"/>
          <line x1="130" y1="230" x2="530" y2="230" stroke="url(#goldLine)" stroke-width="3"/>
          <line x1="130" y1="330" x2="530" y2="330" stroke="url(#goldLine)" stroke-width="3"/>
          <line x1="130" y1="430" x2="530" y2="430" stroke="url(#goldLine)" stroke-width="3"/>
          <!-- Diagonals -->
          <line x1="130" y1="130" x2="530" y2="530" stroke="url(#goldLine)" stroke-width="3"/>
          <line x1="530" y1="130" x2="130" y2="530" stroke="url(#goldLine)" stroke-width="3"/>
          <!-- Triangular Apex Camps (North and South) -->
          <polygon points="130,130 530,130 330,30" fill="none" stroke="url(#goldLine)" stroke-width="4"/>
          <line x1="330" y1="30" x2="330" y2="130" stroke="url(#goldLine)" stroke-width="3"/>
          <polygon points="130,530 530,530 330,630" fill="none" stroke="url(#goldLine)" stroke-width="4"/>
          <line x1="330" y1="530" x2="330" y2="630" stroke="url(#goldLine)" stroke-width="3"/>
          <!-- 12 Brass Beads North -->
          <circle cx="330" cy="30" r="16" fill="url(#pieceGold)" filter="url(#pieceShadow)"/>
          <circle cx="130" cy="130" r="16" fill="url(#pieceGold)" filter="url(#pieceShadow)"/>
          <circle cx="230" cy="130" r="16" fill="url(#pieceGold)" filter="url(#pieceShadow)"/>
          <circle cx="330" cy="130" r="16" fill="url(#pieceGold)" filter="url(#pieceShadow)"/>
          <circle cx="430" cy="130" r="16" fill="url(#pieceGold)" filter="url(#pieceShadow)"/>
          <circle cx="530" cy="130" r="16" fill="url(#pieceGold)" filter="url(#pieceShadow)"/>
          <circle cx="130" cy="230" r="16" fill="url(#pieceGold)" filter="url(#pieceShadow)"/>
          <circle cx="230" cy="230" r="16" fill="url(#pieceGold)" filter="url(#pieceShadow)"/>
          <circle cx="330" cy="230" r="16" fill="url(#pieceGold)" filter="url(#pieceShadow)"/>
          <circle cx="430" cy="230" r="16" fill="url(#pieceGold)" filter="url(#pieceShadow)"/>
          <circle cx="530" cy="230" r="16" fill="url(#pieceGold)" filter="url(#pieceShadow)"/>
          <!-- 12 Obsidian Beads South -->
          <circle cx="330" cy="630" r="16" fill="url(#pieceObsidian)" filter="url(#pieceShadow)"/>
          <circle cx="130" cy="530" r="16" fill="url(#pieceObsidian)" filter="url(#pieceShadow)"/>
          <circle cx="230" cy="530" r="16" fill="url(#pieceObsidian)" filter="url(#pieceShadow)"/>
          <circle cx="330" cy="530" r="16" fill="url(#pieceObsidian)" filter="url(#pieceShadow)"/>
          <circle cx="430" cy="530" r="16" fill="url(#pieceObsidian)" filter="url(#pieceShadow)"/>
          <circle cx="530" cy="530" r="16" fill="url(#pieceObsidian)" filter="url(#pieceShadow)"/>
          <circle cx="130" cy="430" r="16" fill="url(#pieceObsidian)" filter="url(#pieceShadow)"/>
          <circle cx="230" cy="430" r="16" fill="url(#pieceObsidian)" filter="url(#pieceShadow)"/>
          <circle cx="430" cy="430" r="16" fill="url(#pieceObsidian)" filter="url(#pieceShadow)"/>
          <circle cx="530" cy="430" r="16" fill="url(#pieceObsidian)" filter="url(#pieceShadow)"/>
        </svg>"""
    },

    # 6. Pretwa
    "game_pretwa_art.jpg": {
        "title": "Pretwa",
        "subtitle": "Circular Mandala Geometry • Bihar Radial Leap Tactics",
        "glow_color": "rgba(214, 173, 105, 0.24)",
        "plinth_bg": "linear-gradient(135deg, #1b2024 0%, #101316 60%, #060708 100%)",
        "plinth_border": "#313a42",
        "inner_bg": "radial-gradient(circle at 45% 35%, #151a1d 0%, #0b0e10 70%, #040506 100%)",
        "rot_z": -12,
        "svg": """<svg class="board-grid" viewBox="0 0 660 660">""" + COMMON_DEFS + """
          <!-- 3 Concentric Rings -->
          <circle cx="330" cy="330" r="280" fill="none" stroke="url(#goldLine)" stroke-width="4"/>
          <circle cx="330" cy="330" r="190" fill="none" stroke="url(#goldLine)" stroke-width="4"/>
          <circle cx="330" cy="330" r="100" fill="none" stroke="url(#goldLine)" stroke-width="4"/>
          <!-- 3 Diameters (6 Spoke Lines) -->
          <line x1="50" y1="330" x2="610" y2="330" stroke="url(#goldLine)" stroke-width="3"/>
          <line x1="190" y1="87" x2="470" y2="573" stroke="url(#goldLine)" stroke-width="3"/>
          <line x1="470" y1="87" x2="190" y2="573" stroke="url(#goldLine)" stroke-width="3"/>
          <!-- Center Node -->
          <circle cx="330" cy="330" r="12" fill="#0B0D0E" stroke="#D6AD69" stroke-width="2"/>
          <!-- Carnelian Red and Jade Green Stones -->
          <circle cx="50" cy="330" r="22" fill="url(#pieceRuby)" filter="url(#pieceShadow)"/>
          <circle cx="140" cy="330" r="22" fill="url(#pieceRuby)" filter="url(#pieceShadow)"/>
          <circle cx="230" cy="330" r="22" fill="url(#pieceRuby)" filter="url(#pieceShadow)"/>
          <circle cx="190" cy="87" r="22" fill="url(#pieceRuby)" filter="url(#pieceShadow)"/>
          <circle cx="237" cy="169" r="22" fill="url(#pieceRuby)" filter="url(#pieceShadow)"/>
          <circle cx="610" cy="330" r="22" fill="url(#pieceJade)" filter="url(#pieceShadow)"/>
          <circle cx="520" cy="330" r="22" fill="url(#pieceJade)" filter="url(#pieceShadow)"/>
          <circle cx="430" cy="330" r="22" fill="url(#pieceJade)" filter="url(#pieceShadow)"/>
          <circle cx="470" cy="573" r="22" fill="url(#pieceJade)" filter="url(#pieceShadow)"/>
          <circle cx="423" cy="491" r="22" fill="url(#pieceJade)" filter="url(#pieceShadow)"/>
        </svg>"""
    },

    # 7. Ataxx World
    "game_ataxx_art.jpg": {
        "title": "Ataxx World",
        "subtitle": "Territorial Infection & Parabolic Jumps • 7x7 Grid",
        "glow_color": "rgba(43, 125, 233, 0.28)",
        "plinth_bg": "linear-gradient(135deg, #121926 0%, #0a0d14 60%, #030408 100%)",
        "plinth_border": "#212d45",
        "inner_bg": "radial-gradient(circle at 45% 35%, #0f1624 0%, #080b12 70%, #030408 100%)",
        "rot_z": -12,
        "svg": """<svg class="board-grid" viewBox="0 0 660 660">""" + COMMON_DEFS + """
          <!-- 7x7 Grid -->
          """ + "".join([f'<rect x="{50 + c*80}" y="{50 + r*80}" width="80" height="80" fill="none" stroke="rgba(214, 173, 105, 0.3)" stroke-width="2"/>' for r in range(7) for c in range(7)]) + """
          <!-- Glowing Ruby and Sapphire Spheres -->
          <circle cx="90" cy="90" r="24" fill="url(#pieceRuby)" filter="url(#pieceShadow)"/>
          <circle cx="170" cy="90" r="24" fill="url(#pieceRuby)" filter="url(#pieceShadow)"/>
          <circle cx="90" cy="170" r="24" fill="url(#pieceRuby)" filter="url(#pieceShadow)"/>
          <circle cx="570" cy="570" r="24" fill="url(#pieceSapphire)" filter="url(#pieceShadow)"/>
          <circle cx="490" cy="570" r="24" fill="url(#pieceSapphire)" filter="url(#pieceShadow)"/>
          <!-- Parabolic Jump Trail -->
          <path d="M 170 90 Q 330 30 330 250" fill="none" stroke="#FFA8B6" stroke-width="4" stroke-dasharray="6,6" filter="url(#glowFilter)"/>
          <circle cx="330" cy="250" r="26" fill="url(#pieceRuby)" filter="url(#pieceShadow)"/>
          <!-- Converted Neighbors -->
          <circle cx="250" cy="250" r="24" fill="url(#pieceRuby)" filter="url(#glowFilter)"/>
          <circle cx="330" cy="330" r="24" fill="url(#pieceRuby)" filter="url(#glowFilter)"/>
        </svg>"""
    },

    # 8. Hex World
    "game_hex_art.jpg": {
        "title": "Hex World",
        "subtitle": "Topological Connection Across Hexagonal Grid • John Nash",
        "glow_color": "rgba(214, 173, 105, 0.28)",
        "plinth_bg": "linear-gradient(135deg, #2b1f14 0%, #17100a 60%, #0a0604 100%)",
        "plinth_border": "#4a3522",
        "inner_bg": "radial-gradient(circle at 45% 35%, #1e140c 0%, #0f0a06 70%, #060402 100%)",
        "rot_z": -12,
        "svg": """<svg class="board-grid" viewBox="0 0 660 660">""" + COMMON_DEFS + """
          <!-- Hexagonal Rhombic Honeycomb Grid -->
          <g transform="translate(110, 60)">
          """ + "".join([
              f'<polygon points="{c*40 + r*20},{r*34.6} {c*40 + r*20 + 20},{r*34.6 - 11.5} {c*40 + r*20 + 40},{r*34.6} {c*40 + r*20 + 40},{r*34.6 + 23.1} {c*40 + r*20 + 20},{r*34.6 + 34.6} {c*40 + r*20},{r*34.6 + 23.1}" fill="none" stroke="rgba(214, 173, 105, 0.4)" stroke-width="2"/>'
              for r in range(11) for c in range(11)
          ]) + """
          <!-- Golden connected path bridging North to South -->
          <polyline points="20,11.5 60,34.6 100,57.7 120,92.3 160,115.4 200,138.5 240,161.6 280,184.7 300,219.3 340,242.4 380,265.5 400,300 420,334.6" fill="none" stroke="#FFF0D0" stroke-width="6" filter="url(#glowFilter)"/>
          <!-- Gold and Ruby Stones along path -->
          <circle cx="60" cy="34.6" r="14" fill="url(#pieceGold)" filter="url(#pieceShadow)"/>
          <circle cx="100" cy="57.7" r="14" fill="url(#pieceGold)" filter="url(#pieceShadow)"/>
          <circle cx="160" cy="115.4" r="14" fill="url(#pieceGold)" filter="url(#pieceShadow)"/>
          <circle cx="240" cy="161.6" r="14" fill="url(#pieceGold)" filter="url(#pieceShadow)"/>
          <circle cx="340" cy="242.4" r="14" fill="url(#pieceGold)" filter="url(#pieceShadow)"/>
          <circle cx="420" cy="334.6" r="14" fill="url(#pieceGold)" filter="url(#pieceShadow)"/>
          <!-- Ruby blocking stones -->
          <circle cx="120" cy="40" r="14" fill="url(#pieceRuby)" filter="url(#pieceShadow)"/>
          <circle cx="220" cy="120" r="14" fill="url(#pieceRuby)" filter="url(#pieceShadow)"/>
          </g>
        </svg>"""
    },

    # 9. Quoridor World
    "game_quoridor_art.jpg": {
        "title": "Quoridor World",
        "subtitle": "Maze Navigation & Wooden Wall Blockades • 9x9 Grid",
        "glow_color": "rgba(214, 173, 105, 0.22)",
        "plinth_bg": "linear-gradient(135deg, #26160d 0%, #140b06 60%, #080402 100%)",
        "plinth_border": "#422718",
        "inner_bg": "radial-gradient(circle at 45% 35%, #1f110a 0%, #100804 70%, #060301 100%)",
        "rot_z": -12,
        "svg": """<svg class="board-grid" viewBox="0 0 660 660">""" + COMMON_DEFS + """
          <!-- 9x9 Grid with deep grooves -->
          """ + "".join([f'<rect x="{50 + c*62}" y="{50 + r*62}" width="54" height="54" rx="4" fill="#2d1910" stroke="#4a2c1d" stroke-width="2"/>' for r in range(9) for c in range(9)]) + """
          <!-- Vertical Beechwood Wall Barriers in Grooves -->
          <rect x="168" y="112" width="12" height="116" rx="3" fill="#D6AD69" stroke="#8C6D3B" stroke-width="2" filter="url(#pieceShadow)"/>
          <rect x="292" y="236" width="12" height="116" rx="3" fill="#D6AD69" stroke="#8C6D3B" stroke-width="2" filter="url(#pieceShadow)"/>
          <rect x="416" y="360" width="12" height="116" rx="3" fill="#D6AD69" stroke="#8C6D3B" stroke-width="2" filter="url(#pieceShadow)"/>
          <!-- Horizontal Wall Barriers -->
          <rect x="236" y="292" width="116" height="12" rx="3" fill="#D6AD69" stroke="#8C6D3B" stroke-width="2" filter="url(#pieceShadow)"/>
          <rect x="360" y="416" width="116" height="12" rx="3" fill="#D6AD69" stroke="#8C6D3B" stroke-width="2" filter="url(#pieceShadow)"/>
          <!-- Player Pawns -->
          <circle cx="327" cy="139" r="18" fill="url(#pieceGold)" filter="url(#pieceShadow)"/>
          <circle cx="327" cy="511" r="18" fill="url(#pieceRuby)" filter="url(#pieceShadow)"/>
        </svg>"""
    },

    # 10. Surakarta World
    "game_surakarta_art.jpg": {
        "title": "Surakarta World",
        "subtitle": "Corner Loop Rails & Arc Captures • Royal Java Classic",
        "glow_color": "rgba(214, 173, 105, 0.25)",
        "plinth_bg": "linear-gradient(135deg, #2b1c12 0%, #160d08 60%, #090503 100%)",
        "plinth_border": "#473020",
        "inner_bg": "radial-gradient(circle at 45% 35%, #21150e 0%, #110a06 70%, #070402 100%)",
        "rot_z": -12,
        "svg": """<svg class="board-grid" viewBox="0 0 660 660">""" + COMMON_DEFS + """
          <!-- 6x6 Grid Lines -->
          """ + "".join([f'<line x1="{150 + i*72}" y1="150" x2="{150 + i*72}" y2="510" stroke="url(#goldLine)" stroke-width="3"/>' for i in range(6)]) + """
          """ + "".join([f'<line x1="150" y1="{150 + j*72}" x2="510" y2="{150 + j*72}" stroke="url(#goldLine)" stroke-width="3"/>' for j in range(6)]) + """
          <!-- 8 Concentric Corner Loops -->
          <!-- Top Left Loops -->
          <path d="M 222 150 A 72 72 0 1 0 150 222" fill="none" stroke="url(#goldLine)" stroke-width="3"/>
          <path d="M 294 150 A 144 144 0 1 0 150 294" fill="none" stroke="url(#goldLine)" stroke-width="3"/>
          <!-- Top Right Loops -->
          <path d="M 510 222 A 72 72 0 1 0 438 150" fill="none" stroke="url(#goldLine)" stroke-width="3"/>
          <path d="M 510 294 A 144 144 0 1 0 366 150" fill="none" stroke="url(#goldLine)" stroke-width="3"/>
          <!-- Bottom Left Loops -->
          <path d="M 150 438 A 72 72 0 1 0 222 510" fill="none" stroke="url(#goldLine)" stroke-width="3"/>
          <path d="M 150 366 A 144 144 0 1 0 294 510" fill="none" stroke="url(#goldLine)" stroke-width="3"/>
          <!-- Bottom Right Loops -->
          <path d="M 438 510 A 72 72 0 1 0 510 438" fill="none" stroke="url(#goldLine)" stroke-width="3"/>
          <path d="M 366 510 A 144 144 0 1 0 510 366" fill="none" stroke="url(#goldLine)" stroke-width="3"/>
          <!-- Slider pieces and glide arc -->
          <circle cx="150" cy="150" r="16" fill="url(#pieceGold)" filter="url(#pieceShadow)"/>
          <circle cx="222" cy="150" r="16" fill="url(#pieceGold)" filter="url(#pieceShadow)"/>
          <circle cx="294" cy="150" r="16" fill="url(#pieceGold)" filter="url(#pieceShadow)"/>
          <circle cx="510" cy="510" r="16" fill="url(#pieceObsidian)" filter="url(#pieceShadow)"/>
          <circle cx="438" cy="510" r="16" fill="url(#pieceObsidian)" filter="url(#pieceShadow)"/>
          <!-- Gliding capture swoosh -->
          <path d="M 294 150 A 144 144 0 1 0 150 294 L 150 438" fill="none" stroke="#FFF0D0" stroke-width="4" stroke-dasharray="6,6" filter="url(#glowFilter)"/>
          <circle cx="150" cy="438" r="18" fill="url(#pieceGold)" filter="url(#glowFilter)"/>
        </svg>"""
    },

    # 11. Twelve Men's Morris
    "game_twelve_mens_morris_art.jpg": {
        "title": "Twelve Men's Morris",
        "subtitle": "Diagonal Cross Variant • 12 Pieces per Side",
        "glow_color": "rgba(214, 173, 105, 0.25)",
        "plinth_bg": "linear-gradient(135deg, #2b1810 0%, #160c08 60%, #0a0503 100%)",
        "plinth_border": "#4a2e1f",
        "inner_bg": "radial-gradient(circle at 45% 35%, #24140c 0%, #130a05 70%, #080301 100%)",
        "rot_z": -12,
        "svg": """<svg class="board-grid" viewBox="0 0 660 660">""" + COMMON_DEFS + """
          <rect x="50" y="50" width="560" height="560" fill="none" stroke="url(#goldLine)" stroke-width="4"/>
          <rect x="130" y="130" width="400" height="400" fill="none" stroke="url(#goldLine)" stroke-width="4"/>
          <rect x="210" y="210" width="240" height="240" fill="none" stroke="url(#goldLine)" stroke-width="4"/>
          <!-- Orthogonal Midpoints -->
          <line x1="330" y1="50" x2="330" y2="210" stroke="url(#goldLine)" stroke-width="4"/>
          <line x1="330" y1="450" x2="330" y2="610" stroke="url(#goldLine)" stroke-width="4"/>
          <line x1="50" y1="330" x2="210" y2="330" stroke="url(#goldLine)" stroke-width="4"/>
          <line x1="450" y1="330" x2="610" y2="330" stroke="url(#goldLine)" stroke-width="4"/>
          <!-- 4 Diagonal Corner Lines (Twelve Men's Morris Specific) -->
          <line x1="50" y1="50" x2="210" y2="210" stroke="url(#goldLine)" stroke-width="4"/>
          <line x1="610" y1="50" x2="450" y2="210" stroke="url(#goldLine)" stroke-width="4"/>
          <line x1="50" y1="610" x2="210" y2="450" stroke="url(#goldLine)" stroke-width="4"/>
          <line x1="610" y1="610" x2="450" y2="450" stroke="url(#goldLine)" stroke-width="4"/>
          <!-- Pieces Forming Diagonal Mills -->
          <circle cx="50" cy="50" r="22" fill="url(#pieceGold)" filter="url(#pieceShadow)"/>
          <circle cx="130" cy="130" r="22" fill="url(#pieceGold)" filter="url(#pieceShadow)"/>
          <circle cx="210" cy="210" r="22" fill="url(#pieceGold)" filter="url(#pieceShadow)"/>
          <circle cx="610" cy="50" r="22" fill="url(#pieceObsidian)" filter="url(#pieceShadow)"/>
          <circle cx="450" cy="210" r="22" fill="url(#pieceObsidian)" filter="url(#pieceShadow)"/>
        </svg>"""
    },

    # 12. Six Men's Morris
    "game_six_mens_morris_art.jpg": {
        "title": "Six Men's Morris",
        "subtitle": "Compact Alignment Strategy • 2 Concentric Squares",
        "glow_color": "rgba(214, 173, 105, 0.22)",
        "plinth_bg": "linear-gradient(135deg, #2b1810 0%, #160c08 60%, #0a0503 100%)",
        "plinth_border": "#4a2e1f",
        "inner_bg": "radial-gradient(circle at 45% 35%, #24140c 0%, #130a05 70%, #080301 100%)",
        "rot_z": -12,
        "svg": """<svg class="board-grid" viewBox="0 0 660 660">""" + COMMON_DEFS + """
          <!-- 2 Concentric Squares (16 nodes) -->
          <rect x="90" y="90" width="480" height="480" fill="none" stroke="url(#goldLine)" stroke-width="5"/>
          <rect x="190" y="190" width="280" height="280" fill="none" stroke="url(#goldLine)" stroke-width="5"/>
          <!-- Midpoint Cross Lines -->
          <line x1="330" y1="90" x2="330" y2="190" stroke="url(#goldLine)" stroke-width="5"/>
          <line x1="330" y1="470" x2="330" y2="570" stroke="url(#goldLine)" stroke-width="5"/>
          <line x1="90" y1="330" x2="190" y2="330" stroke="url(#goldLine)" stroke-width="5"/>
          <line x1="470" y1="330" x2="570" y2="330" stroke="url(#goldLine)" stroke-width="5"/>
          <!-- Pieces -->
          <circle cx="90" cy="90" r="26" fill="url(#pieceGold)" filter="url(#pieceShadow)"/>
          <circle cx="330" cy="90" r="26" fill="url(#pieceGold)" filter="url(#pieceShadow)"/>
          <circle cx="570" cy="90" r="26" fill="url(#pieceGold)" filter="url(#pieceShadow)"/>
          <circle cx="190" cy="190" r="26" fill="url(#pieceObsidian)" filter="url(#pieceShadow)"/>
          <circle cx="470" cy="470" r="26" fill="url(#pieceObsidian)" filter="url(#pieceShadow)"/>
        </svg>"""
    },

    # 13. Morabaraba
    "game_morabaraba_art.jpg": {
        "title": "Morabaraba",
        "subtitle": "Traditional Southern African Cow Alignment • Umlabalaba",
        "glow_color": "rgba(214, 150, 70, 0.25)",
        "plinth_bg": "linear-gradient(135deg, #381e0d 0%, #1c0e05 60%, #0d0601 100%)",
        "plinth_border": "#542e14",
        "inner_bg": "radial-gradient(circle at 45% 35%, #291508 0%, #140903 70%, #080301 100%)",
        "rot_z": -12,
        "svg": """<svg class="board-grid" viewBox="0 0 660 660">""" + COMMON_DEFS + """
          <rect x="50" y="50" width="560" height="560" fill="none" stroke="url(#goldLine)" stroke-width="4"/>
          <rect x="130" y="130" width="400" height="400" fill="none" stroke="url(#goldLine)" stroke-width="4"/>
          <rect x="210" y="210" width="240" height="240" fill="none" stroke="url(#goldLine)" stroke-width="4"/>
          <!-- Diagonals & Crosses -->
          <line x1="330" y1="50" x2="330" y2="210" stroke="url(#goldLine)" stroke-width="4"/>
          <line x1="330" y1="450" x2="330" y2="610" stroke="url(#goldLine)" stroke-width="4"/>
          <line x1="50" y1="330" x2="210" y2="330" stroke="url(#goldLine)" stroke-width="4"/>
          <line x1="450" y1="330" x2="610" y2="330" stroke="url(#goldLine)" stroke-width="4"/>
          <line x1="50" y1="50" x2="210" y2="210" stroke="url(#goldLine)" stroke-width="4"/>
          <line x1="610" y1="50" x2="450" y2="210" stroke="url(#goldLine)" stroke-width="4"/>
          <line x1="50" y1="610" x2="210" y2="450" stroke="url(#goldLine)" stroke-width="4"/>
          <line x1="610" y1="610" x2="450" y2="450" stroke="url(#goldLine)" stroke-width="4"/>
          <!-- Cow tokens with horn crests -->
          <circle cx="50" cy="50" r="24" fill="url(#pieceGold)" filter="url(#pieceShadow)"/>
          <circle cx="330" cy="50" r="24" fill="url(#pieceGold)" filter="url(#pieceShadow)"/>
          <circle cx="610" cy="50" r="24" fill="url(#pieceGold)" filter="url(#pieceShadow)"/>
          <circle cx="130" cy="130" r="24" fill="url(#pieceIvory)" filter="url(#pieceShadow)"/>
          <circle cx="530" cy="530" r="24" fill="url(#pieceIvory)" filter="url(#pieceShadow)"/>
          <!-- Flying leap indicator -->
          <path d="M 130 130 Q 330 180 450 330" fill="none" stroke="#FFF0D0" stroke-width="3" stroke-dasharray="5,5" filter="url(#glowFilter)"/>
        </svg>"""
    },

    # 14. Hashi World
    "game_hashi_world_art.jpg": {
        "title": "Hashi World",
        "subtitle": "Islands & Bridges • Nikoli Pure Network Logic",
        "glow_color": "rgba(43, 125, 233, 0.25)",
        "plinth_bg": "linear-gradient(135deg, #0e1724 0%, #070c14 60%, #020408 100%)",
        "plinth_border": "#1c2e47",
        "inner_bg": "radial-gradient(circle at 45% 35%, #09121c 0%, #04080e 70%, #010306 100%)",
        "rot_z": -12,
        "svg": """<svg class="board-grid" viewBox="0 0 660 660">""" + COMMON_DEFS + """
          <!-- Bridges (Single & Double Golden Beams) -->
          <!-- Double Bridge (100,100) to (330,100) -->
          <line x1="100" y1="96" x2="330" y2="96" stroke="#D6AD69" stroke-width="3"/>
          <line x1="100" y1="104" x2="330" y2="104" stroke="#D6AD69" stroke-width="3"/>
          <!-- Single Bridge (330,100) to (560,100) -->
          <line x1="330" y1="100" x2="560" y2="100" stroke="#D6AD69" stroke-width="4"/>
          <!-- Double Bridge (100,100) to (100,330) -->
          <line x1="96" y1="100" x2="96" y2="330" stroke="#D6AD69" stroke-width="3"/>
          <line x1="104" y1="100" x2="104" y2="330" stroke="#D6AD69" stroke-width="3"/>
          <!-- Double Bridge (330,100) to (330,560) -->
          <line x1="326" y1="100" x2="326" y2="560" stroke="#D6AD69" stroke-width="3"/>
          <line x1="334" y1="100" x2="334" y2="560" stroke="#D6AD69" stroke-width="3"/>
          <!-- Islands with Degree Numbers -->
          <circle cx="100" cy="100" r="38" fill="#1C2E47" stroke="url(#goldLine)" stroke-width="4" filter="url(#pieceShadow)"/>
          <text x="100" y="112" text-anchor="middle" fill="#F4E9D4" font-size="34" font-weight="700">4</text>
          
          <circle cx="330" cy="100" r="38" fill="#1C2E47" stroke="url(#goldLine)" stroke-width="4" filter="url(#pieceShadow)"/>
          <text x="330" y="112" text-anchor="middle" fill="#F4E9D4" font-size="34" font-weight="700">5</text>
          
          <circle cx="560" cy="100" r="38" fill="#1C2E47" stroke="url(#goldLine)" stroke-width="4" filter="url(#pieceShadow)"/>
          <text x="560" y="112" text-anchor="middle" fill="#F4E9D4" font-size="34" font-weight="700">2</text>
          
          <circle cx="100" cy="330" r="38" fill="#1C2E47" stroke="url(#goldLine)" stroke-width="4" filter="url(#pieceShadow)"/>
          <text x="100" y="342" text-anchor="middle" fill="#F4E9D4" font-size="34" font-weight="700">3</text>
          
          <circle cx="330" cy="560" r="38" fill="#1C2E47" stroke="url(#goldLine)" stroke-width="4" filter="url(#pieceShadow)"/>
          <text x="330" y="572" text-anchor="middle" fill="#F4E9D4" font-size="34" font-weight="700">4</text>
        </svg>"""
    },

    # 15. Abalone World
    "game_abalone_world_art.jpg": {
        "title": "Abalone World",
        "subtitle": "Hexagonal Sumo Marbles • Sumito Push Tactics",
        "glow_color": "rgba(214, 173, 105, 0.22)",
        "plinth_bg": "linear-gradient(135deg, #1f2329 0%, #111417 60%, #060708 100%)",
        "plinth_border": "#373e47",
        "inner_bg": "radial-gradient(circle at 45% 35%, #161a1e 0%, #0c0e11 70%, #040506 100%)",
        "rot_z": -12,
        "svg": """<svg class="board-grid" viewBox="0 0 660 660">""" + COMMON_DEFS + """
          <!-- Hexagonal Outer Rim -->
          <polygon points="330,60 570,195 570,465 330,600 90,465 90,195" fill="none" stroke="url(#goldLine)" stroke-width="6"/>
          <!-- 61 Circular Dimples -->
          """ + "".join([
              f'<circle cx="{330 + (c - 4)*48 + (r - 4)*24}" cy="{160 + r*42}" r="14" fill="#0A0C0E" stroke="rgba(214, 173, 105, 0.4)" stroke-width="2"/>'
              for r in range(9) for c in range(max(0, 4-r), min(9, 13-r))
          ]) + """
          <!-- 3-against-2 Sumito Push (Obsidian pushing White Pearl) -->
          <circle cx="282" cy="328" r="20" fill="url(#pieceObsidian)" filter="url(#pieceShadow)"/>
          <circle cx="330" cy="328" r="20" fill="url(#pieceObsidian)" filter="url(#pieceShadow)"/>
          <circle cx="378" cy="328" r="20" fill="url(#pieceObsidian)" filter="url(#pieceShadow)"/>
          <circle cx="426" cy="328" r="20" fill="url(#pieceIvory)" filter="url(#pieceShadow)"/>
          <circle cx="474" cy="328" r="20" fill="url(#pieceIvory)" filter="url(#pieceShadow)"/>
          <!-- Push arrow -->
          <path d="M 230 328 L 520 328" fill="none" stroke="#FFF0D0" stroke-width="4" stroke-dasharray="8,6" filter="url(#glowFilter)"/>
        </svg>"""
    },

    # 16. RealmForge
    "game_realmforge_art.jpg": {
        "title": "RealmForge",
        "subtitle": "Procedural Strategy Engine • Mantrika Original",
        "glow_color": "rgba(214, 173, 105, 0.28)",
        "plinth_bg": "linear-gradient(135deg, #2b1f14 0%, #160f08 60%, #090503 100%)",
        "plinth_border": "#4a3520",
        "inner_bg": "radial-gradient(circle at 45% 35%, #1f140c 0%, #0e0905 70%, #050302 100%)",
        "rot_z": -12,
        "svg": """<svg class="board-grid" viewBox="0 0 660 660">""" + COMMON_DEFS + """
          <!-- Procedural Hexagon Landscape -->
          <g transform="translate(80, 80)">
          """ + "".join([
              f'<polygon points="{c*60 + (r%2)*30},{r*52} {c*60 + (r%2)*30 + 30},{r*52 - 17} {c*60 + (r%2)*30 + 60},{r*52} {c*60 + (r%2)*30 + 60},{r*52 + 35} {c*60 + (r%2)*30 + 30},{r*52 + 52} {c*60 + (r%2)*30},{r*52 + 35}" fill="rgba(214, 173, 105, {0.1 + ((r*c)%5)*0.08})" stroke="url(#goldLine)" stroke-width="2"/>'
              for r in range(9) for c in range(8)
          ]) + """
          <!-- Golden Compass Rose in Center -->
          <circle cx="240" cy="220" r="90" fill="none" stroke="#FFF0D0" stroke-width="2" stroke-dasharray="6,4"/>
          <polygon points="240,110 252,220 240,205 228,220" fill="url(#goldLine)"/>
          <polygon points="240,330 252,220 240,235 228,220" fill="url(#goldLine)"/>
          <polygon points="130,220 240,232 225,220 240,208" fill="url(#goldLine)"/>
          <polygon points="350,220 240,232 255,220 240,208" fill="url(#goldLine)"/>
          </g>
        </svg>"""
    },

    # 17. Chai-Chudi
    "game_chai_chudi_art.jpg": {
        "title": "Chai-Chudi",
        "subtitle": "Traditional Deccan Bangle & Seed Strategy",
        "glow_color": "rgba(214, 51, 80, 0.25)",
        "plinth_bg": "linear-gradient(135deg, #3d101a 0%, #1f070c 60%, #0d0205 100%)",
        "plinth_border": "#5c1b29",
        "inner_bg": "radial-gradient(circle at 45% 35%, #2a0810 0%, #140307 70%, #080104 100%)",
        "rot_z": -12,
        "svg": """<svg class="board-grid" viewBox="0 0 660 660">""" + COMMON_DEFS + """
          <!-- Rangoli Mandala Board -->
          <circle cx="330" cy="330" r="260" fill="none" stroke="url(#goldLine)" stroke-width="4"/>
          <circle cx="330" cy="330" r="180" fill="none" stroke="url(#goldLine)" stroke-width="3" stroke-dasharray="8,6"/>
          <!-- Colorful Glass Bangle Rings -->
          <circle cx="240" cy="240" r="60" fill="none" stroke="#38A169" stroke-width="12" filter="url(#pieceShadow)"/>
          <circle cx="420" cy="240" r="60" fill="none" stroke="#D63350" stroke-width="12" filter="url(#pieceShadow)"/>
          <circle cx="330" cy="390" r="60" fill="none" stroke="#D6AD69" stroke-width="12" filter="url(#pieceShadow)"/>
          <!-- Sacred Seeds Inside Bangles -->
          <circle cx="230" cy="235" r="10" fill="url(#pieceGold)"/>
          <circle cx="250" cy="245" r="10" fill="url(#pieceIvory)"/>
          <circle cx="410" cy="235" r="10" fill="url(#pieceGold)"/>
          <circle cx="430" cy="245" r="10" fill="url(#pieceIvory)"/>
          <circle cx="320" cy="385" r="10" fill="url(#pieceGold)"/>
          <circle cx="340" cy="395" r="10" fill="url(#pieceIvory)"/>
        </svg>"""
    },

    # 18. Mastermind World
    "game_mastermind_world_art.jpg": {
        "title": "Mastermind World",
        "subtitle": "Deduction, Permutations & Code-Breaking",
        "glow_color": "rgba(214, 173, 105, 0.22)",
        "plinth_bg": "linear-gradient(135deg, #2b1d14 0%, #160d08 60%, #0a0503 100%)",
        "plinth_border": "#4a3220",
        "inner_bg": "radial-gradient(circle at 45% 35%, #21150e 0%, #110a06 70%, #060302 100%)",
        "rot_z": -12,
        "svg": """<svg class="board-grid" viewBox="0 0 660 660">""" + COMMON_DEFS + """
          <!-- Hardwood Deduction Rows -->
          """ + "".join([
              f'<rect x="100" y="{80 + r*72}" width="460" height="54" rx="10" fill="#150a04" stroke="url(#goldLine)" stroke-width="2"/>'
              f'<circle cx="160" cy="{107 + r*72}" r="18" fill="url(#pieceRuby)" filter="url(#pieceShadow)"/>'
              f'<circle cx="230" cy="{107 + r*72}" r="18" fill="url(#pieceSapphire)" filter="url(#pieceShadow)"/>'
              f'<circle cx="300" cy="{107 + r*72}" r="18" fill="url(#pieceGold)" filter="url(#pieceShadow)"/>'
              f'<circle cx="370" cy="{107 + r*72}" r="18" fill="url(#pieceJade)" filter="url(#pieceShadow)"/>'
              f'<circle cx="460" cy="{98 + r*72}" r="7" fill="#000"/>'
              f'<circle cx="480" cy="{98 + r*72}" r="7" fill="#FFF"/>'
              f'<circle cx="460" cy="{116 + r*72}" r="7" fill="#FFF"/>'
              f'<circle cx="480" cy="{116 + r*72}" r="7" fill="#000"/>'
              for r in range(7)
          ]) + """
          <!-- Shielded Code Chamber at Top -->
          <rect x="80" y="20" width="500" height="45" rx="8" fill="#3d2112" stroke="#D6AD69" stroke-width="3"/>
          <text x="330" y="50" text-anchor="middle" fill="#D6AD69" font-size="20" letter-spacing="4">SECRET CIPHER CHAMBER</text>
        </svg>"""
    },

    # 19. Klotski World
    "game_klotski_world_art.jpg": {
        "title": "Klotski World",
        "subtitle": "Ancient Sliding-Block Escapes • Huarong Dao",
        "glow_color": "rgba(214, 173, 105, 0.24)",
        "plinth_bg": "linear-gradient(135deg, #331f13 0%, #1a0f08 60%, #0d0703 100%)",
        "plinth_border": "#54331e",
        "inner_bg": "radial-gradient(circle at 45% 35%, #24140b 0%, #120904 70%, #070301 100%)",
        "rot_z": -12,
        "svg": """<svg class="board-grid" viewBox="0 0 660 660">""" + COMMON_DEFS + """
          <!-- Hardwood Sliding Blocks (4x5 grid layout) -->
          <!-- 2x2 Master Block (Cao Cao) -->
          <rect x="230" y="70" width="200" height="200" rx="12" fill="url(#pieceGold)" stroke="#FFF0D0" stroke-width="3" filter="url(#pieceShadow)"/>
          <text x="330" y="185" text-anchor="middle" fill="#3D2112" font-size="36" font-weight="800">MASTER</text>
          
          <!-- 1x2 Vertical Blocks (Generals) -->
          <rect x="110" y="70" width="100" height="200" rx="10" fill="#3D2112" stroke="#D6AD69" stroke-width="2" filter="url(#pieceShadow)"/>
          <rect x="450" y="70" width="100" height="200" rx="10" fill="#3D2112" stroke="#D6AD69" stroke-width="2" filter="url(#pieceShadow)"/>
          <rect x="110" y="290" width="100" height="200" rx="10" fill="#3D2112" stroke="#D6AD69" stroke-width="2" filter="url(#pieceShadow)"/>
          <rect x="450" y="290" width="100" height="200" rx="10" fill="#3D2112" stroke="#D6AD69" stroke-width="2" filter="url(#pieceShadow)"/>
          
          <!-- 2x1 Horizontal Block -->
          <rect x="230" y="290" width="200" height="90" rx="10" fill="#542e17" stroke="#D6AD69" stroke-width="2" filter="url(#pieceShadow)"/>
          
          <!-- 1x1 Small Blocks (Soldiers) -->
          <rect x="230" y="400" width="90" height="90" rx="8" fill="#6e3c1e" stroke="#D6AD69" stroke-width="2" filter="url(#pieceShadow)"/>
          <rect x="340" y="400" width="90" height="90" rx="8" fill="#6e3c1e" stroke="#D6AD69" stroke-width="2" filter="url(#pieceShadow)"/>
          
          <!-- Bottom Exit Gate -->
          <rect x="230" y="590" width="200" height="15" fill="#D6AD69" filter="url(#glowFilter)"/>
        </svg>"""
    },

    # 20. Sokoban World
    "game_sokoban_world_art.jpg": {
        "title": "Sokoban World",
        "subtitle": "The Definitive Warehouse Storage Puzzle",
        "glow_color": "rgba(214, 173, 105, 0.22)",
        "plinth_bg": "linear-gradient(135deg, #2b2014 0%, #161008 60%, #0a0603 100%)",
        "plinth_border": "#4a3820",
        "inner_bg": "radial-gradient(circle at 45% 35%, #1a140d 0%, #0d0a06 70%, #050402 100%)",
        "rot_z": -12,
        "svg": """<svg class="board-grid" viewBox="0 0 660 660">""" + COMMON_DEFS + """
          <!-- Warehouse Stone Tiles -->
          """ + "".join([f'<rect x="{60 + c*68}" y="{60 + r*68}" width="64" height="64" rx="4" fill="#18130e" stroke="#33261a" stroke-width="2"/>' for r in range(8) for c in range(8)]) + """
          <!-- Target Pressure Plates (Golden Circles) -->
          <circle cx="366" cy="230" r="22" fill="none" stroke="#D6AD69" stroke-width="4" stroke-dasharray="6,4"/>
          <circle cx="434" cy="230" r="22" fill="none" stroke="#D6AD69" stroke-width="4" stroke-dasharray="6,4"/>
          <circle cx="502" cy="230" r="22" fill="none" stroke="#D6AD69" stroke-width="4" stroke-dasharray="6,4"/>
          <!-- Wooden Storage Crates with Brass Straps -->
          <rect x="200" y="266" width="56" height="56" rx="6" fill="#542e17" stroke="#D6AD69" stroke-width="3" filter="url(#pieceShadow)"/>
          <line x1="200" y1="266" x2="256" y2="322" stroke="#8C6D3B" stroke-width="2"/>
          <line x1="256" y1="266" x2="200" y2="322" stroke="#8C6D3B" stroke-width="2"/>
          <rect x="268" y="334" width="56" height="56" rx="6" fill="#542e17" stroke="#D6AD69" stroke-width="3" filter="url(#pieceShadow)"/>
          <line x1="268" y1="334" x2="324" y2="390" stroke="#8C6D3B" stroke-width="2"/>
          <line x1="324" y1="334" x2="268" y2="390" stroke="#8C6D3B" stroke-width="2"/>
          <!-- Warehouse Keeper Token -->
          <circle cx="164" cy="366" r="20" fill="url(#pieceGold)" filter="url(#pieceShadow)"/>
        </svg>"""
    },

    # 21. Hive World
    "game_hive_world_art.jpg": {
        "title": "Hive World",
        "subtitle": "Gridless Insect Surrounding Strategy",
        "glow_color": "rgba(214, 173, 105, 0.28)",
        "plinth_bg": "linear-gradient(135deg, #1f2329 0%, #111417 60%, #060708 100%)",
        "plinth_border": "#373e47",
        "inner_bg": "radial-gradient(circle at 45% 35%, #161a1e 0%, #0c0e11 70%, #040506 100%)",
        "rot_z": -12,
        "svg": """<svg class="board-grid" viewBox="0 0 660 660">""" + COMMON_DEFS + """
          <!-- Bakelite Hexagonal Bug Tiles -->
          <!-- Center Queen Bee (Gold) -->
          <polygon points="330,280 375,305 375,355 330,380 285,355 285,305" fill="#D6AD69" stroke="#FFF0D0" stroke-width="4" filter="url(#pieceShadow)"/>
          <text x="330" y="338" text-anchor="middle" font-size="28">👑</text>
          
          <!-- Surrounding Black Obsidian Ants & Beetles -->
          <polygon points="330,190 375,215 375,265 330,290 285,265 285,215" fill="#1A1D20" stroke="#D6AD69" stroke-width="3" filter="url(#pieceShadow)"/>
          <text x="330" y="248" text-anchor="middle" font-size="26">🐜</text>
          
          <polygon points="410,235 455,260 455,310 410,335 365,310 365,260" fill="#1A1D20" stroke="#D6AD69" stroke-width="3" filter="url(#pieceShadow)"/>
          <text x="410" y="293" text-anchor="middle" font-size="26">🕷️</text>
          
          <polygon points="410,325 455,350 455,400 410,425 365,400 365,350" fill="#1A1D20" stroke="#D6AD69" stroke-width="3" filter="url(#pieceShadow)"/>
          <text x="410" y="383" text-anchor="middle" font-size="26">🦗</text>
          
          <polygon points="250,235 295,260 295,310 250,335 205,310 205,260" fill="#FAF6EE" stroke="#D6AD69" stroke-width="3" filter="url(#pieceShadow)"/>
          <text x="250" y="293" text-anchor="middle" font-size="26">🪲</text>
          
          <polygon points="250,325 295,350 295,400 250,425 205,400 205,350" fill="#FAF6EE" stroke="#D6AD69" stroke-width="3" filter="url(#pieceShadow)"/>
          <text x="250" y="383" text-anchor="middle" font-size="26">🐜</text>
        </svg>"""
    },

    # 22. Onitama World
    "game_onitama_world_art.jpg": {
        "title": "Onitama World",
        "subtitle": "Martial Arts Movement on 5x5 Shrine Courtyard",
        "glow_color": "rgba(214, 173, 105, 0.22)",
        "plinth_bg": "linear-gradient(135deg, #2b1f14 0%, #17100a 60%, #0a0604 100%)",
        "plinth_border": "#4a3522",
        "inner_bg": "radial-gradient(circle at 45% 35%, #1e140c 0%, #0f0a06 70%, #060402 100%)",
        "rot_z": -12,
        "svg": """<svg class="board-grid" viewBox="0 0 660 660">""" + COMMON_DEFS + """
          <!-- 5x5 Shrine Stone Grid -->
          """ + "".join([f'<rect x="{80 + c*100}" y="{80 + r*100}" width="96" height="96" rx="8" fill="#1c130b" stroke="url(#goldLine)" stroke-width="2"/>' for r in range(5) for c in range(5)]) + """
          <!-- Shrine Arches at (0,2) and (4,2) -->
          <rect x="280" y="80" width="96" height="96" fill="rgba(214, 173, 105, 0.2)" stroke="#FFF0D0" stroke-width="3"/>
          <text x="328" y="140" text-anchor="middle" fill="#FFF0D0" font-size="24">⛩️</text>
          <rect x="280" y="480" width="96" height="96" fill="rgba(214, 173, 105, 0.2)" stroke="#FFF0D0" stroke-width="3"/>
          <text x="328" y="540" text-anchor="middle" fill="#FFF0D0" font-size="24">⛩️</text>
          <!-- Master and Disciple Figures -->
          <circle cx="328" cy="128" r="24" fill="url(#pieceRuby)" filter="url(#pieceShadow)"/>
          <circle cx="328" cy="528" r="24" fill="url(#pieceGold)" filter="url(#pieceShadow)"/>
          <circle cx="128" cy="128" r="18" fill="url(#pieceRuby)" filter="url(#pieceShadow)"/>
          <circle cx="528" cy="128" r="18" fill="url(#pieceRuby)" filter="url(#pieceShadow)"/>
          <circle cx="128" cy="528" r="18" fill="url(#pieceGold)" filter="url(#pieceShadow)"/>
          <circle cx="528" cy="528" r="18" fill="url(#pieceGold)" filter="url(#pieceShadow)"/>
          <!-- Scroll Cards (Tiger & Dragon) -->
          <rect x="180" y="290" width="130" height="80" rx="6" fill="#FAF6EE" stroke="#8C6D3B" stroke-width="2" filter="url(#pieceShadow)"/>
          <text x="245" y="338" text-anchor="middle" fill="#3D2112" font-size="16" font-weight="700">TIGER</text>
          <rect x="350" y="290" width="130" height="80" rx="6" fill="#FAF6EE" stroke="#8C6D3B" stroke-width="2" filter="url(#pieceShadow)"/>
          <text x="415" y="338" text-anchor="middle" fill="#3D2112" font-size="16" font-weight="700">DRAGON</text>
        </svg>"""
    },

    # 23. Tak World
    "game_tak_world_art.jpg": {
        "title": "Tak World",
        "subtitle": "A Beautiful 3D Road-Building Game",
        "glow_color": "rgba(214, 173, 105, 0.25)",
        "plinth_bg": "linear-gradient(135deg, #331f13 0%, #1a0f08 60%, #0d0703 100%)",
        "plinth_border": "#54331e",
        "inner_bg": "radial-gradient(circle at 45% 35%, #24140b 0%, #120904 70%, #070301 100%)",
        "rot_z": -12,
        "svg": """<svg class="board-grid" viewBox="0 0 660 660">""" + COMMON_DEFS + """
          <!-- 5x5 Diamond Inset Board -->
          """ + "".join([f'<rect x="{70 + c*104}" y="{70 + r*104}" width="100" height="100" rx="6" fill="#1b0e06" stroke="url(#goldLine)" stroke-width="2"/>' for r in range(5) for c in range(5)]) + """
          <!-- Flat Stones forming a Road -->
          <rect x="85" y="293" width="70" height="70" rx="6" fill="url(#pieceGold)" filter="url(#pieceShadow)"/>
          <rect x="189" y="293" width="70" height="70" rx="6" fill="url(#pieceGold)" filter="url(#pieceShadow)"/>
          <rect x="293" y="293" width="70" height="70" rx="6" fill="url(#pieceGold)" filter="url(#pieceShadow)"/>
          <rect x="397" y="293" width="70" height="70" rx="6" fill="url(#pieceGold)" filter="url(#pieceShadow)"/>
          <rect x="501" y="293" width="70" height="70" rx="6" fill="url(#pieceGold)" filter="url(#pieceShadow)"/>
          <!-- Standing Wall (Standing Flat Stone) -->
          <rect x="323" y="180" width="16" height="70" rx="3" fill="#D6AD69" stroke="#FFF0D0" stroke-width="2" filter="url(#pieceShadow)"/>
          <!-- Ornate Towering Capstone -->
          <circle cx="293" cy="328" r="24" fill="url(#pieceRuby)" stroke="#FFF0D0" stroke-width="3" filter="url(#glowFilter)"/>
        </svg>"""
    },

    # 24. Pylos World
    "game_pylos_world_art.jpg": {
        "title": "Pylos World",
        "subtitle": "3D Sphere Pyramid Stacking & Conservation",
        "glow_color": "rgba(214, 173, 105, 0.28)",
        "plinth_bg": "linear-gradient(135deg, #331f13 0%, #1a0f08 60%, #0d0703 100%)",
        "plinth_border": "#54331e",
        "inner_bg": "radial-gradient(circle at 45% 35%, #24140b 0%, #120904 70%, #070301 100%)",
        "rot_z": -12,
        "svg": """<svg class="board-grid" viewBox="0 0 660 660">""" + COMMON_DEFS + """
          <!-- 4x4 Base Depressions -->
          """ + "".join([f'<circle cx="{150 + c*120}" cy="{150 + r*120}" r="40" fill="#0D0603" stroke="url(#goldLine)" stroke-width="3"/>' for r in range(4) for c in range(4)]) + """
          <!-- Layer 1 Spheres (Light & Dark Wood) -->
          <circle cx="150" cy="150" r="38" fill="url(#pieceGold)" filter="url(#pieceShadow)"/>
          <circle cx="270" cy="150" r="38" fill="url(#pieceObsidian)" filter="url(#pieceShadow)"/>
          <circle cx="150" cy="270" r="38" fill="url(#pieceObsidian)" filter="url(#pieceShadow)"/>
          <circle cx="270" cy="270" r="38" fill="url(#pieceGold)" filter="url(#pieceShadow)"/>
          <!-- Layer 2 Stacking Sphere resting atop 4 spheres -->
          <circle cx="210" cy="210" r="42" fill="url(#pieceGold)" stroke="#FFF0D0" stroke-width="3" filter="url(#glowFilter)"/>
        </svg>"""
    },

    # 25. Living World
    "game_living_world_art.jpg": {
        "title": "Living World",
        "subtitle": "Dynamic Ecological Simulation Strategy • Mantrika Original",
        "glow_color": "rgba(56, 161, 105, 0.28)",
        "plinth_bg": "linear-gradient(135deg, #102419 0%, #07140d 60%, #020704 100%)",
        "plinth_border": "#1c4731",
        "inner_bg": "radial-gradient(circle at 45% 35%, #0d2116 0%, #06120b 70%, #020604 100%)",
        "rot_z": -12,
        "svg": """<svg class="board-grid" viewBox="0 0 660 660">""" + COMMON_DEFS + """
          <!-- Bioluminescent Cellular Lattice -->
          """ + "".join([
              f'<circle cx="{c*70 + (r%2)*35 + 50}" cy="{r*60 + 50}" r="22" fill="rgba(56, 161, 105, {0.15 + ((r*c)%4)*0.15})" stroke="#38A169" stroke-width="2"/>'
              for r in range(10) for c in range(9)
          ]) + """
          <!-- Neural Energy Pulses and Filaments -->
          <path d="M 120 110 Q 250 200 330 330 T 540 510" fill="none" stroke="#C2F5D6" stroke-width="5" filter="url(#glowFilter)"/>
          <circle cx="330" cy="330" r="32" fill="url(#pieceJade)" filter="url(#glowFilter)"/>
          <circle cx="250" cy="200" r="26" fill="url(#pieceJade)" filter="url(#glowFilter)"/>
          <circle cx="430" cy="420" r="26" fill="url(#pieceJade)" filter="url(#glowFilter)"/>
        </svg>"""
    },

    # 26. Moksha Patam
    "game_moksha_patam_art.jpg": {
        "title": "Moksha Patam",
        "subtitle": "The Philosophical Ladder of Destiny • Gyan Chaupar",
        "glow_color": "rgba(214, 173, 105, 0.28)",
        "plinth_bg": "linear-gradient(135deg, #331f13 0%, #1a0f08 60%, #0d0703 100%)",
        "plinth_border": "#54331e",
        "inner_bg": "radial-gradient(circle at 45% 35%, #24140b 0%, #120904 70%, #070301 100%)",
        "rot_z": -12,
        "svg": """<svg class="board-grid" viewBox="0 0 660 660">""" + COMMON_DEFS + """
          <!-- Numbered Path Squares (Vedic Mandala Grid) -->
          """ + "".join([f'<rect x="{60 + c*77}" y="{60 + r*77}" width="77" height="77" fill="none" stroke="url(#goldLine)" stroke-width="2"/>' for r in range(7) for c in range(7)]) + """
          <!-- Golden Ladder of Virtue ascending -->
          <line x1="175" y1="520" x2="330" y2="210" stroke="#FFF0D0" stroke-width="6" filter="url(#glowFilter)"/>
          <line x1="195" y1="520" x2="350" y2="210" stroke="#FFF0D0" stroke-width="6" filter="url(#glowFilter)"/>
          <!-- Ladder rungs -->
          """ + "".join([f'<line x1="{175 + i*22}" y1="{520 - i*44}" x2="{195 + i*22}" y2="{520 - i*44}" stroke="#FFF0D0" stroke-width="4"/>' for i in range(8)]) + """
          <!-- Coiled Serpent of Karma descending -->
          <path d="M 480 140 Q 420 250 500 350 T 400 520" fill="none" stroke="#D63350" stroke-width="8" filter="url(#pieceShadow)"/>
          <circle cx="480" cy="140" r="14" fill="#FFA8B6"/>
          <!-- Moksha Lotus at Square 100 (Top Center) -->
          <circle cx="330" cy="98" r="24" fill="url(#pieceGold)" filter="url(#glowFilter)"/>
          <text x="330" y="106" text-anchor="middle" fill="#3D2112" font-size="22">🕉️</text>
        </svg>"""
    }
}

def render_all():
    print(f"Starting artwork generation for {len(GAMES)} games...")
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    for filename, config in GAMES.items():
        out_path = os.path.join(OUTPUT_DIR, filename)
        print(f"Generating {filename} ({config['title']})...")
        
        html_code = HTML_TEMPLATE.format(
            title=config['title'],
            subtitle=config['subtitle'],
            glow_color=config['glow_color'],
            plinth_bg=config['plinth_bg'],
            plinth_border=config['plinth_border'],
            inner_bg=config['inner_bg'],
            rot_z=config['rot_z'],
            svg_content=config['svg']
        )
        
        with open(TEMP_HTML, "w", encoding="utf-8") as f:
            f.write(html_code)
            
        cmd = [
            CHROME_BIN,
            "--headless=new",
            f"--screenshot={out_path}",
            "--window-size=1200,900",
            f"file://{TEMP_HTML}"
        ]
        
        subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        if os.path.exists(out_path):
            size_kb = os.path.getsize(out_path) // 1024
            print(f"  ✓ Successfully rendered: {out_path} ({size_kb} KB)")
        else:
            print(f"  ✗ Failed to render: {out_path}")
            
    if os.path.exists(TEMP_HTML):
        os.remove(TEMP_HTML)
        
    print("\nAll game artworks successfully generated and saved to assets/images/!")

if __name__ == "__main__":
    render_all()
