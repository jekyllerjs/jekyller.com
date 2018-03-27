(function($){
    'use strict';
    var defaultOptions = {
        asPost: false,
        updateContentUrl: null,
        createPostUrl: null,
        editSelector: "#edit",
        saveSelector: "#save",
        createSelector: "#createNew",
        titleSelector: "#title",
        contentAreaSelector: ".kg-pageContent",
        contentSelector: ".kg-editSection, #content",
        fieldSelector: ".kg-edit-field",
        editorControlsSelector: ".edit-dataset-controls"
    };

    var allEditSelector = null;

    function setupUserState(options) {
        var user = window.localStorage.jkUser;
        user = user ? JSON.parse(user) : null;

        function setupMenu() {
            $("#login-menu").html("");
            if(user) {
                $("#login-menu").load("/fragments/loggedin.user.menu.html", function() {
                    $(".loggedin-menu").append(user.displayName);
                });
            }
            else {
                $("#login-menu").append("<a class='loginBtn' href='#'>Login</a>");
            }
        }
        setupMenu();

        $("body").trigger("jk.loginStateChange", user);

        $("body").on("click", ".loginBtn", function() {
            function showDialog() {
                $("#login-dialog").modal();
            }
            if($("#login-dialog").length == 0) {
                $.get("/fragments/dialog.login.html").then(function(html){
                    $(html).appendTo("body");
                    showDialog();
                });
            }
            else {
                showDialog();
            }
        });

        $("body").on("click", "#start-login", function() {
            var data = {
                userId: $("#userId").val(),
                pwd: $("#password").val()
            };

                $.ajax({
                    url: options.loginUrl,
                    type: "POST",
                    dataType: 'json',
                    contentType: 'application/json',
                    data: JSON.stringify(data),
                    cache: false,
                }).done(function(data) {
                    user = data;
                    window.localStorage.jkUser = JSON.stringify(data);
                    $("#login-dialog").modal('hide').modal('dispose');
                    setupMenu();
                    $("body").trigger("jk.loginStateChange", user);
                }).fail(function(jqXHR, textStatus, errorThrown) {
                    if(jqXHR.status == 403) {
                        alert("This account has been disabled.");
                    }
                    else if(jqXHR.status == 404) {
                        alert("unknown userid or password.");
                    }
                    else {
                        alert("A server error occured while logging in.");
                    }
                }); 
        });

        $("body").on("click", ".logout-btn", function() {
            user = null;
            window.localStorage.removeItem("jkUser");
            setupMenu();
            $("body").trigger("jk.loginStateChange", user);
        });
    }

    function isInEditMode() {
        var isOn = $(allEditSelector).attr("contenteditable");
        return isOn;
    }

    window.Jekyller = function(options, secOptions) {
        var prior;
        this.options = options = $.extend({}, defaultOptions, options, secOptions);

        allEditSelector = options.contentSelector+","+options.fieldSelector;

        $(options.editSelector).click(function(event) {
            var isOn = isInEditMode();
            if(isOn) {
                $(options.contentSelector).html(prior);
            }
            else {
                prior = $(options.contentSelector).html();
                $(options.contentSelector).focus();
            }
            $(options.saveSelector).toggle();
            $(options.editorControlsSelector).toggle();
            $(".kg-sub > ul > li").attr("draggable", isOn?null:true);
            $(allEditSelector).attr("contenteditable",isOn?null:true);
            event.preventDefault();
            return false;
        });

        $("body").on("click", ".kg-edit-add", function() {
            var list = $(this).parent().parent().find("> ul");
            setupDraggableOnHover(
                list.children().last().clone().appendTo(list).children()
            );
            return false;
        });

        $(options.saveSelector + ", " + options.createSelector).click(function(event) {
            var content = $(options.contentAreaSelector).attr("contenteditable",null).html() || $(options.contentAreaSelector).val(),
                title = $(options.titleSelector).val() || $(options.contentAreaSelector).data("title"),
                data = {
                    title: title,
                    content: content,
                    name: $(options.contentAreaSelector).data("name"),
                    date: $(options.contentAreaSelector).data("date")
                };

            if(options.useDataSets) {
                var datasets = getDataSets();
                $.ajax({
                    url: options.updateDataSetsUrl,
                    type: "POST",
                    dataType: 'json',
                    contentType: 'application/json',
                    data: JSON.stringify(datasets),
                    cache: false,
                    success: function(data) {
                        alert("done");
                    }
                });                 
            }
            else {
                $.ajax({
                    url: options.asPost ? options.createPostUrl : options.updateContentUrl,
                    type: "POST",
                    dataType: 'json',
                    contentType: 'application/json',
                    data: JSON.stringify(data),
                    cache: false,
                    success: function(data) {
                        alert("done");
                    }
                }); 
            }

            if($(this).is(options.saveSelector)) {
                $(options.saveSelector).hide();
            }
            $(options.editorControlsSelector).hide();
            $(allEditSelector).attr("contenteditable",null);

            event.preventDefault();
            return false;
        });   
        
        $("body").on("jk.loginStateChange", function(event, user) {
            if(user) {
                $(".edit-controls").show();
            }
            else {
                $(".edit-controls").hide();
            }
        });

        setupDataSetEditing(options);
        setupUserState(options);
    }

    function setupDataSetEditing(options) {
        var dragChild = null,
        draggedType = null;

        window.allowDrop = function(ev) {
            var target = ev.target,
                draggedType = $(dragChild).data("type"),
                supportDropType = "";

            if(target.tagName != "UL" && target.tagName != "LI") {
                target = target.parentElement;
            }
            supportDropType = $(target).data("dropType");
            if(target.tagName == "LI") {
                supportDropType = $(target.parentElement).data("dropType");
                if(supportDropType == draggedType) {
                    if($(target).index() > $(dragChild).index())
                        $(dragChild).insertAfter(target);
                    else
                        $(dragChild).insertBefore(target);
                }
            }
            else if(target.tagName == "UL" && supportDropType == draggedType) {
                $(dragChild).appendTo(target);
            }

            if(draggedType == supportDropType) {
                ev.preventDefault();
            }
            else {
                console.log("drag type:" + draggedType + " drop type:" + supportDropType);
            }
        };
    
        window.drag = function(ev) {
            dragChild = ev.target;
            draggedType = $(dragChild).data("type");
            console.log("drag start:" + draggedType);
            ev.dataTransfer.setData("text", draggedType);
        }
    
        window.drop = function(ev) {
            var target = ev.target,
                supportDropType = "";

            if(target.tagName != "UL" && target.tagName != "LI") {
                target = target.parentElement;
            }
            supportDropType = $(target).data("dropType");
            if(target.tagName == "LI") {
                supportDropType = $(target.parentElement).data("dropType");
                if(supportDropType == draggedType) {
                    $(dragChild).insertAfter(target);
                }
            }
            else if(target.tagName == "UL" && supportDropType == draggedType) {
                $(dragChild).appendTo(target);
            }

            ev.preventDefault();
        }
    
        $(".kg-sub > ul > li > div").each(function() {
            setupDraggableOnHover($(this));
        });
    }

    function setupDraggableOnHover($item) {
        $item.children().hover(
            function(){
                if(isInEditMode()) {
                    $item.parent().attr("draggable", null);
                }
            },
            function(){
                if(isInEditMode()) {
                    $item.parent().attr("draggable", true);
                }
            }
        );
    }

    function getDataSets() {
        function getItem(el, item) {
            var childEl = $(el),
                fieldName = childEl.data("field");                    
            item = item ? item : {};

            if(fieldName) {
                var isList = el.tagName == "UL";
                item[fieldName] = isList ? getList(el) : childEl.html();
            }
            else {
                $(el).children().each(function() {
                    getItem(this, item);
                });                   
            }
            return item;
        }

        function getList(baseEl) {
            var data = [];
            $(baseEl).children().each(function() {

                var item = getItem(this);
                if(item) {
                    data.push(item);
                }
            });

            return data;
        }

        var datasets = {};
        $(".kg-dataset").each(function() {
            var baseEl = $(this),
                isList = this.tagName=="UL",
                name = baseEl.data("dataSet"),
                data = isList?getList(baseEl):getItem(baseEl);
                    
            datasets[name] = data;
        });

        return datasets;
    }

})(jQuery);