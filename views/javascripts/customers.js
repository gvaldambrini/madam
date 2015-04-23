var Customers = (function(window, $) {
    /// Private variables and functions
    var templates;
    var originalHtml;
    var urlSearch;
    var $searchClear;
    var $searchInput;
    var $tableContainer;

    var goToEditForm = function(event) {
        window.location.href = $(this).data('edit-url');
    };

    var search = function() {
        $searchClear.toggle(Boolean($(this).val()));
        var text = $(this).val();
        if (text) {
            $.ajax({
                url: urlSearch,
                data: {
                    text: text
                },
                success: function(msg) {
                    renderTable(templates.customers_table(msg));
                }
            });
        }
        else {
            renderTable(originalHtml);
        }
    };

    var resetSearch = function() {
        $searchInput.val('').focus();
        $(this).hide();
        renderTable(originalHtml);
    };

    var renderTable = function(html) {
        $tableContainer.html(html);
        $('.table tbody tr').on("click", goToEditForm);
    };

    var init = function(_templates, _customers, _urlSearch) {
        templates = _templates;
        originalHtml = templates.customers_table(_customers);
        urlSearch = _urlSearch;

        $searchClear = $("#search-clear");
        $searchInput = $("#search-input");
        $tableContainer = $('#customers-table-container');

        renderTable(originalHtml);
        $searchInput.on('keyup', search);
        $searchClear.click(resetSearch);
    };

    /// Public API
    return {
        init: init
    };

})(window, jQuery);