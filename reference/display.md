---
keywordBlacklist: ["display"]
slug: "display"
---
# Display
## The micro:bit's LED display output

The micro:bit display is a 5x5 LED grid. The output can be controlled with the display class

### Scroll
You can scroll words and numbers on the micro:bit’s LED display:
```
uBit.display.scroll("Hello World!");
```
This is some dummy extra content that only appears when you click `more`

### Print
You can print words and numbers on the display one character at a time:
```
uBit.display.print("ABCDEFG");
```

### Clear
Clear all output from the display, turning all LEDs off:
```
uBit.display.clear();
```