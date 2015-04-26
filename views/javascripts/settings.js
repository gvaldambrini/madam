var Settings = (function(window, $) {
    /// Private variables and functions
    var $form;
    var $formControls;

    var removeInput = function(event) {
        event.preventDefault();
        event.stopPropagation();
        $(this).parents('.form-group:first').remove();
    };

    var addInput = function(event) {
        event.preventDefault();
        var $newEntry = $(this).parents('.form-group:first').clone().appendTo($formControls);
        var $newInput = $newEntry.find('input');
        $newInput.val('');
        $newEntry.find('.btn-add').removeClass('btn-add').addClass('btn-remove').html(
            '<i class="glyphicon glyphicon-minus"></i>'
        ).on('click', removeInput);
    };

    var enableModifications = function(event) {
        event.preventDefault();
        event.stopPropagation();

        $formControls.find('input,button').each(function() {
            $(this).removeAttr('disabled');
        });
        var $btn = $form.find('button.btn-primary');
        $btn.text($btn.data('save-text'));
    };

    var init = function(options) {
        $form = $('#form');
        $form.find('button.btn-primary').one('click', enableModifications);
        $formControls = $('#form-controls');
        $formControls.find('.btn-remove').on('click', removeInput);
        $formControls.find('.btn-add').on('click', addInput);

        if (options.enabled) {
            $form.find('button.btn-primary').click();
        }
    };

    /// Public API
    return {
        init: init
    };
})(window, jQuery);