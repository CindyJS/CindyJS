#!/usr/bin/env perl

use strict;
use warnings;
use utf8;
use File::Slurp;

binmode(STDOUT, ':utf8');
my $txt = read_file($ARGV[0]);
my @colors = ('black');
my %colorcode =
  ('ffffff' => 'white',            # only used for whitespace
   '000000' => 'black',            # black
   'ba2a37' => 'tricky',           # red
   '2900de' => 'rethink',          # blue
   'c3741c' => 'header',           # orange
   '0b5cae' => 'greenishblue',     # only used for whitespace
   '558e28' => 'done(2015-03-17)', # green
   '5b9f62' => 'done(2015-03-17)', # green
   '5073cc' => 'done(2015-03-17)', # green
  );
if ($txt =~ /\{\\colortbl;((?:\\red\d+\\green\d+\\blue\d+;\n?)*)\}/) {
  $_ = $1;
  while (/\\red(\d+)\\green(\d+)\\blue(\d+);/g) {
    my $hexcolor = sprintf("%02x%02x%02x", $1, $2, $3);
    die "Color $hexcolor undefined" if (!defined $colorcode{$hexcolor});
    push @colors, $colorcode{$hexcolor};
  }
}
$_ = $txt;
s/\\'f6/ö/g;
s/\\'df/ß/g;
s/\\'e4/ä/g;
while (/\\'(..)/g) {
  print "$1\n";
}
s/auch fr /auch für /g;
s/\\\n/\\LINEBREAK/g;
s/\n//g;
s/\\LINEBREAK/\n/g;
s/\A\{\\rtf1\\ansi.*?\\strokec(\d+)/\\cf$1 \\strokec$1/;
s/\}$//;
s/\\expnd0\\expndtw0\\kerning0//g;
s/\\pard\\tx864\\pardeftab720\\pardirnatural//g;
s/\@/\\AT/g;
s/\\cf(\d+) ?\\strokec\1/'@'.$colors[$1+0].'@'/eg;
s{(\@[^\@]+\@)([^\@]*)}{my $t=$1; my $s=$2; $s=~s/^(.*)$/$t<<<<$1>>>>/gm; $s}eg;
s/\@[^\@]+\@<<<<\s*>>>>//g;
while (s/(\@[^\@]+\@)(<<<<.*?)>>>>\1<<<<(.*?>>>>)/$1$2$3/g) { }
s/(\@[^\@]+)\@<<<<(.*?)>>>>/$2 $1/g;
s/^[ \t]*/- /gm;
s/[ \t]+$//gm;
s/[ \t]+\@/ \@/gm;
s/^-(?: \@\w+(?:\([^)]*\))?)*$//gm;
s/\\\\/\\/g;
s/ \@black//g;
s/^- (.*) \@header$/$1:/gm;
s/\\AT/\@/g;
s/\s*\Z/\n/;

print;
