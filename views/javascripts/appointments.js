var Appointments = (function(window, $) {
    /// Private variables and functions
    var options;

    var deleteAppointment = function($target) {
        $.ajax({
            url: $target.data('delete-url'),
            method: 'POST',
            headers: {
                'X-CSRF-Token': options.csrfToken
            },
            complete: function() {
                window.location.reload();
            }
        });
    };

    var init = function(_options) {
        options = _options;
        var $table = $('#appointments-table');
        var $trash = $table.find('.glyphicon-trash');
        $trash.tooltip();

        $table.find('tbody tr').on("click", function(event) {
            window.location.href = $(this).data('edit-url');
        });
        $trash.on('click', function(event) {
            event.stopPropagation();
        });

        $trash.map(function(index, item) {
            var $item = $(item);
            $item.confirmPopover({
                template: '#popover-template',
                title: options.confirmTitle,
                content: options.confirmMsg,
                onConfirm: function() {
                    return deleteAppointment($item);
                }
            });
        });

    };
    /// Public API
    return {
        init: init
    };
})(window, jQuery);