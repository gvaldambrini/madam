var Products = (function(window, $) {
    /// Private variables and functions
    var templates;
    var options;
    var $searchClear;
    var $searchInput;
    var $tableContainer;

    var deleteProduct = function($target) {
        $.ajax({
            url: $target.data('delete-url'),
            method: 'POST',
            headers: {
                'X-CSRF-Token': options.csrfToken
            },
            complete: search
        });
    };

    var goToEditForm = function(event) {
        window.location.href = $(this).data('edit-url');
    };

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

    var resetSearch = function() {
        $searchInput.val('').focus();
        $(this).hide();
        search();
    };

    var renderTable = function(html) {
        $tableContainer.html(html);

        $clone = $tableContainer.find('.glyphicon-plus');
        $clone.on('click', function(event) {
            window.location.href = $(this).data('clone-url');
            event.stopPropagation();
        });

        $tableContainer.find('.hidden-row tbody tr').on("click", goToEditForm);

        $trash = $tableContainer.find('.glyphicon-trash');
        $trash.on('click', function(event) {
            event.stopPropagation();
        });
        $trash.map(function(index, item) {
            var $item = $(item);
            $item.confirmPopover({
                template: '#popover-template',
                title: options.confirmTitle,
                content: options.confirmMsg,
                $rootContainer: $tableContainer,
                onConfirm: function() {
                    return deleteProduct($item);
                }
            });
        });
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