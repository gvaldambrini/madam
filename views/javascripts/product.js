var Product = (function(window, $) {
    /// Private variables and functions

    var productData;
    var dateFormat;
    var language;

    var init = function(_language, _dateFormat, _productData) {
        language = _language;
        dateFormat = _dateFormat;
        productData = _productData;
        $.fn.datepicker.defaults.format = dateFormat;

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
        $('#sold_date-container .input-group.date').datepicker({
            language: language,
            format: dateFormat,
            weekStart: 1,
            daysOfWeekDisabled: "0",
            autoclose: true,
            todayHighlight: true,
            orientation: "top",
            endDate: "0d"
        });
    };

    /// Public API
    return {
        init: init
    };

})(window, jQuery);