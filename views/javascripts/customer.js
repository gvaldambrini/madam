var Customer = (function(window, $) {
    /// Private variables and functions

    var customerData;

    var init = function(_language, _dateFormat, _customerData) {
        customerData = _customerData;
        $.fn.datepicker.defaults.language = _language;
        $.fn.datepicker.defaults.daysOfWeekDisabled = "0";
        $.fn.datepicker.defaults.format = _dateFormat;
        $.fn.datepicker.defaults.autoclose = true;
        $.fn.datepicker.defaults.weekStart = 1;
        $.fn.datepicker.defaults.todayHighlight = true;
        $.fn.datepicker.defaults.endDate = "0d";

        $form = $('#form');
        $form.find('input').each(function() {
            var name = $(this).attr('name');
            if (typeof customerData[name] !== 'undefined') {
                if (name == 'first_seen') {
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
        $('#first_seen-container .input-group.date').datepicker();
    };

    /// Public API
    return {
        init: init
    };

})(window, jQuery);