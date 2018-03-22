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
        contentSelector: "#content",
        fieldSelector: ".kg-edit-field",
        editorControlsSelector: ".edit-dataset-controls"
    };

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

    window.Jekyller = function(options, secOptions) {
        var prior;
        this.options = options = $.extend({}, defaultOptions, options, secOptions);
        var allEditSelector = options.contentSelector+","+options.fieldSelector;

        $(options.editSelector).click(function(event) {
            var isOn = $(allEditSelector).attr("contenteditable");
            if(isOn) {
                $(options.contentSelector).html(prior);
            }
            else {
                prior = $(options.contentSelector).html();
                $(options.contentSelector).focus();
            }
            $(options.saveSelector).toggle();
            $(options.editorControlsSelector).toggle();
            $(".kg-menuitem").attr("draggable", isOn?null:true);
            $(allEditSelector).attr("contenteditable",isOn?null:true);
            event.preventDefault();
            return false;
        });

        $("body").on("click", ".kg-edit-add", function() {
            var list = $(this).parent().parent().find("> ul");
            list.children().last().clone().appendTo(list);
            return false;
        });

        $(options.saveSelector + ", " + options.createSelector).click(function(event) {
            var content = $(options.contentSelector).attr("contenteditable",null).html() || $(options.contentSelector).val(),
                title = $(options.titleSelector).val() || $(options.contentSelector).data("title"),
                data = {
                    title: title,
                    content: content,
                    name: $(options.contentSelector).data("name"),
                    date: $(options.contentSelector).data("date")
                };

            if(window.getDataSets) {
                var datasets = window.getDataSets();
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


        setupUserState(options);
    }
})(jQuery);