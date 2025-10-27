# Star Resonance Real-time Battle Data Statistics Tool

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-brightgreen.svg)](https://www.gnu.org/licenses/agpl-3.0.txt)
[![Node.js](https://img.shields.io/badge/Node.js-22%2B-green.svg)](https://nodejs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-10.13.1-orange.svg)](https://pnpm.io/)

A real-time battle data statistics tool for the game "Star Resonance" that uses network packet capture technology to analyze battle data in real-time, providing damage statistics, DPS calculations, and other features.

The accuracy of this tool has been verified through multiple actual battles, and no data loss issues have been found under stable network conditions.

This tool does not require modifying the game client and does not violate game service terms. The tool aims to help players better understand battle data, reduce ineffective improvements, and enhance the gaming experience. Before using this tool, please ensure that the data results will not be used for power discrimination or other behaviors that damage the game community environment.

[Introduction Video](https://www.bilibili.com/video/BV1T4hGzGEeX/)

## ✨ Features

- 🎯 **Real-time Damage Statistics** - Real-time capture and statistics of damage data in battles
- 📊 **DPS Calculation** - Provides instantaneous DPS and overall DPS calculations
- 🎲 **Detailed Classification** - Distinguishes between normal damage, critical damage, lucky damage, and other types
- 🌐 **Web Interface** - Provides a beautiful real-time data display interface with line charts
- 🌙 **Theme Switching** - Supports day/night mode switching
- 🔄 **Auto Refresh** - Data updates in real-time without manual refresh
- 📈 **Statistical Analysis** - Detailed statistics such as critical rate, lucky rate, etc.

## 🚀 Quick Start

### One-Click Usage

Visit the [GitHub Actions page](https://github.com/dmlgzs/StarResonanceDamageCounter/actions) to download the latest auto-packaged version.

Visit the [Release page](https://github.com/dmlgzs/StarResonanceDamageCounter/releases) to download the release version.

Visit [Quark Cloud Drive](https://pan.quark.cn/s/89c4795e0751) to download the release version.

### Manual Compilation

#### Prerequisites

- **Node.js** >= 22.15.0
- **pnpm** >= 10.13.1
- **WinPcap/Npcap** (Network packet capture driver)
- **Visual Studio Build Tools** (Compilation dependency)
  - Can be installed via [Visual Studio Installer](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
  - Select "C++ build tools" workload
- **Python** 3.10 (Compilation dependency)
  - Can be downloaded and installed from [Python official website](https://www.python.org/downloads/)
  - Ensure Python is added to system PATH

#### Installation Steps

1. **Clone Repository**

   ```bash
   git clone https://github.com/dmlgzs/StarResonanceDamageCounter.git
   cd StarResonanceDamageCounter
   ```

2. **Install Dependencies**

   ```bash
   corepack enable
   pnpm install
   ```

3. **Install WinPcap/Npcap**
   - Download and install [Npcap](https://nmap.org/npcap/) or [WinPcap](https://www.winpcap.org/) (Npcap recommended)
   - Ensure "WinPcap API-compatible mode" is selected during installation

4. **Run**

   ```bash
   node server.js
   ```

   After running, you will be prompted to:
   - Select the network device for packet capture (you can check network adapter information through Control Panel)
   - Select log level (`info`: basic information, `debug`: detailed logs)

   You can also specify directly through command line parameters:

   ```bash
   node server.js <device_number> <log_level>
   ```

   Or use auto-detection mode (recommended):

   ```bash
   node server.js auto info
   ```

   Auto-detection mode will:
   - Intelligently identify physical network cards, excluding virtual network cards (such as ZeroTier, VMware, etc.)
   - Analyze 3 seconds of network traffic and automatically select the most active network card
   - Fall back to routing table method when there's no traffic

   Manual specification example:

   ```bash
   node server.js 4 info
   ```

### Usage Instructions

1. **Select Network Device**
   - After starting the program, a list of available network devices will be displayed
   - Enter the corresponding device number shown in the program output list (usually select the main network card)
   - You can go to Control Panel or System Settings to find the network card you're using

2. **Set Log Level**
   - Choose log level: `info` or `debug`
   - Recommend using `info` level to reduce log output

3. **Start Game**
   - The program will automatically detect game server connections
   - When a game server is detected, it will output server information and start collecting statistics

4. **View Data**
   - Open browser and visit: `http://localhost:8989`
   - View real-time battle data statistics

## 📱 Web Interface Features

### Data Display

- **Character ID** - Player character identifier
- **Total Damage/Healing** - Total cumulative damage/healing dealt
- **Damage Classification** - Detailed classification of pure critical, pure lucky, critical lucky, etc.
- **Critical Rate/Lucky Rate** - Probability of critical and lucky triggers in battle
- **Instantaneous DPS/HPS** - Current second's damage/healing output
- **Maximum Instantaneous** - Historical highest instantaneous output record
- **Total DPS/HPS** - Overall average output efficiency

### Operation Features

- **Clear Data** - Reset all statistical data
- **Theme Switch** - Switch between day/night modes
- **Auto Refresh** - Automatically update data every 100ms

## 🛠️ Technical Architecture

### Core Dependencies

- **[cap](https://github.com/mscdex/cap)** - Network packet capture
- **[express](https://expressjs.com/)** - Web server framework
- **[protobufjs](https://github.com/protobufjs/protobuf.js)** - Protocol Buffers parsing
- **[winston](https://github.com/winstonjs/winston)** - Log management

## 📡 API Interface

### GET /api/data

Get real-time battle data statistics

**Response Example:**

```json
{
  "code": 0,
  "user": {
    "114514": {
      "realtime_dps": 0,
      "realtime_dps_max": 3342,
      "total_dps": 451.970764813365,
      "total_damage": {
        "normal": 9411,
        "critical": 246,
        "lucky": 732,
        "crit_lucky": 0,
        "hpLessen": 8956,
        "total": 10389
      },
      "total_count": {
        "normal": 76,
        "critical": 5,
        "lucky": 1,
        "total": 82
      },
      "realtime_hps": 4017,
      "realtime_hps_max": 11810,
      "total_hps": 4497.79970662755,
      "total_healing": {
        "normal": 115924,
        "critical": 18992,
        "lucky": 0,
        "crit_lucky": 0,
        "hpLessen": 0,
        "total": 134916
      },
      "taken_damage": 65,
      "profession": "愈合"
    }
  },
  "enemy": {
    "15395": {
      "name": "雷电食人魔",
      "hp": 18011262,
      "max_hp": 18011262
    }
  }
}
```

### GET /api/clear

Clear all statistical data

**Response Example:**

```json
{
  "code": 0,
  "msg": "Statistics have been cleared!"
}
```

### GET /api/enemies

Get enemy data

**Response Example:**

```json
{
  "code": 0,
  "enemy": {
    "15395": {
      "name": "雷电食人魔",
      "hp": 18011262,
      "max_hp": 18011262
    }
  }
}
```

## Other APIs can be viewed in the [source code](server.js)

## 🔧 Troubleshooting

### Common Issues

1. **Cannot detect game server**
   - Check if network device selection is correct
   - Confirm the game is running and connected to server
   - Try going to a non-crowded area on the same map

2. **Web interface cannot be accessed**
   - Check if port 8989 is occupied
   - Confirm firewall settings allow local connections

3. **Abnormal data statistics**
   - Check log output for error messages
   - Try restarting the program to recapture

4. **cap module compilation error**
   - Ensure Visual Studio Build Tools and Python are installed
   - Confirm Node.js version meets requirements

5. **Program exits immediately after startup**
   - Ensure Npcap is installed
   - Confirm correct network device number is entered

## 📄 License

[![](https://www.gnu.org/graphics/agplv3-with-text-162x68.png)](LICENSE)

This project is licensed under the [GNU AFFERO GENERAL PUBLIC LICENSE version 3](LICENSE).

By using this project, you agree to comply with the terms of this license.

### Derivative Software Related

- If you modify the source code and republish, you must prominently indicate this project.
- If you reference internal implementations (such as server identification, protocol parsing, data processing, etc.) to publish another project, you must prominently indicate this project.

If you do not agree with this license and additional terms, please do not use this project or view related code.

## 👥 Contributing

Welcome to submit Issues and Pull Requests to improve the project!

### Contributors

[![Contributors](https://contrib.rocks/image?repo=dmlgzs/StarResonanceDamageCounter)](https://github.com/dmlgzs/StarResonanceDamageCounter/graphs/contributors "Contributors")

## ⭐ Support

If this project is helpful to you, please give it a Star ⭐

---

**Disclaimer**: This tool is only for game data analysis learning purposes and should not be used for any behavior that violates game service terms. Users need to bear the related risks themselves. The project developers are not responsible for any malicious power discrimination behavior by others using this tool. Please ensure compliance with relevant game community regulations and ethical standards before use.
