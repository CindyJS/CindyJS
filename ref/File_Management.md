## File Management

There is a number of operations that allow for the interaction of CindyScript with files that are stored elsewhere on the computer.
Please note that these commands will not work with applets in HTML pages.

------

------

###  Reading Files

#### Loading data: `load(‹string›)`

**Not available in CindyJS yet!**

**Description:**
This operator takes the argument `‹string›`, which is considered to be a file name (possibly preceded by directory information).
If the file name is legitimate, then the entire information contained in the file will be returned as a string.
This operator is particularly useful together with the `tokenize` operator, which helps to analyze structured data.
The data are read from the currently active directory, which can be set with the `setdirectory` operator.

**Example:**
Assume that in the file `LoadDemo.txt` contains the data

`abc,gfdg;1,3,5.6,3.141;56,abc,xxx,yyy`

The following code reads the data and creates a list by tokenizing it with respect to `;` and `,`.

    > x=load("LoadTest.txt");
    > y=tokenize(x,(";",","));
    > apply(y,println(#));

The resulting output is

    > [abc,gfdg]
    > [1,3,5.6,3.141]
    > [56,abc,xxx,yyy]

------

#### Importing program code: `import(‹string›)`

**Not available in CindyJS yet!**

**Description:**
This operator takes the argument `‹string›`, which is considered to be a file name (including directory information).
If the file name is legitimate, then the whole content of the file is assumed to be able to be parsed by CindyScript code, and it is immediately executed.
In this way, one can load libraries with predefined functionality.
It is advisable to use the `import` operator only in the "Init" section of CindyScript, since otherwise, the file will be read for each move.

------

#### Setting the directory: `setdirectory(‹string›)`

**Not available in CindyJS yet!**

**Description:**
This operator sets the directory for all subsequent file operations.

------

------

### Writing Files

It is also possible to write files by a sequence of Cindy script commands.
The usual cycle for writing is: Open a file — write to it — close the file.
This can be done using the following commands.

------

#### Opening a file: `openfile(‹string›)`

**Not available in CindyJS yet!**

**Description:**
Opens a file with the specified name.
The function returns a handle to the file that is needed for subsequent print operations.

------

#### Println to a file: `println(‹file›,‹string›)`

**Not available in CindyJS yet!**

**Description:**
Identical to the `println(…)` command.
However this command prints to the file specified by `‹file›`.

------

#### Print to a file: `print(‹file›,‹string›)`

**Not available in CindyJS yet!**

**Description:**
Identical to the `print(…)` command.
However this command prints to the file specified by `‹file›`.

------

#### Print to a file: `closefile(‹file›)`

**Not available in CindyJS yet!**

**Description:**
This command finally closes the file.

**Example:**
The following example illustrates a file write cycle:

    > f=openfile("myFile");
    > println(f,"Here are some numbers");
    > forall(1..15,print(f,#+" ");
    > println(f,"");
    > closefile(f);

This code generates a file with the following content:

    > Here are some numbers
    > 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15

------

------

### Connection to HTML

#### Opening a web page: `openurl(‹string›)`

**Not available in CindyJS yet!**

**Description:**
Opens a browser with the webpage given in ‹string›.

------

#### Calling javascript: `javascript(‹string›)`

**Description:**
In exported applets this statement calls a statement in the Javascript environment of the browser.
The statement is given by the content of the `‹string›`.
In the standalone application this statement does nothing.

**Example:**
The following piece of script will cause a message window to pop up in the browser:

    >   javascript("alert('Hi from Cinderella!!')");

------

------

###  Network Connections

The TCP commands of Cinderella are rudimentary at best, but they provide the basic functionality necessary for simple networking.
You should be able to send and retrieve data over the internet.

------

#### Open a TCP port: `openconnection(‹string›,‹int›)`

**Not available in CindyJS yet!**

**Description:**
Opens a bidirectional tcp connection to the server specified by the first argument and the port specified by the second argument.
The return value is a handle to this network connection.

**Example:**
In the following example we open a connection to a web server and read the HTML code from there.

    > x=openconnection("cermat.org",80);
    > println(x,"GET /");
    > y="";
    > while(!isundefined(y),y=readln(x);println(y));
    > closeconnection(x);

------

#### Write to a TCP connection: `print(‹handle›,‹string›)`

**Not available in CindyJS yet!**

#### Write to a TCP connection: `println(‹handle›,‹string›)`

**Not available in CindyJS yet!**

**Description:**
The `print` and `println` functions not only support writing to a file, but also to a network connection created by `openconnection`.

------

#### Flush output to a TCP port: `flush(‹handle›)`

**Not available in CindyJS yet!**

**Description:**
Flushes the output buffer of the given connection.

------

#### Read from a TCP connection: `readln(‹handle›)`

**Not available in CindyJS yet!**

**Description:**
Reads a line from the given connection.
If no data can be read, this command times out after 5 seconds.

------

#### Close a TCP connection: `closeconnection(‹handle›)`

**Not available in CindyJS yet!**

**Description:**
Closes the connection given by the handle.
