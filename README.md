# PTO Approver: Beat 'Em Up Arcade Game

A 16-bit retro arcade beat-'em-up game set in the Veeva Budapest office! Battle through hordes of overworked Zombie Colleagues, handle demanding Customer Mid-Bosses, and confront The Manager to claim your well-deserved Approved PTO.

![Screenshot](public/assets/test_scene_preview2.png)

## 🏢 Stages & Environments
- **Stage 1: Veeva Budapest Lobby**: 3D geometric wall, backlit glowing Veeva logo, reception lounge, and panoramic views of the Danube river and Budapest Parliament.
- **Stage 2: Open Workspace & Cubicles**: Dual-monitor desks, glass skylights, and animated blinking terminal screens.
- **Stage 3: Breakroom & Cafeteria**: Espresso bar with billowing steam, ping pong tables, and pendant lamps that dynamically sway to the action.

## 🕹️ Playable Characters
1. **Tech Associate ("Dev Dave")** - *The Bruiser*
   - Weapon: RGB Mechanical Keyboard Broadsword (`coda-sword`)
   - Special Skill: **Code Freeze** (freezes all enemies on screen in a cascade of cybernetic matrix code)
2. **Support Associate ("Ticket Tina")** - *The Speedster*
   - Weapon: Coiled Cat6 Ethernet Cable Whip with RJ45 connector
   - Special Skill: **Ticket Escalation** (rapid high-priority whip strikes)
3. **PS Associate ("Consultant Carl")** - *The All-Rounder*
   - Weapon: Carbon-Fiber Office Laptop
   - Special Skill: **Scope Creep** (hurls projectile document sheets)

## 👾 Enemies & Bosses
- **Zombie Colleague Grunt**: Pale green overworked employees shambling with overflowing coffee mugs and brown splash attacks.
- **Customer Mid-Boss**: Purple tailored power suit and furious expressions, hurling urgent email tickets.
- **The Manager (Final Boss)**: Imposing corporate goliath in a double-breasted navy power suit, red tie, and glowing red rectangular glasses, unleashing ground slam shockwaves.

## ⌨️ Controls
| Action | Keyboard |
| :--- | :--- |
| **Move** | `Arrow Keys` or `W`, `A`, `S`, `D` |
| **Attack Combo** | `J` or `Z` |
| **Jump** | `K` or `X` or `Space` |
| **Special Skill** | `L` or `C` |

## 🚀 Running Locally

1. **Install Dependencies**:
   ```bash
   npm install
   ```
2. **Start Development Server**:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:8080/` in your browser.

## 📦 Build for Production
```bash
npm run build
```
The compiled static assets will be output to the `dist/` folder.
