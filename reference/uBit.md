# MicroBit
## Class representing the micro:bit

The MicroBit class represents the micro:bit in code. You can use it to control your micro:bit.

### Declare an instance
You need to declare an instance of the class before you can use it. You can do this just like any other variable:
```
MicroBit uBit;
```
We call it `uBit` as a shorthand for micro:bit. The "u" in `uBit` represents the greek letter `μ` for micro. You can name the instance anything you like.

### Initialisation
Always remember to initialise the class instance using the `init()` method before you use it. You can do this in the main function:
```
int main() {
    uBit.init();
}
```