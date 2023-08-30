# Variables
## Keep track of data that changes

Variables are used to store data that may change, such as the number of points you have in a game. Variables can have different data types.

### Declaring variables
Declare a new variable with a *type* and *variable name*. Set an initial value using the `=` sign:

Select type:
#### int
Declare an integer (whole number) with the `int` keyword
```
int count = 0;
```

#### char
Declare a character with the `char` keyword
```
char letter = 'a';
```

### Modifying number variables
Modify the number values of variables using operators:

Select operation:
#### increment
Use `+=` to increment the value
```
int a = 0;
a += 10;
uBit.display.scroll(a);
```

#### decrement
Use `-=` to increment the value
```
int a = 15;
a -= 10;
uBit.display.scroll(a);
```