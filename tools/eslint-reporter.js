/**
 * @fileoverview Stylish reporter
 * @author Sindre Sorhus
 */
"use strict";

const chalk = require("chalk"),
    stripAnsi = require("strip-ansi"),
    table = require("text-table");

var fs = require("fs");
var path = require("path");
var SourceMapConsumer = require("source-map").SourceMapConsumer;

var reSourceMappingURL = /\/\/# sourceMappingURL=(.*)/g;

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

/**
 * Given a word and a count, append an s if count is not one.
 * @param {string} word A word in its singular form.
 * @param {int} count A number controlling whether word should be pluralized.
 * @returns {string} The original word with an s on the end if count is not one.
 */
function pluralize(word, count) {
    return count === 1 ? word : `${word}s`;
}

//------------------------------------------------------------------------------
// Public Interface
//------------------------------------------------------------------------------

module.exports = function (results) {
    var len = results.length;
    var str = "";
    var prevfile;
    var prevorig;
    var smc;

    let output = "\n",
        errorCount = 0,
        warningCount = 0,
        fixableErrorCount = 0,
        fixableWarningCount = 0,
        summaryColor = "yellow";

    results.forEach((result) => {
        const messages = result.messages;

        if (messages.length === 0) {
            return;
        }

        errorCount += result.errorCount;
        warningCount += result.warningCount;
        fixableErrorCount += result.fixableErrorCount;
        fixableWarningCount += result.fixableWarningCount;

        output += `${chalk.underline(result.filePath)}\n`;

        output += `${table(
            messages.map((message) => {
                let messageType;

                if (message.fatal || message.severity === 2) {
                    messageType = chalk.red("error");
                    summaryColor = "red";
                } else {
                    messageType = chalk.yellow("warning");
                }

                let file = result.filePath;
                let line = message.line;
                let col = message.column;

                if (prevfile !== file) {
                    smc = null;
                    var js = fs.readFileSync(file, { encoding: "utf8" });
                    var match,
                        smf = null;
                    while ((match = reSourceMappingURL.exec(js)) !== null) smf = match[1];
                    if (smf) {
                        smf = path.resolve(path.dirname(file), smf);
                        var smt = fs.readFileSync(smf, { encoding: "utf8" });
                        smc = new SourceMapConsumer(smt);
                    }
                }
                prevfile = file;

                if (smc && line >= 1) {
                    var orig = smc.originalPositionFor({
                        line: line,
                        column: col,
                    });
                    if (orig.source) {
                        file = orig.source;
                        file = file.replace(/^\.\.\/\.\.\/src\/js\//, "");
                        line = orig.line;
                        col = orig.column;
                    }
                }
                if (prevorig && prevorig !== file) {
                    str += "\n";
                }

                return [
                    "",
                    file,
                    `line: ${line}`,
                    `column: ${col}`,
                    messageType,
                    message.message.replace(/([^ ])\.$/u, "$1"),
                    chalk.dim(message.ruleId || ""),
                ];
            }),
            {
                align: ["", "l", "l"],
                stringLength(str) {
                    return stripAnsi(str).length;
                },
            }
        )
            .split("\n")
            .map((el) => el.replace(/(\d+)\s+(\d+)/u, (m, p1, p2) => chalk.dim(`${p1}:${p2}`)))
            .join("\n")}\n\n`;
    });

    const total = errorCount + warningCount;

    if (total > 0) {
        output += chalk[summaryColor].bold(
            [
                "\u2716 ",
                total,
                pluralize(" problem", total),
                " (",
                errorCount,
                pluralize(" error", errorCount),
                ", ",
                warningCount,
                pluralize(" warning", warningCount),
                ")\n",
            ].join("")
        );

        if (fixableErrorCount > 0 || fixableWarningCount > 0) {
            output += chalk[summaryColor].bold(
                [
                    "  ",
                    fixableErrorCount,
                    pluralize(" error", fixableErrorCount),
                    " and ",
                    fixableWarningCount,
                    pluralize(" warning", fixableWarningCount),
                    " potentially fixable with the `--fix` option.\n",
                ].join("")
            );
        }
    }

    // Resets output color, for prevent change on top level
    return total > 0 ? chalk.reset(output) : "";
};
