var Appointment = (function(window, $) {
    /// Private variables and functions
    var $form;
    var dateFormat;
    var language;
    var date;

    var switchWorker = function() {
        // change the current worker to be the next one
        var $groupBtn = $(this).closest('.input-group-btn');
        var $workers = $groupBtn.find('ul a').map(function() { return $(this).text(); });
        var newIndex = ($.inArray($(this).text(), $workers) + 1) % $workers.length;
        var newText = $workers[newIndex];

        $(this).text(newText);
        $groupBtn.find('input').val(newText);
    };

    var selectWorker = function() {
        // set the current worker from the selected one in the dropdown
        var newText = $(this).text();

        var $groupBtn = $(this).closest('.input-group-btn');
        $groupBtn.find('button:eq(0)').text(newText);
        $groupBtn.find('input').val(newText);
    };

    var init = function(_language, _date, _dateFormat) {
        language = _language;
        date = _date;
        dateFormat = _dateFormat;
        $form = $('#form');
        $.fn.datepicker.defaults.format = dateFormat;

        $form.find('.input-group-btn button.btn-click').on('click', switchWorker);
        $form.find('.input-group-btn ul a').on('click', selectWorker);
        $form.find('#date-container .input-group.date').datepicker({
            orientation: "top left",
            language: language,
            format: dateFormat,
            weekStart: 1,
            daysOfWeekDisabled: "0",
            autoclose: true,
            todayHighlight: true,
            endDate: "0d"
        });

        $form.find('#date-container .input-group.date').datepicker('setDate', date);
    };

    /// Public API
    return {
        init: init
    };

})(window, jQuery);
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
var Customer = (function(window, $) {
    /// Private variables and functions

    var customerData;
    var dateFormat;
    var language;

    var init = function(_language, _dateFormat, _customerData) {
        language = _language;
        dateFormat = _dateFormat;
        customerData = _customerData;
        $.fn.datepicker.defaults.format = dateFormat;

        $('form input').each(function() {
            var name = $(this).attr('name');
            if (typeof customerData[name] !== 'undefined') {
                if (name == 'first_see' || name == 'last_see') {
                    $('#' + name + '-container .input-group.date').datepicker(
                        'setDate', customerData[name]);
                }
                else if (name == 'allow_sms' || name == 'allow_email') {
                    if (customerData[name])
                        $(this).attr('checked', 'checked');
                }
                else {
                    $(this).val(customerData[name]);
                }
            }
        });
        $('#first_see-container .input-group.date').datepicker({
            language: language,
            format: dateFormat,
            weekStart: 1,
            daysOfWeekDisabled: "0",
            autoclose: true,
            todayHighlight: true,
            endDate: "0d"
        });
        $('#last_see-container .input-group.date').datepicker({
            language: language,
            format: dateFormat,
            weekStart: 1,
            daysOfWeekDisabled: "0",
            autoclose: true,
            todayHighlight: true,
            endDate: "0d"
        });
    };

    /// Public API
    return {
        init: init
    };

})(window, jQuery);
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
var Settings = (function(window, $) {
    /// Private variables and functions
    var $form;
    var $formControls;

    var removeInput = function(event) {
        event.preventDefault();
        event.stopPropagation();
        $(this).parents('.form-group:first').remove();
        checkDirties();
    };

    var addInput = function(event) {
        event.preventDefault();
        var $newEntry = $(this).parents('.form-group:first').clone().appendTo($formControls);
        var $newInput = $newEntry.find('input');
        $newInput.val('');
        $newInput.data('original-value', '');
        $newInput.removeClass('dirty');
        $newInput.on('keyup', checkIfDirty);
        $newEntry.find('.btn-add').removeClass('btn-add').addClass('btn-remove').html(
            '<i class="glyphicon glyphicon-minus"></i>'
        ).on('click', removeInput);
    };

    var checkDirties = function() {
        // Loop over all the input fields to verify if someone is dirty or the original
        // number of inputs is different from the current one.
        // As result of the check, it sets the submit button disabled or active.

        function filterDirty(e) {
            return $(this).hasClass('dirty');
        }
        var $inputs = $formControls.find('input');

        if ($inputs.filter(filterDirty).length == 0 &&
            $inputs.length == $formControls.data('original-length')) {
            $form.find('.btn-primary').attr('disabled', 'disabled');
        }
        else {
            $form.find('.btn-primary').removeAttr('disabled');
        }
    };

    var checkIfDirty = function(event) {
        // Check if an input field is dirty (is modified)
        var dirty = $(this).val() != $(this).data('original-value');
        if (dirty) {
            $(this).addClass('dirty');
            // there is no need to check every field, we can just enable
            // the submit button.
            $form.find('.btn-primary').removeAttr('disabled');
        }
        else {
            $(this).removeClass('dirty');
            checkDirties();
        }
    };

    var init = function() {
        // Set the initial state on the input elements to detect if any of them
        // has been modified.
        $form = $('#form');
        $formControls = $('#form-controls');

        var $inputs = $formControls.find('input');
        $formControls.data('original-length', $inputs.length);

        $inputs.on('keyup', checkIfDirty);
        $formControls.find('.btn-remove').on('click', removeInput);
        $formControls.find('.btn-add').on('click', addInput);
    };

    /// Public API
    return {
        init: init
    };
})(window, jQuery);