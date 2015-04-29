var Appointment = (function(window, $) {
    /// Private variables and functions
    var $form;
    var dateFormat;
    var language;
    var date;

    var switchWorker = function() {
        // change the current worker to be the next one
        var $this = $(this);
        var $groupBtn = $(this).closest('.input-group-btn');
        var $workers = $groupBtn.find('ul a');
        var newIndex = 0;
        for (var i = 0; i < $workers.length; i++) {
            if ($($workers[i]).text() == $this.text()) {
                newIndex = (i + 1) % $workers.length;
                break;
            }
        }
        var $newWorker = $($workers[newIndex]);

        $groupBtn.find('input').val($newWorker.text());
        $this.text($newWorker.text());
        $this.css('color', $newWorker.css('color'));
    };

    var selectWorker = function() {
        // set the current worker from the selected one in the dropdown
        var $this = $(this);
        var newText = $this.text();
        var newColor = $this.css('color');

        var $groupBtn = $this.closest('.input-group-btn');
        var $btn = $groupBtn.find('button:eq(0)');
        $btn.text(newText);
        $btn.css('color', newColor);
        $groupBtn.find('input').val(newText);
    };

    var addInput = function(event) {
        event.preventDefault();
        var $newInput = $form.find('.service:eq(0)').clone();
        $newInput.appendTo($form.find('#dynamic-fields-container'));

        $newInput.find('.input-group-btn button.btn-click').on('click', switchWorker);
        $newInput.find('.input-group-btn ul a').on('click', selectWorker);
        $newInput.find('input[type="text"]').val('');

        var $worker = $newInput.find('ul a:eq(0)');
        $newInput.find('input[type="checkbox"]').val($form.find('.service').length - 1);
        $newInput.find('input[type="hidden"]').val($worker.text());
        var $btn = $newInput.find('button:eq(0)');
        $btn.text($worker.text());
        $btn.css('color', $worker.css('color'));

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
        $form.find('.btn-add').on('click', addInput);
    };

    /// Public API
    return {
        init: init
    };

})(window, jQuery);