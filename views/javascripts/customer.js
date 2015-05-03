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

        $form = $('#form');
        $form.find('input').each(function() {
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
        $form.find('textarea').val(customerData.notes);
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