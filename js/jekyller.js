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
        contentSelector: "#content"
    };

    window.Jekyller = function(options, secOptions) {
        var prior;
        options = $.extend({}, defaultOptions, options, secOptions);

        $(options.editSelector).click(function(event) {
            var isOn = $(options.contentSelector).attr("contenteditable");
            if(isOn) {
                $(options.contentSelector).html(prior);
            }
            else {
                prior = $(options.contentSelector).html();
                $(options.contentSelector).focus();
            }
            $(options.saveSelector).toggle();
            $(options.contentSelector).attr("contenteditable",isOn?null:true);
            event.preventDefault();
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

            if($(this).is(options.saveSelector)) {
                $(options.saveSelector).toggle();
            }

            event.preventDefault();
            return false;
        });    
    }
})(jQuery);