var Products = (function(window, $) {
    /// Private variables and functions
    var templates;
    var options;
    var $searchClear;
    var $searchInput;
    var $tableContainer;

    var search = function() {
        var text = $searchInput.val();
        $searchClear.toggle(Boolean(text));
        $.ajax({
            url: options.urlSearch,
            data: {
                text: text
            },
            success: function(msg) {
                renderTable(templates.products_table(msg));
            }
        });
    };

    var goToCloneForm = function(event) {
        window.location.href = $(this).data('clone-url');
    };

    var resetSearch = function() {
        $searchInput.val('').focus();
        $(this).hide();
        search();
    };

    var renderTable = function(html) {
        $tableContainer.html(html);
        $tableContainer.find('.glyphicon-plus').on("click", goToCloneForm);
    };

    var init = function(_templates, _productsData, _options) {
        templates = _templates;
        options = _options;

        $searchClear = $("#search-clear");
        $searchInput = $("#search-input");
        $tableContainer = $('#products-table-container');

        renderTable(templates.products_table(_productsData));
        $searchInput.on('keyup', search);
        $searchClear.click(resetSearch);
    };

    /// Public API
    return {
        init: init
    };

})(window, jQuery);