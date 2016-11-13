document.addEventListener("DOMContentLoaded", function() {
    var allowHiddenResults = false;
    var canvas = document.querySelector("canvas");
    var examples;
    var currentExample = null;
    var searchClearable = false;

    function changeView(text) {
        canvas.complexCurves['rotate' + text]();
    }

    function customExample(equation) {
        return PolynomialParser.parse(equation) ? {
            "id": "Custom",
            "cached": false,
            "title": equation,
            "equation": equation,
            "description": "Custom equation"
        } : null;
    }

    function updateHash() {
        if (currentExample === null) {
            window.location.hash = '';
            return;
        }
        var id = encodeURIComponent(currentExample.id);
        var options = [];
        if (id === 'Custom')
            options.push('equation=' +
                encodeURIComponent(currentExample.equation));
        if (!currentExample.cached && id !== 'Custom')
            options.push('cached=0');
        var view = $('#viewDropdown').dropdown('get value')[0];
        if (view !== 'Default')
            options.push('view=' + view);
        if ($('#autorotateCheckbox').checkbox('is checked'))
            options.push('autorotate=1');
        if ($('#clippingCheckbox').checkbox('is checked'))
            options.push('clip=1');
        if ($('#orthoCheckbox').checkbox('is checked'))
            options.push('ortho=1');
        if ($('#transparencyCheckbox').checkbox('is checked'))
            options.push('transparency=1');
        var hash = id + (options.length === 0 ? '' : '?' + options.join('&'));
        window.location.hash = hash;
    }

    function selectExample(example) {
        example = example || customExample($('.ui.search').search('get value'));
        if (!example)
            return;
        if (canvas.complexCurves)
            canvas.complexCurves.unregisterEventHandlers();
        var piOver180 = Math.PI / 180;
        var lat = 75 * piOver180;
        var lon = 30 * piOver180;
        if (example.cached) {
            canvas.complexCurves =
                ComplexCurves.fromFile(canvas,
                    'http://complexcurves.org/models/' + example.id + '.bin',
                    example.equation, lat, lon);
        } else {
            canvas.complexCurves = ComplexCurves.fromEquation(canvas,
                example.equation, example.depth || 12, lat, lon);
        }
        if (example.zoom !== undefined)
            canvas.complexCurves.setZoom(example.zoom);
        allowHiddenResults = true;
        $('.ui.search').search('hide results');
        $('#viewDropdown').dropdown('set selected', 'Default');
        $('#autorotateCheckbox').checkbox('uncheck');
        $('#clippingCheckbox').checkbox('uncheck');
        $('#orthoCheckbox').checkbox('uncheck');
        $('#transparencyCheckbox').checkbox('uncheck');
        $('#ComplexCurves').show();
        currentExample = example ||
            customExample($('.ui.search').search('get value'));
        $('.ui.search').search('set value', currentExample.id === 'Custom' ?
            currentExample.equation : currentExample.title);
        makeSearchClearable(false);
        updateHash();
    }

    function updateState() {
        var splitHash = window.location.hash.split('?');
        var id = splitHash[0].slice(1);
        if (id === '') {
            clearSearch();
            return;
        }
        var options = {};
        (splitHash[1] || '').split('&').forEach(function(option) {
            var split = option.split('=');
            options[split[0]] = split[1];
        });
        if (id === 'Custom') {
            var equation = decodeURIComponent(options.equation);
            if (options.equation && (!currentExample ||
                    currentExample.equation !== equation))
                selectExample(customExample(equation));
        } else if (currentExample === null || currentExample.id !== id) {
            var example = examples.filter(function(ex) {
                return ex.id === id;
            })[0];
            if (example) {
                example.cached = options.cached !== '0';
                selectExample(example);
            }
        }
        var view = options.view || 'Default';
        if (view !== $('#viewDropdown').dropdown('get value')[0])
            $('#viewDropdown').dropdown('set value', view);
        var clip = options.clip === '1';
        if (clip !== $('#clippingCheckbox').checkbox('is checked'))
            $('#clippingCheckbox').checkbox('toggle');
        var ortho = options.ortho === '1';
        if (ortho !== $('#orthoCheckbox').checkbox('is checked'))
            $('#orthoCheckbox').checkbox('toggle');
        var transparency = options.transparency === '1';
        if (transparency !== $('#transparencyCheckbox').checkbox('is checked'))
            $('#transparencyCheckbox').checkbox('toggle');
        var autorotate = options.autorotate === '1';
        if (autorotate !== $('#autorotateCheckbox').checkbox('is checked'))
            $('#autorotateCheckbox').checkbox('toggle');
    }

    window.addEventListener('hashchange', updateState);

    function clearSearch() {
        if (!searchClearable)
            return;
        var searchInput = $('#searchInput').detach();
        $('#smallSearch').replaceWith(
            '<div id="largeSearch" class="ui centered grid">' +
            '<div class="ten wide center aligned column">' +
            '<a href="#"><h1 class="ui image header">' +
            '<img class="image"' +
            ' src="images/Folium.png" alt="Folium" />' +
            '<span class="content">Complex Curves</span>' +
            '</h1></a>' +
            '<div class="ui raised padded segment">' +
            '<form class="ui large form">' +
            '<h3>Visualize complex plane algebraic curves</h3>' +
            '<div class="field">' +
            '<div id="searchField" class="ui icon input">' +
            '<i class="search icon"></i>' +
            '</div>' +
            '</div>' +
            '<div class="field">for example <a href="#Folium">' +
            'Folium</a> or <a href="#Custom?' +
            'equation=y%5E3-3*x*y%2Bx%5E3">y^3 -' +
            ' 3 * x * y + x^3</a></div>' +
            '</form>' +
            '</div>' +
            '</div>' +
            '</div>'
        );
        searchInput.val('');
        searchInput.prependTo('#searchField');
        searchClearable = false;
        searchInput.focus();
        $('.ui.search').search('search local', '');
        $('.ui.search').search('show results');
    }

    function makeSearchClearable(focus) {
        if (!focus)
            focus = false;
        if (searchClearable)
            return;
        var searchInput = $('#searchInput').detach();
        $('#largeSearch').replaceWith(
            '<div id="smallSearch" class="ui small borderless stackable menu">' +
            '<a class="item" href="#"><h3 class="ui image header">' +
            '<img class="image"' +
            ' src="images/Folium.png" alt="Folium" />' +
            '<span class="content">Complex Curves</span>' +
            '</h3></a>' +
            '<form class="ui vertically fitted large form item">' +
            '<div class="field">' +
            '<div id="searchField" class="ui icon input">' +
            '<i class="remove link icon"></i>' +
            '</div>' +
            '</div>' +
            '</form>' +
            '</div>'
        );
        searchInput.prependTo('#searchField');
        $('.remove.link.icon').on('click', clearSearch);
        searchClearable = true;
        if (focus)
            searchInput.focus();
    }

    $('#viewDropdown').dropdown({ allowReselection: true }).on('change',
    function(evt) {
        var view = evt.target.value;
        changeView(view);
        updateHash();
    });

    function registerToggleAction(id, action) {
        $(id).checkbox({
            onChange: function() {
                canvas.complexCurves[action]($(this).prop('checked'));
                updateHash();
                return true;
            }
        });
    }

    function registerExportButton(id, action) {
        $(id).on('click', function() {
            canvas.complexCurves[action]();
        });
    }
    registerToggleAction('#autorotateCheckbox', 'setAutorotate');
    registerToggleAction('#clippingCheckbox', 'setClipping');
    registerToggleAction('#orthoCheckbox', 'setOrtho');
    registerToggleAction('#transparencyCheckbox', 'setTransparency');
    registerExportButton('#surfaceButton', 'exportSurface');
    registerExportButton('#screenshotButton', 'exportScreenshot');
    registerExportButton('#domainColouringButton', 'exportDomainColouring');

    var req = new XMLHttpRequest();
    req.open("GET", "examples.json");
    req.responseType = "json";
    req.onload = function() {
        examples = req.response;
        $('.ui.search').search({
            duration: 0,
            transition: false,
            maxResults: 50,
            minCharacters: 0,
            searchFields: ['title'],
            searchFullText: true,
            source: examples,
            onResultsOpen: function() {
                $('#ComplexCurves').hide();
                allowHiddenResults = false;
            },
            onResultsClose: function() {
                if (!allowHiddenResults)
                    $('.ui.search').search('show results');
            },
            onSelect: selectExample,
            onSearchQuery: function(query) {
                if (query === '') {
                    clearSearch();
                } else
                    makeSearchClearable(true);
            },
            templates: {
                message: function(message, type) {
                    var
                        html = '';
                    var value = $('.ui.search').search('get value');
                    var example = customExample(value);
                    if (example) {
                        html = $('.ui.search').search('generate results', {
                            "results": [example]
                        });
                        $('.ui.search').search('add results', html);
                        return;
                    }
                    if (message !== undefined && type !== undefined) {
                        html += '' + '<div class="message ' + type + '">';
                        // message type
                        if (type == 'empty') {
                            html += '' +
                                '<div class="header">' + 'No Results' +
                                '</div>' + '<div class="description">' +
                                message + '</div>';
                        } else {
                            html += ' <div class="description">' + message +
                                '</div>';
                        }
                        html += '</div>';
                    }
                    return html;
                },
                standard: function(response, fields) {
                    var
                        html = '';
                    if (response[fields.results] !== undefined) {

                        // each result
                        $.each(response[fields.results], function(index, result) {
                            if (result[fields.url]) {
                                html += '<a class="ui card result" href="' +
                                    result[fields.url] + '">';
                            } else {
                                html += '<a class="ui card result">';
                            }
                            if (result[fields.image] !== undefined) {
                                html += '' + '<div class="ui medium image">' +
                                    ' <img src="' + result[fields.image] +
                                    '" alt="' + result[fields.title] + '">' +
                                    '</div>';
                            }
                            html += '<div class="content">';
                            if (result[fields.price] !== undefined) {
                                html += '<div class="price">' +
                                    result[fields.price] + '</div>';
                            }
                            if (result[fields.title] !== undefined) {
                                html += '<div class="title">' +
                                    result[fields.title] + '</div>';
                            }
                            if (result[fields.description] !== undefined) {
                                html += '<div class="description">' +
                                    result[fields.description] + '</div>';
                            }
                            html += '' + '</div>';
                            html += '</a>';
                        });

                        if (response[fields.action]) {
                            html += '' + '<a href="' +
                                response[fields.action][fields.actionURL] +
                                '" class="action">' +
                                response[fields.action][fields.actionText] +
                                '</a>';
                        }
                        return html;
                    }
                    return false;
                }
            }
        });
        $('.ui.search').search('search local', '');
        $('.ui.search').search('show results');

        $('#searchInput').on('keydown', function(e) {
            e.stopPropagation();
            if(e.key === "Enter" || e.code === "Enter" || e.keyCode === 13) {
                var results = $('.ui.search').search('get results');
                var result = results[0] ||
                    customExample($('.ui.search').search('get value'));
                if (result)
                    selectExample(result);
                return false;
            }
        });

        updateState();
    };
    req.send();
});
