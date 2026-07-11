# AICP JS Engine
[中文](README_CN.md) | [English](README.md) | [开发文档](DEVELOP.md)

A lightweight, pure-frontend JavaScript agent communication protocol engine built on the [AICP Protocol](https://github.com/woozheng/aicp). Powered by browser-native ES Modules. The core idea: **you speak in natural language, the LLM generates JavaScript code, the engine executes it in a sandbox and renders the result directly into the DOM.**

**No backend. No build tools**. Open a browser. It just works.

Supports LLM chat + code execution dual engines, plugin registry, message envelope routing, configurable retry iterations. Canvas, animations, visualizations — all out of the box.

---

## What It Does

AICP JS Engine delivers the shortest path from "natural language" to "visual output":

- **LLM is the compiler** — compiles your intent into JavaScript in real-time
- **Sandbox is the runtime** — executes code in a restricted environment with injected globals (container, canvas size)
- **DOM is the canvas** — renders directly to a specified container. Canvas, DOM, Web Animation — everything works

[Live Demo, Click to Play](https://live.biopoiesis.net/demo.html)

All configuration stored in local localStorage. Pure static webpage. No backend.

Only put git files in your web static directory,you have a aicp js engine too.

Generate Images、Generate Games、Generate Applications，Generate Everything。

---

## Showcase

### JS Generates Images
| ![brand](images/brand.png) | ![demo4](images/demo4.png) |
|:--:|:--:|
| Brand Poster | Visual Demo |

### JS Generates Games
| ![game](images/game.png) |
|:--:|
| Interactive Game |

### JS Generates Forms
| ![resume](images/resume.png) |
|:--:|
| Resume Form |

### JS Generates Everything
| ![word](images/word.png) | ![music](images/music.png) |
|:--:|:--:|
| Word Editor | Music Player |

---

**The boundary of JS is the boundary of the engine.**

---

## Quick Start

Open `demo.html`, fill in your LLM API Key when prompted, and start speaking.

---

## License

[MIT](LICENSE) · Dvwoo