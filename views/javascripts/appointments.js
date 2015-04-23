var Appointments = (function(window, $) {
    /// Private variables and functions

    var init = function() {
        $('.table tbody tr').on("click", function(event) {
            window.location.href = $(this).data('edit-url');
        });
    }
    /// Public API
    return {
        init: init
    };
})(window, jQuery);