var Customers = (function(window, $) {
    /// Private variables and functions
    var templates;
    var originalHtml;
    var options;
    var $searchClear;
    var $searchInput;
    var $tableContainer;

    var deleteCustomer = function($target) {
        $.ajax({
            url: $target.data('delete-url'),
            method: 'POST',
            headers: {
                'X-CSRF-Token': options.csrfToken
            },
            complete: function(data) {
                window.location.reload();
            }
        });
    };

    var goToEditForm = function(event) {
        window.location.href = $(this).data('edit-url');
    };

    var search = function() {
        $searchClear.toggle(Boolean($(this).val()));
        var text = $(this).val();
        if (text) {
            $.ajax({
                url: options.urlSearch,
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
        var $trash;

        $tableContainer.html(html);
        $tableContainer.find('tbody tr').on("click", goToEditForm);
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
                    return deleteCustomer($item);
                }
            });
        });
    };

    var init = function(_templates, _customersData, _options) {
        templates = _templates;
        originalHtml = templates.customers_table(_customersData);
        options = _options;

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