(function ($) {
    $.extend(true, window, {
        "Ext": {
            "Plugins": {
                "HeaderFilter": HeaderFilter
            }
        }
    });

    /*
    Based on SlickGrid Header Menu Plugin (https://github.com/mleibman/SlickGrid/blob/master/plugins/slick.headermenu.js)

    (Can't be used at the same time as the header menu plugin as it implements the dropdown in the same way)
    */

    function HeaderFilter(options) {
        var grid;
        var self = this;
        var handler = new Slick.EventHandler();
        var defaults = {
            buttonImage: "../resources/slickgrid-spreadsheet-plugins-master/images/down.png",
            filterImage: "../resources/slickgrid-spreadsheet-plugins-master/images/filter.png",
            sortAscImage: "../resources/slickgrid-spreadsheet-plugins-master/images/sort-asc.png",
            sortDescImage: "../resources/slickgrid-spreadsheet-plugins-master/images/sort-desc.png"
        };
        var $menu;

        function init(g) {
            options = $.extend(true, {}, defaults, options);
            grid = g;
            handler.subscribe(grid.onHeaderCellRendered, handleHeaderCellRendered)
                   .subscribe(grid.onBeforeHeaderCellDestroy, handleBeforeHeaderCellDestroy)
                   .subscribe(grid.onClick, handleBodyMouseDown)
                   .subscribe(grid.onColumnsResized, columnsResized);

            grid.setColumns(grid.getColumns());

            $(document.body).bind("mousedown", handleBodyMouseDown);
        }

        function destroy() {
            handler.unsubscribeAll();
            $(document.body).unbind("mousedown", handleBodyMouseDown);
        }

        function handleBodyMouseDown(e) {
            if ($menu && $menu[0] != e.target && !$.contains($menu[0], e.target)) {
                hideMenu();
            }
        }

        function hideMenu() {
            if ($menu) {
                $menu.remove();
                $menu = null;
            }
        }

        function handleHeaderCellRendered(e, args) {
            var column = args.column;

            var $el = $("<div></div>")
                .addClass("slick-header-menubutton")
                .data("column", column);

            if (options.buttonImage) {
                $el.css("background-image", "url(" + options.buttonImage + ")");
            }

            $el.bind("click", showFilter).appendTo(args.node);
        }

        function handleBeforeHeaderCellDestroy(e, args) {
            $(args.node)
                .find(".slick-header-menubutton")
                .remove();
        }

        function addMenuItem(menu, columnDef, title, command, image) {
            var $item = $("<div class='slick-header-menuitem'>")
                         .data("command", command)
                         .data("column", columnDef)
                         .bind("click", handleMenuItemClick)
                         .appendTo(menu);

            var $icon = $("<div class='slick-header-menuicon'>")
                         .appendTo($item);

            if (image) {
                $icon.css("background-image", "url(" + image + ")");
            }

            $("<span class='slick-header-menucontent'>")
             .text(title)
             .appendTo($item);
        }

        function addMenuInput(menu, columnDef) {
            $("<input class='input' placeholder='Search' style='margin-top: 5px; width: 206px'>")
                .data("column", columnDef)
                .bind("keyup", function (e) {
                    var filterVals = getFilterValuesByInput($(this));
                    updateFilterInputs(menu, columnDef, filterVals);
                })
                .appendTo(menu);
        }
        
        function addMenuCheckbox(menu, columnDef, title, command, filtered) {
            $("<label><input class='" + command + "' type='checkbox' value='000'" + (filtered ? " checked='checked'" : "") + "  />" + title + "</label>")
            .data("command", command)
            .data("column", columnDef)
            //.bind("click", handleMenuItemClick)
            .appendTo(menu);
        }

        function updateFilterInputs(menu, columnDef, filterItems) {
            var filterOptions = "<label><input type='checkbox' value='-1' />(Select All)</label>";
            columnDef.filterValues = columnDef.filterValues || [];

            // WorkingFilters is a copy of the filters to enable apply/cancel behaviour
            workingFilters = columnDef.filterValues.slice(0);

            for (var i = 0; i < filterItems.length; i++) {
                var filtered = _.contains(workingFilters, filterItems[i]);

                filterOptions += "<label><input type='checkbox' value='" + i + "'"
                + (filtered ? " checked='checked'" : "")
                + "/>" + filterItems[i] + "</label>";
            }
            var $filter = menu.find('.filter');
            $filter.empty().append($(filterOptions));

            $(':checkbox', $filter).bind('click', function () {
                workingFilters = changeWorkingFilter(filterItems, workingFilters, $(this));
            });
        }

        //function cli()
        
        
        function showFilter(e) {
            var $menuButton = $(this);
            var columnDef = $menuButton.data("column");

            columnDef.filterValues = columnDef.filterValues || [];
            
            
            
            //columnDef.findDup = columnDef.findDup || false;
            //columnDef.findDt = columnDef.findDt || false;
            //columnDef.findIv = columnDef.findIv || false;
            //columnDef.dupData = columnDef.dupData || {};
            
            // WorkingFilters is a copy of the filters to enable apply/cancel behaviour
            var workingFilters = columnDef.filterValues.slice(0);

            
            /**
            var filterItems;

            if (workingFilters.length === 0) {
                // Filter based all available values
                filterItems = getFilterValues(grid.getData(), columnDef);
            }
            else {
                // Filter based on current dataView subset
                filterItems = getAllFilterValues(grid.getData().getItems(), columnDef);
            }
**/
            if (!$menu) {
                $menu = $("<div class='slick-header-menu'>").appendTo(document.body);
            }

            $menu.empty();

            //addMenuItem($menu, columnDef, 'Sort Ascending', 'sort-asc', options.sortAscImage);
            //addMenuItem($menu, columnDef, 'Sort Descending', 'sort-desc', options.sortDescImage);
            
            if(typeof WDCT_Validator.columns != 'undefined' && 
            		typeof WDCT_Validator.columns[columnDef.id] != 'undefined' &&
            		typeof WDCT_Validator.columns[columnDef.id]['VALIDATIONS'] != 'undefined'){
            	for(var _a in WDCT_Validator.columns[columnDef.id]["VALIDATIONS"]){
            		columnDef[_a] = columnDef[_a] || false;
            		
            		
            		
            		if(WDCT_Validator.columns[columnDef.id]["VALIDATIONS"][_a]["TYPE"] == 'DUPLICATE'){
            			columnDef['dupData'] = columnDef['dupData'] || {};
            		}
            		
            		
            		var label = WDCT_Validator.columns[columnDef.id]["VALIDATIONS"][_a]["MENUITEMLABEL"];
            		
            		addMenuCheckbox($menu, columnDef, label, _a, columnDef[_a]);
            		
            		$('.' + _a + ':checkbox', $menu).bind('click', function () {
                    	columnDef[$(this).attr('class')] = $(this).attr('checked') || false; 
                    });
            		
            	}
            }
            
            
            //addMenuCheckbox($menu, columnDef, 'Filter Duplicate Values', 'find-dup', columnDef.findDup);
            //addMenuCheckbox($menu, columnDef, 'Filter Data Type Errors', 'find-dt', columnDef.findDt);
            //addMenuCheckbox($menu, columnDef, 'Filter Invalid Values', 'find-iv', columnDef.findIv);
            
            
            //addMenuInput($menu, columnDef);
/**
            
            $('.find-dup:checkbox', $menu).bind('click', function () {
            	columnDef.findDup = $(this).attr('checked') || false; 
            });
            $('.find-dt:checkbox', $menu).bind('click', function () {
            	columnDef.findDt = $(this).attr('checked') || false; 
            });
            $('.find-iv:checkbox', $menu).bind('click', function () {
            	columnDef.findIv = $(this).attr('checked') || false; 
            });
**/            
            
            /**
            var filterOptions = "<label><input type='checkbox' value='-1' />(Select All)</label>";

            for (var i = 0; i < filterItems.length; i++) {
                var filtered = _.contains(workingFilters, filterItems[i]);

                filterOptions += "<label><input type='checkbox' value='" + i + "'"
                                 + (filtered ? " checked='checked'" : "")
                                 + "/>" + filterItems[i] + "</label>";
            }

            var $filter = $("<div class='filter'>")
                           .append($(filterOptions))
                           .appendTo($menu);
             **/
            $('<button>OK</button>')
                .appendTo($menu)
                .bind('click', function (ev) {
                    columnDef.filterValues = workingFilters.splice(0);
                    
                    var isSelected = false;
                    if(typeof WDCT_Validator.columns != 'undefined' && 
                    		typeof WDCT_Validator.columns[columnDef.id] != 'undefined' &&
                    		typeof WDCT_Validator.columns[columnDef.id]['VALIDATIONS'] != 'undefined'){
                    	for(var _a in WDCT_Validator.columns[columnDef.id]["VALIDATIONS"]){
                    		
                    		if(isSelected == false) isSelected = columnDef[_a];
                    		
                    		if(columnDef[_a] && 
                    				WDCT_Validator.columns[columnDef.id]["VALIDATIONS"][_a]["TYPE"] == 'DUPLICATE'){
                    			//columnDef['dupData'] = columnDef['dupData'] || {};
                    			delete columnDef['dupData'];
                    			columnDef['dupData'] = {};
        	                    
        	                    var dataArr = dataView.getItems();
        	                    for (var i = 0, len = dataArr.length; i < len ; i++) {
        	                        var value = dataArr[i][columnDef.field];
        	                        
        	                        if (typeof columnDef['dupData'][value] == 'undefined') {
        	                        	columnDef['dupData'][value] = 1;
        	                        }else{
        	                        	columnDef['dupData'][value] = columnDef['dupData'][value] + 1;
        	                        }
        	                        
        	                    }
        	                    
        	                    console.log(columnDef['dupData']);
                    		}
                    	}
                    }
                    setButtonImage($menuButton, columnDef.filterValues.length > 0 || isSelected);
                    
                    if(isSelected){
                    	WDCT_Validator.validatingColumn = columnDef.id;
                    }
                    
                    handleApply(ev, columnDef);
                });

            $('<button>Clear</button>')
                .appendTo($menu)
                .bind('click', function (ev) {
                    columnDef.filterValues.length = 0;
                    
                    if(typeof WDCT_Validator.columns != 'undefined' && 
                    		typeof WDCT_Validator.columns[columnDef.id] != 'undefined' &&
                    		typeof WDCT_Validator.columns[columnDef.id]['VALIDATIONS'] != 'undefined'){
                    	for(var _a in WDCT_Validator.columns[columnDef.id]["VALIDATIONS"]){
                    		columnDef[_a] = false;
                    	}
                    }
                    if(typeof columnDef['dupData'] != 'undefined'){
                    	delete columnDef['dupData'];
                    	columnDef['dupData'] = {};
                    }
                    WDCT_Validator.validatingColumn = 0;
                    setButtonImage($menuButton, false);
                    handleApply(ev, columnDef);
                });

            $('<button>Cancel</button>')
                .appendTo($menu)
                .bind('click', hideMenu);

            
            /**
            $(':checkbox', $filter).bind('click', function () {
                workingFilters = changeWorkingFilter(filterItems, workingFilters, $(this));
            });
**/
           
            
            var offset = $(this).offset();
            var left = offset.left - $menu.width() + $(this).width() - 8;

            var menutop = offset.top + $(this).height();

            if (menutop + offset.top > $(window).height()) {
                menutop -= ($menu.height() + $(this).height() + 8);
            }
            $menu.css("top", menutop)
                 .css("left", (left > 0 ? left : 0));
        }

        function columnsResized() {
            hideMenu();
        }

        function changeWorkingFilter(filterItems, workingFilters, $checkbox) {
            var value = $checkbox.val();
            var $filter = $checkbox.parent().parent();

            if ($checkbox.val() < 0) {
                // Select All
                if ($checkbox.prop('checked')) {
                    $(':checkbox', $filter).prop('checked', true);
                    workingFilters = filterItems.slice(0);
                } else {
                    $(':checkbox', $filter).prop('checked', false);
                    workingFilters.length = 0;
                }
            } else {
                var index = _.indexOf(workingFilters, filterItems[value]);

                if ($checkbox.prop('checked') && index < 0) {
                    workingFilters.push(filterItems[value]);
                }
                else {
                    if (index > -1) {
                        workingFilters.splice(index, 1);
                    }
                }
            }

            return workingFilters;
        }

        function setButtonImage($el, filtered) {
            var image = "url(" + (filtered ? options.filterImage : options.buttonImage) + ")";
            var bgColor = (filtered ? '#f4ad42' : 'transparent');
            $el.css("background-color", bgColor);
            $el.css("background-image", image);
        }

        function handleApply(e, columnDef) {
            hideMenu();

            self.onFilterApplied.notify({ "grid": grid, "column": columnDef }, e, self);

            e.preventDefault();
            e.stopPropagation();
        }

        function getFilterValues(dataView, column) {
        	
            var seen = [];
            for (var i = 0; i < dataView.getLength() ; i++) {
                var value = dataView.getItem(i)[column.field];

                if (!_.contains(seen, value)) {
                    seen.push(value);
                }
                
            }

            return _.sortBy(seen, function (v) { return v; });
        }

        function getFilterValuesByInput($input) {
            var column = $input.data("column"),
                filter = $input.val(),
                dataView = grid.getData(),
                seen = [];

            for (var i = 0; i < dataView.getLength() ; i++) {
                var value = dataView.getItem(i)[column.field];

                if (filter.length > 0) {
                    var mVal = !value ? '' : value;
                    var lowercaseFilter = filter.toString().toLowerCase();
                    var lowercaseVal = mVal.toString().toLowerCase();
                    if (!_.contains(seen, value) && lowercaseVal.indexOf(lowercaseFilter) > -1) {
                        seen.push(value);
                    }
                }
                else {
                    if (!_.contains(seen, value)) {
                        seen.push(value);
                    }
                }
            }

            return _.sortBy(seen, function (v) { return v; });
        }

        function getAllFilterValues(data, column) {
            var seen = [];
            for (var i = 0; i < data.length; i++) {
                var value = data[i][column.field];

                if (!_.contains(seen, value)) {
                    seen.push(value);
                }
            }

            return _.sortBy(seen, function (v) { return v; });
        }

        function handleMenuItemClick(e) {
            var command = $(this).data("command");
            var columnDef = $(this).data("column");

            hideMenu();

            self.onCommand.notify({
                "grid": grid,
                "column": columnDef,
                "command": command
            }, e, self);

            e.preventDefault();
            e.stopPropagation();
        }

        $.extend(this, {
            "init": init,
            "destroy": destroy,
            "onFilterApplied": new Slick.Event(),
            "onCommand": new Slick.Event()
        });
    }
})(jQuery);