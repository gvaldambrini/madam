var Product = (function(window, $) {
    /// Private variables and functions

    var productData;

    var init = function(_language, _dateFormat, _productData) {
        productData = _productData;
        $.fn.datepicker.defaults.language = _language;
        $.fn.datepicker.defaults.orientation = "top";
        $.fn.datepicker.defaults.daysOfWeekDisabled = "0";
        $.fn.datepicker.defaults.format = _dateFormat;
        $.fn.datepicker.defaults.autoclose = true;
        $.fn.datepicker.defaults.weekStart = 1;
        $.fn.datepicker.defaults.todayHighlight = true;
        $.fn.datepicker.defaults.endDate = "0d";

        $form = $('#form');
        $form.find('input').each(function() {
            var name = $(this).attr('name');
            if (typeof productData[name] !== 'undefined') {
                if (name == 'sold_date') {
                    $('#' + name + '-container .input-group.date').datepicker(
                        'setDate', productData[name]);
                }
                else {
                    $(this).val(productData[name]);
                }
            }
        });
        $form.find('textarea').val(productData.notes);
        $('#sold_date-container .input-group.date').datepicker();
    };

    /// Public API
    return {
        init: init
    };

})(window, jQuery);