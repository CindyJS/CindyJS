#!/usr/bin/python
## This script will go through all files in the current directory and replace cindyscript inport statement with the content of the imported file, this is necessary when executing CindyJS locally without a server as including local files is blocked as cross-site scripting
## For safety reasons only lines ending with `//! XSS` will be considered
## TODO make this operation part of the build-process

import os
import re

def main():
    # Get the current directory
    current_directory = os.getcwd()

    # Iterate through all files in the current directory
    for filename in os.listdir(current_directory):
        # Check if it's a file
        if os.path.isfile(filename):
            if not filename.endswith(".html"):
                continue ## only consider html files
            if filename.endswith(".noimport.html"):
                continue ## exclude generated files
            # Open the file for reading
            with open(filename, mode = 'r') as file:
                lines = file.readlines()

            changed=False;
            for index,line in enumerate(lines):
                if line.endswith('//! XSS\n'):
                    lines[index:index+1]=replaceInclude(line);
                    changed=True

            if changed:
                # write replaced contents to copy of file
                with open(filename[:-len(".html")]+".noimport.html", mode = 'w') as file:
                    file.write("<!-- AUTO-GENERATED FILE, DO NOT MODIFY -->\n");
                    for line in lines:
                        file.write(line)

def contains_unescaped_double_quotes(s):
    # Regular expression to find unescaped double quotes
    pattern = r'(?<!\\)"'
    return bool(re.search(pattern, s))

def replaceInclude(line):
    expr=line[:line.rindex("//")].strip(); ## remove comment and leading whitespaces
    if not expr.startswith("import(\"") or not expr.endswith("\");"):
        print(f"line is not a single include expression: `{expr}`")
        return line
    path=expr[len("import(\""):expr.rindex("\");")];
    if contains_unescaped_double_quotes(path):
        print(f"line is not a single fixed-path include expression: `{expr}`")
        return line
    path = path.replace('\\"','"');
    body= f"// include file at `{path}` \n";
    with open(path,mode='r') as f:
        body+=f.read();
    return body+"\n//end of included file\n"

main()
