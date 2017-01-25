#!/usr/bin/env python3

import re
import sys
import os
import os.path
import urllib.request

import bs4
import bs4.element

class SoupToMarkdown:
    _reWS = re.compile(r"\s+")
    _reTS = re.compile(r" +$", re.M)
    _reLS = re.compile(r"^ (?! )", re.M)
    _reNL = re.compile(r"\n\n+")
    _rePeriod = re.compile(r"\. ")
    _reDT = re.compile(r":\*\* (?!\s)")
    _deep = ["table"]
    _shallow = ["sub", "sup"]
    _transparent = ["font"]
    _placeholder = ["vec", "vec1", "vec2", "function"]
    _enclose = {
        "div": ("\n\n", "\n\n"),
        "p": ("\n\n", "\n\n"),
        "ul": ("\n\n", "\n\n"),
        "li": ("* ", "\n\n"),
        "i": ("*", "*"),
        "emph": ("*", "*"),
        "b": ("**", "**"),
        "strong": ("**", "**"),
        "h1": ("\n\n# ", "\n\n"),
        "h2": ("\n\n## ", "\n\n"),
        "h3": ("\n\n### ", "\n\n"),
        "h4": ("\n\n#### ", "\n\n"),
        "h5": ("\n\n##### ", "\n\n"),
        "span": ("", ""),
    }
    def __init__(self):
        self._output = []
        self._indent = ""
        self._pre = False
        self._code = False
    def result(self):
        txt = "".join(self._output)
        txt = self._reTS.sub("", txt)
        txt = self._reLS.sub("", txt)
        txt = self._reNL.sub("\n\n", txt)
        txt = self._reDT.sub(":**\n", txt)
        txt = txt.strip("\n") + "\n"
        return txt
    def __call__(self, node):
        if isinstance(node, bs4.element.Comment):
            return
        if isinstance(node, str):
            txt = node
            if self._code:
                txt = txt.replace("<", "‹")
                txt = txt.replace(">", "›")
                txt = txt.replace("-›", "->")
            elif not self._pre:
                txt = txt.replace("&", "&amp;")
                txt = txt.replace("<", "&lt;")
                txt = txt.replace(">", "&gt;")
            if not self._pre:
                txt = self._reWS.sub(" ", txt)
                txt = self._rePeriod.sub(".\n", txt)
            txt = txt.replace("\n", "\n" + self._indent)
            self._output.append(txt)
            return
        if not hasattr(node, "name"):
            print("{} has no name.".format(node), file=sys.stderr)
            return
        tag = node.name.lower()
        f = getattr(self, "do_" + tag, None)
        if f is not None:
            f(node)
            return
        if tag in self._enclose:
            delim = self._enclose[tag]
            self.enclose(delim[0], node, delim[1])
            return
        if tag in self._deep:
            self._output.append(node.prettify())
            return
        if tag in self._shallow:
            self.enclose("<" + tag + ">", node, "</" + tag + ">")
            return
        if tag in self._transparent:
            self.recurse(node)
            return
        if tag in self._placeholder:
            self._output.append("‹" + tag + "›")
            self.recurse(node)
            return
        print("{} unhandled.".format(tag), file=sys.stderr)
        self._output.append(node.prettify())
    def recurse(self, node):
        for c in node.children:
            self(c)
    def enclose(self, pre, node, post):
        self._output.append(pre)
        self.recurse(node)
        self._output.append(post)
    def do_br(self, node):
        self._output.append("  \n")
    def do_hr(self, node):
        self._output.append("\n\n------\n\n")
    def do_a(self, node):
        if not "href" in (k.lower() for k in node.attrs):
            self.recurse(node)
            return
        self._output.append("[")
        self.recurse(node)
        self._output.append("](")
        href = node["href"]
        tiki = "tiki-index.php?page="
        if href.startswith(tiki):
            href = href[len(tiki):].replace("+", "_") + ".md"
        else:
            print("   href='{}'".format(href))
        self._output.append(href)
        self._output.append(")")
    def do_pre(self, node):
        old = (self._indent, self._pre)
        self._indent += "    > "
        self._pre = True
        self.enclose("\n\n", node, "\n\n")
        self._indent, self._pre = old
    def do_code(self, node):
        self._code = True
        self.enclose("`", node, "`")
        self._code = False
    def do_tt(self, node):
        self._code = True
        self.enclose("`", node, "`")
        self._code = False
    def do_img(self, node):
        self._output.append("\n\n![")
        self._output.append(node["alt"] or "Image")
        self._output.append("](")
        src = node["src"]
        web = "img/wiki_up/"
        if src.startswith(web):
            src = "img/" + src[len(web):]
        else:
            print("   src='{}'".format(src))
        self._output.append(src)
        self._output.append(")\n\n")
    def do_table(self, node):
        table = []
        colwidths = []
        save = self._output
        for i, tr in enumerate(node.find_all("tr")):
            row = []
            table.append(row)
            for j, elt in enumerate(tr.find_all(["td","th"])):
                self._output = []
                if i == 0:
                    b = None
                    for c in elt.children:
                        if isinstance(c, bs4.element.Comment):
                            continue
                        if isinstance(c, str):
                            if self._reWS.sub("", c):
                                break
                            continue
                        if c.name.lower() == "b" and b is None:
                            b = c
                            continue
                        break
                    else:
                        if b:
                            elt = b
                self.recurse(elt)
                txt = self._reWS.sub(" ", self.result())
                txt = txt.rstrip(" ");
                row.append(txt)
                if j == len(colwidths):
                    colwidths.append(len(txt))
                elif colwidths[j] < len(txt):
                    colwidths[j] = len(txt)
        self._output = save
        for i, row in enumerate(table):
            for j, elt in enumerate(row):
                w = colwidths[j]
                t = elt + " "*(w - len(elt))
                self._output.append("| {} ".format(t))
            self._output.append("|\n")
            if i == 0:
                for w in colwidths:
                    self._output.append("| {} ".format("-"*w))
                self._output.append("|\n")

def scrub(name):
    dir = os.path.dirname(__file__)
    tmp = os.path.join(dir, "tmp")
    if not os.path.exists(tmp):
        os.mkdir(tmp)
    name = name.replace(" ", "+").replace("_", "+")
    url = "http://doc.cinderella.de/tiki-index.php?page=" + name
    name = name.replace("+", "_")
    print("* " + name)
    tmpf = os.path.join(tmp, name) + ".html"
    if not os.path.exists(tmpf):
        with open(tmpf, "wb") as f:
            print("Downloading {} to {}".format(url, tmpf))
            with urllib.request.urlopen(url) as con:
                data = con.read()
                f.write(data)
    else:
        with open(tmpf, "rb") as f:
            data = f.read()
    data = data.replace(b"\r\n", b"\n").replace(b"\r", b"\n")
    soup = bs4.BeautifulSoup(data, "html5lib", from_encoding="utf-8")
    md = SoupToMarkdown()
    md(soup.find("div", class_="wikitext"))
    with open(os.path.join(dir, name) + ".md", "w") as f:
        f.write(md.result())

names = [
    "CSFundamentals",
    "General+Concepts",
    "Entering+Program+Code",
    "Variables+and+Functions",
    "Accessing+Geometric+Elements",
    "Control+Operators",
    "Arithmetic+Operators",
    "Boolean+Operators",
    "String+Operators",
    "Lists+and+Linear+Algebra",
    "Elementary+List+Operations",
    "Advanced+List+Operations",
    "Lists+of+Geometric+Elements",
    "Vectors+and+Matrices",
    "Drawing",
    "Appearance+of+Objects",
    "Elementary+Drawing+Functions",
    "Function+Plotting",
    "Texts+and+Tables",
    "TeX+Rendering",
    "Image+Manipulation+and+Rendering",
    "Shapes",
    "Script+Coordinate+System",
    "Geometric+Operators",
    "Calculus",
    "Syntherella",
    "MIDI+Functions",
    "Sampled-Audio+Functions",
    "Special+Operators",
    "System+Information",
    "Interaction+with+Geometry",
    "File+Management",
    "Console+Output",
    "Timing+and+Animations",
    "User+Input",
    "Interaction+with+CindyLab",
    "Interaction+with+C-Books",
    "The+CindyScript+Editor",
    "Tiny+Code+Examples",
]
if len(sys.argv) > 1:
    names = sys.argv[1:]
for name in names:
    scrub(name)
