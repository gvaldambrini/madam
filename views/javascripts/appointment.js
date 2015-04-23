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